# Library Management System — Code Review

> Reviewed: 2026-10-08  
> Scope: Full project (backend + frontend)

---

## 1. Root Cause: Why `available_quantity` is Not Syncing on Approval

### The actual bug

The sync code inside `AdminOnlyBorrowingAPIView.patch()` looks correct on the surface — it wraps everything in `transaction.atomic()`, decrements `available_quantity`, and calls `.save()`. But there are **two separate problems** that can silently break this:

---

### Problem 1 — Stale object from `BorrowRequest` relation (race condition / stale cache)

```python
# borrowing/views.py
borrowing = get_object_or_404(BorrowRequest, id=id)
...
borrowing.book.available_quantity -= 1
borrowing.book.save()
```

`borrowing.book` is Django's cached related object. When you access it this way, Django fetches the book **once** and caches it on the instance. If two admin requests hit this endpoint at the same time for the same book, both will read the same stale `available_quantity` value, both will decrement it from the same number, and both `.save()` calls will overwrite each other. The quantity ends up only decremented by 1 instead of 2.

**Fix:** Use `select_for_update()` inside the transaction to lock the book row:

```python
with transaction.atomic():
    book = Books.objects.select_for_update().get(id=borrowing.book_id)
    book.available_quantity -= 1
    book.save()
    ...
```

Or use an atomic F-expression:
```python
from django.db.models import F
Books.objects.filter(id=borrowing.book_id).update(available_quantity=F('available_quantity') - 1)
```

---

### Problem 2 — `available_quantity` check happens OUTSIDE the transaction

```python
# This check is before the atomic block:
if borrowing.book.available_quantity <= 0:
    return Response(...)

# ...then later:
with transaction.atomic():
    borrowing.book.available_quantity -= 1
    borrowing.book.save()
```

The availability check and the decrement are **not atomic**. Between the check and the actual save, another request can slip through. This is a classic TOCTOU (time-of-check/time-of-use) bug. The check needs to be inside `transaction.atomic()` alongside the update, ideally using `select_for_update()`.

---

### Problem 3 — `BorrowRequestSerializer.validate()` also checks availability, but on POST not PATCH

```python
# borrowing/serializers.py
def validate(self, attrs):
    book = attrs["book"]
    if book.available_quantity <= 0:
        raise serializers.ValidationError("This book is currently unavailable.")
    return attrs
```

This validation only runs when `book` is in `attrs`, which happens on `POST` (new request creation). During the admin `PATCH` (approval), `book_id` is not being sent, so this guard never runs. **The guard that exists is in the wrong place and gives false confidence that availability is validated.**

---

### Problem 4 — No `is_available` boolean flag exists

The question asks about an "availability flag not syncing." There is no dedicated boolean `is_available` field anywhere on the `Books` model. The availability is derived from `available_quantity`. If the frontend or some consumer expects a boolean `is_available` field, it does not exist and will never be returned. The `available_quantity` field is what gets updated — if the frontend relies on a flag, it needs to derive it from `available_quantity > 0`.

---

## 2. Other Bugs

### `BorrowingHistoryAPIView` is broken (syntax error / incomplete code)

```python
# borrowing/views.py — bottom of the file
class BorrowingHistoryAPIView(APIView):
    permission_classes = [AdminOnlyBorrowingHistory]

    def get(self, request, id=None):
        if id:
            user = request.user
            books = Books.objects.filter(user=user)
            books = books.filter("returned_date", books.returned_date)  # ← BROKEN
```

This line is invalid Python and will throw a `TypeError` at runtime. `.filter()` doesn't work like that. The `BorrowingHistory` model is also commented out in `models.py`, so this whole view is half-finished and effectively dead code.

---

### `RegisterSerializer.create()` does not hash passwords

```python
# users/serializers.py
def create(self, validated_data):
    return User.objects.create(**validated_data)
```

`User.objects.create()` stores the password as **plain text**. It must be `User.objects.create_user()` which properly hashes the password. Any user registered through the API cannot log in through normal Django auth because `authenticate()` compares against the hashed password. This is a security bug.

---

### `LoginAPIView` credential check is wrong

```python
if username == "" and password == "":
```

This only catches the case where **both** are empty. If username is empty but password is provided, or vice versa, the condition passes and `authenticate()` is called with empty credentials, which returns `None` and falls through to "Invalid Credentials". The check should use `or`, not `and`.

---

### Duplicate URL name in `borrowing/urls.py`

```python
path("user/", UserBorrowingRequestAPIView.as_view(), name="user_borrowing"),
path("history/", UserBorrowingRequestAPIView.as_view(), name="user_borrowing"),  # same name
```

Two different paths have the same `name="user_borrowing"`. Django will silently use the last one when you call `reverse("user_borrowing")`, making the first route unreachable by name. The history route also incorrectly points to `UserBorrowingRequestAPIView` instead of `BorrowingHistoryAPIView`.

---

### `AdminOnlyBorrowingHistory` and `UserOnlyBorrowingHistory` permissions never work

```python
class AdminOnlyBorrowingHistory(BasePermission):
    def has_object_permission(self, request, view, obj):
        ...
```

Both history permission classes only implement `has_object_permission`. This method is only called by DRF after `has_permission` passes. Since there is no `has_permission` defined, it defaults to `True` for authenticated users — but `has_object_permission` is only invoked when you call `self.check_object_permissions(request, obj)` explicitly in the view. The `BorrowingHistoryAPIView.get()` never calls this, so these permission classes do nothing.

---

### `DEBUG` setting loaded from env as a string, not a boolean

```python
DEBUG = os.getenv("DEBUG")
```

`os.getenv()` returns a string, e.g. `"False"`. Django's `DEBUG` must be a Python boolean. If `.env` has `DEBUG=False`, this evaluates to the string `"False"` which is truthy, so debug mode is **always on** regardless of what's in the env file.

Fix:
```python
DEBUG = os.getenv("DEBUG", "False").lower() == "true"
```

---

### No CORS configuration

`corsheaders` is not installed. The frontend (running on a different port) will have its requests blocked by the browser with CORS errors. `django-cors-headers` needs to be added to `INSTALLED_APPS` and `MIDDLEWARE`, and `CORS_ALLOWED_ORIGINS` needs to be configured.

---

### No return value when book is not returned (book return flow is missing entirely)

When a book is returned, `available_quantity` needs to be incremented back. There is no endpoint, no model field for `returned_at`, and no logic for handling book returns. The `BorrowingHistory` model was started but commented out. This is the other half of why availability tracking is unreliable — quantities only go down, never back up.

---

## 3. Design & Architecture Issues

### `Books.user` — unclear ownership semantics

The `Books` model has a `user` ForeignKey that appears to represent "who added this book" (an admin), but the field name `user` is generic and confusing. It should be named `added_by` or `created_by`.

### No pagination on list endpoints

`AdminOnlyBorrowingAPIView.get()` returns all borrow requests with no pagination. `BooksAPIView.get()` returns all books. As data grows this will be slow and return huge payloads. DRF's built-in `PageNumberPagination` should be added.

### Token auth with no expiry

The project uses DRF's `TokenAuthentication` which issues tokens that never expire. There is no logout endpoint that deletes the token. Consider using `rest_framework_simplejwt` for expiring tokens, or at minimum add a logout view that calls `request.user.auth_token.delete()`.

### No `returned_date` / book return tracking

As noted above — there is no lifecycle for a borrowed book being returned. The system can approve borrows but never complete the cycle.

### `BorrowRequest` has no `rejected_by` or rejection reason

The model has `approved_by` and `approved_days` but no equivalent fields for rejection. If an admin rejects a request, there is no way to record who rejected it or why.

### `available_quantity` can go negative

`available_quantity` is a `PositiveIntegerField` which in Django means it's validated at the model/form level, but raw `.save()` calls bypass this. A database-level `CHECK (available_quantity >= 0)` constraint is not added by Django automatically for `PositiveIntegerField`. Under concurrent load, the quantity could theoretically go negative.

---

## 4. Code Quality Issues

### `print()` statement left in production code

```python
# users/views.py
print(username, password)
```

This logs credentials to stdout in production. Remove it.

### `BorrowingHistory` model is commented out

Half-written, commented-out model code is left in `borrowing/models.py`. Either finish it or remove it.

### Frontend is the default Vite scaffold

`frontend/src/App.tsx` is the unmodified Vite starter template. No actual UI has been built. The frontend has no routing, no API calls, no pages — it's completely disconnected from the backend.

### `MAILERS` setting is wrong key

```python
# settings.py
MAILERS = {
    "default": {
        "BACKEND": "django.core.mail.backends.console.EmailBackend",
    },
}
```

Django uses `EMAIL_BACKEND`, not `MAILERS`. This setting does nothing. Email will use Django's default (SMTP) and likely fail silently.

### No `requirements.txt` or `pyproject.toml`

There is no dependency file for the backend. Anyone cloning the project has no way to install dependencies without guessing. Add a `requirements.txt`.

### No tests

`tests.py` files exist in all three apps but are all empty. There are zero tests in the project.

### Typo in project folder name

The project root is named `library-management-syetem` (missing the 's' in "system"). Minor but worth fixing.

---

## 5. Summary Table

| Area | Issue | Severity |
|------|-------|----------|
| Borrowing | Race condition on `available_quantity` decrement | 🔴 Critical |
| Borrowing | TOCTOU: availability check outside transaction | 🔴 Critical |
| Users | Passwords stored in plain text | 🔴 Critical |
| Borrowing | No book return flow / quantity never restored | 🔴 Critical |
| Settings | `DEBUG` always `True` regardless of env value | 🔴 Critical |
| Borrowing | `BorrowingHistoryAPIView` broken / syntax error | 🔴 Critical |
| Users | Login empty-check uses `and` instead of `or` | 🟠 High |
| Borrowing | History permission classes never actually enforce | 🟠 High |
| Settings | No CORS configuration | 🟠 High |
| Users | No logout endpoint | 🟠 High |
| Borrowing | Duplicate URL name, history route wrong view | 🟡 Medium |
| Settings | `MAILERS` key is wrong, email config broken | 🟡 Medium |
| Users | `print(username, password)` in login view | 🟡 Medium |
| Books | No pagination on list endpoints | 🟡 Medium |
| General | No `requirements.txt` | 🟡 Medium |
| General | No tests | 🟡 Medium |
| Frontend | No UI built, still default Vite scaffold | 🟡 Medium |
| Borrowing | No `rejected_by` / rejection reason on model | 🟢 Low |
| Books | `user` field name ambiguous, should be `added_by` | 🟢 Low |
| General | Tokens never expire, no rotation | 🟢 Low |
