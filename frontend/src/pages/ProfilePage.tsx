import { useEffect, useState, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { authService } from "../services/authService";
import { useAppDispatch, useAuth } from "../hooks/useAuth";
import { updateUser } from "../store/authSlice";
import Alert from "../components/ui/Alert";
import { isApiError } from "../utils/errors";
import { mediaUrl } from "../utils/media";

type ProfileForm = {
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  image?: FileList;
};

export default function ProfilePage() {
  const { user } = useAuth();
  const dispatch = useAppDispatch();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setError: setFieldError,
    formState: { errors, isSubmitting },
  } = useForm<ProfileForm>();

  useEffect(() => {
    if (!user) return;
    reset({
      username: user.username,
      first_name: user.first_name ?? "",
      last_name: user.last_name ?? "",
      email: user.email ?? "",
      phone: user.phone ?? "",
    });
  }, [user, reset]);

  const onSubmit = async (values: ProfileForm) => {
    setError(null);
    setMessage(null);
    const payload = new FormData();
    payload.append("username", values.username);
    payload.append("first_name", values.first_name);
    payload.append("last_name", values.last_name);
    payload.append("email", values.email);
    const phone = values.phone.trim();
    if (!phone && user?.phone) {
      setFieldError("phone", {
        type: "validate",
        message: "Enter a replacement phone number or leave the current number unchanged.",
      });
      return;
    }
    if (phone) payload.append("phone", phone);
    if (values.image?.[0]) payload.append("image", values.image[0]);

    try {
      const updated = await authService.updateProfile(payload);
      dispatch(updateUser(updated));
      setMessage("Profile updated successfully.");
    } catch (err) {
      if (isApiError(err)) {
        const firstField = Object.values(err.fields)[0];
        setError(firstField || err.message);
        return;
      }
      setError("Unable to update profile.");
    }
  };

  const avatar = mediaUrl(user?.image);

  return (
    <main className="mx-auto max-w-[640px] px-6 py-12 max-md:px-4">
      <h1 className="font-serif text-3xl font-semibold">My profile</h1>
      <p className="mt-2 text-sm text-ink-muted">
        Staff status is read-only. Role changes are made on the server.
      </p>

      {user?.is_staff ? (
        <p className="mt-4 rounded-lg bg-ok-bg px-3 py-2 text-sm text-ok-text">You have staff access.</p>
      ) : null}

      <div className="mt-6 flex items-center gap-4">
        {avatar ? (
          <img src={avatar} alt="" className="size-16 rounded-full object-cover" />
        ) : (
          <div className="flex size-16 items-center justify-center rounded-full bg-brand text-white">
            {user?.username.slice(0, 1).toUpperCase()}
          </div>
        )}
        <div>
          <p className="font-medium">{user?.username}</p>
          <p className="text-sm text-ink-muted">{user?.email || "No email"}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4" noValidate>
        {error ? <Alert tone="error">{error}</Alert> : null}
        {message ? <Alert tone="success">{message}</Alert> : null}

        <Field label="Username" error={errors.username?.message}>
          <input
            className={inputClass}
            {...register("username", { required: "Username is required." })}
          />
        </Field>
        <Field label="First name" error={errors.first_name?.message}>
          <input className={inputClass} {...register("first_name")} />
        </Field>
        <Field label="Last name" error={errors.last_name?.message}>
          <input className={inputClass} {...register("last_name")} />
        </Field>
        <Field label="Email" error={errors.email?.message}>
          <input type="email" className={inputClass} {...register("email")} />
        </Field>
        <Field label="Phone" error={errors.phone?.message}>
          <input
            className={inputClass}
            maxLength={15}
            {...register("phone", {
              maxLength: { value: 15, message: "Phone must be 15 characters or fewer." },
            })}
          />
        </Field>
        <Field label="Profile image">
          <input type="file" accept="image/*" className="text-sm" {...register("image")} />
        </Field>

        <button
          type="submit"
          disabled={isSubmitting}
          className="h-10 rounded-lg bg-brand px-4 text-sm font-medium text-white hover:bg-brand-hover disabled:opacity-60"
        >
          {isSubmitting ? "Saving…" : "Save profile"}
        </button>
      </form>
    </main>
  );
}

const inputClass = "mt-1.5 h-10 w-full rounded-lg border border-line bg-white px-3 text-ink outline-none focus:border-brand";

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="block text-sm font-medium text-ink">
      {label}
      {children}
      {error ? <p className="mt-1 text-sm font-normal text-danger">{error}</p> : null}
    </label>
  );
}
