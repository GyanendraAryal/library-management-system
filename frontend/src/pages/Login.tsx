import { useState, type InputHTMLAttributes } from "react";
import { useForm } from "react-hook-form";
import { Eye, EyeOff } from "lucide-react";
import { useLocation, useNavigate } from "react-router";
import { authService } from "../services/authService";
import { setCredentials } from "../store/authSlice";
import { useAppDispatch } from "../hooks/useAuth";
import { isApiError } from "../utils/errors";
import Alert from "../components/ui/Alert";

type Mode = "signin" | "register";

type FormValues = {
  username: string;
  password: string;
  first_name: string;
  last_name: string;
  email: string;
};

const USERNAME_PATTERN = /^[\w.@+-]+$/;
const USERNAME_MAX_LENGTH = 150;

export default function Login() {
  const [mode, setMode] = useState<Mode>("signin");
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? "/catalogue";

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    mode: "onSubmit",
    defaultValues: {
      username: "",
      password: "",
      first_name: "",
      last_name: "",
      email: "",
    },
  });

  const onSubmit = async (values: FormValues) => {
    setFormError(null);
    try {
      if (mode === "signin") {
        const response = await authService.login({
          username: values.username,
          password: values.password,
        });
        dispatch(setCredentials({ user: response.user, token: response.token }));
        navigate(from, { replace: true });
        return;
      }

      const response = await authService.register({
        username: values.username,
        password: values.password,
        first_name: values.first_name,
        last_name: values.last_name,
        email: values.email,
      });
      localStorage.setItem("token", response.token);
      const profile = await authService.getProfile();
      dispatch(setCredentials({ user: profile, token: response.token }));
      navigate("/catalogue", { replace: true });
    } catch (error) {
      if (isApiError(error)) {
        const fieldKeys = ["username", "password", "email", "first_name", "last_name"] as const;
        let assigned = false;
        for (const key of fieldKeys) {
          if (error.fields[key]) {
            setError(key, { message: error.fields[key] });
            assigned = true;
          }
        }
        if (!assigned) setFormError(error.message);
        return;
      }
      if (error instanceof Error && error.name === "ApiConfigurationError") {
        setFormError(error.message);
        return;
      }
      setFormError("Unable to reach the server. Please try again.");
    }
  };

  return (
    <main className="mx-auto flex max-w-[1080px] justify-center px-6 py-12 max-md:px-4">
      <div className="w-full max-w-md rounded-2xl border border-line bg-surface p-8 shadow-sm">
        <h1 className="font-serif text-2xl font-semibold tracking-tight text-ink">
          {mode === "signin" ? "Welcome back" : "Create your account"}
        </h1>
        <p className="mt-1 text-sm text-ink-muted">
          {mode === "signin"
            ? "Sign in with your username and password."
            : "Registration creates a member account. Staff access is granted on the server."}
        </p>

        <div role="tablist" className="mt-6 grid grid-cols-2 rounded-lg bg-surface-muted p-1">
          {(["signin", "register"] as const).map((tab) => {
            const active = mode === tab;
            return (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => {
                  setMode(tab);
                  setFormError(null);
                }}
                className={`rounded-md py-2 text-sm font-medium transition ${
                  active ? "bg-surface text-ink shadow-sm" : "text-ink-muted hover:text-ink"
                }`}
              >
                {tab === "signin" ? "Sign in" : "Create account"}
              </button>
            );
          })}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-5" noValidate>
          {formError ? <Alert tone="error">{formError}</Alert> : null}

          {mode === "register" ? (
            <>
              <Field
                id="first_name"
                label="First name"
                error={errors.first_name?.message}
                {...register("first_name")}
              />
              <Field
                id="last_name"
                label="Last name"
                error={errors.last_name?.message}
                {...register("last_name")}
              />
              <Field
                id="email"
                label="Email"
                type="email"
                error={errors.email?.message}
                {...register("email", {
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: "Enter a valid email address.",
                  },
                })}
              />
            </>
          ) : null}

          <Field
            id="username"
            label="Username"
            autoComplete="username"
            maxLength={USERNAME_MAX_LENGTH}
            error={errors.username?.message}
            {...register("username", {
              required: "Username is required.",
              maxLength: {
                value: USERNAME_MAX_LENGTH,
                message: `Username must be ${USERNAME_MAX_LENGTH} characters or fewer.`,
              },
              pattern: {
                value: USERNAME_PATTERN,
                message: "Use letters, digits, and @ . + - _",
              },
            })}
          />

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-ink">
              Password
            </label>
            <div className="relative mt-1.5">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                aria-invalid={!!errors.password}
                className="w-full rounded-lg border border-line bg-white py-2.5 pl-3 pr-10 text-ink outline-none focus:border-brand"
                {...register("password", {
                  required: "Password is required.",
                  minLength:
                    mode === "register"
                      ? { value: 8, message: "Use at least 8 characters." }
                      : undefined,
                })}
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-ink-muted hover:text-ink"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password ? <p className="mt-1.5 text-sm text-danger">{errors.password.message}</p> : null}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-brand py-2.5 font-semibold text-white hover:bg-brand-hover disabled:opacity-60"
          >
            {isSubmitting ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>
      </div>
    </main>
  );
}

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

function Field({ label, error, id, ...props }: FieldProps) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-ink">
        {label}
      </label>
      <input
        id={id}
        aria-invalid={!!error}
        className={`mt-1.5 w-full rounded-lg border bg-white px-3 py-2.5 text-ink outline-none ${
          error ? "border-danger" : "border-line focus:border-brand"
        }`}
        {...props}
      />
      {error ? <p className="mt-1.5 text-sm text-danger">{error}</p> : null}
    </div>
  );
}
