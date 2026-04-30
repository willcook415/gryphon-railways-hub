"use client";

import { type FormEvent, type ReactNode, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, LoaderCircle, Lock, Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

function Field({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-slate-200" htmlFor={id}>
        {label}
      </label>
      {children}
    </div>
  );
}

const fieldFrameClassName =
  "flex h-12 w-full items-center gap-3 rounded-md border border-slate-700 bg-slate-950 px-3 transition-colors focus-within:border-slate-400 focus-within:ring-2 focus-within:ring-slate-500/20 sm:h-11";

const inputClassName =
  "min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-500 disabled:cursor-not-allowed disabled:opacity-60";

function getFriendlyAuthError(message: string) {
  const normalizedMessage = message.toLowerCase();

  if (
    normalizedMessage.includes("invalid login credentials") ||
    normalizedMessage.includes("email not confirmed")
  ) {
    return "Could not log in. Check your email and password, or ask a Gryphon Hub admin to add your account.";
  }

  return message;
}

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  function validateForm() {
    if (!email.trim()) {
      return "Enter your email address.";
    }

    if (!password) {
      return "Enter your password.";
    }

    return null;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    setIsSubmitting(false);

    if (signInError) {
      setError(getFriendlyAuthError(signInError.message));
      return;
    }

    router.replace("/dashboard");
    router.refresh();
  }

  return (
    <div className="space-y-5">
      <form className="space-y-4" onSubmit={handleSubmit}>
        <Field id="email" label="Email">
          <div className={fieldFrameClassName}>
            <Mail aria-hidden="true" className="size-4 shrink-0 text-slate-500" />
            <input
              autoComplete="email"
              className={inputClassName}
              disabled={isSubmitting}
              id="email"
              inputMode="email"
              name="email"
              onChange={(event) => setEmail(event.target.value)}
              placeholder="user@leeds.ac.uk"
              required
              type="email"
              value={email}
            />
          </div>
        </Field>

        <Field id="password" label="Password">
          <div className={fieldFrameClassName}>
            <Lock aria-hidden="true" className="size-4 shrink-0 text-slate-500" />
            <input
              autoComplete="current-password"
              className={inputClassName}
              disabled={isSubmitting}
              id="password"
              name="password"
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
              required
              type={showPassword ? "text" : "password"}
              value={password}
            />
            <button
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="flex size-8 shrink-0 items-center justify-center rounded text-slate-500 transition-colors hover:bg-slate-800 hover:text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500/40"
              disabled={isSubmitting}
              onClick={() => setShowPassword((current) => !current)}
              type="button"
            >
              {showPassword ? (
                <EyeOff className="size-4" aria-hidden="true" />
              ) : (
                <Eye className="size-4" aria-hidden="true" />
              )}
            </button>
          </div>
        </Field>

        {error ? (
          <p className="rounded-md border border-red-900/60 bg-red-950/40 px-3 py-2 text-sm leading-6 text-red-200">
            {error}
          </p>
        ) : null}

        <button
          className="flex h-12 w-full items-center justify-center rounded-md bg-white text-sm font-semibold text-slate-950 transition hover:bg-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 disabled:pointer-events-none disabled:opacity-70 sm:h-11"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? (
            <>
              <LoaderCircle
                className="mr-2 size-4 animate-spin motion-reduce:animate-none"
                aria-hidden="true"
              />
              Logging in...
            </>
          ) : (
            "Log in"
          )}
        </button>
      </form>

      <p className="text-center text-sm leading-6 text-slate-400">
        Need access? Ask a Gryphon Hub admin to add your account.
      </p>
    </div>
  );
}
