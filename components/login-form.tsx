"use client";

import { type FormEvent, type ReactNode, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Eye,
  EyeOff,
  Lock,
  Mail,
  ShieldCheck,
  UserRound,
} from "lucide-react";
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
    <div className="space-y-2.5">
      <label
        className="block text-sm font-semibold text-[#d8b76a] sm:text-base"
        htmlFor={id}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

const fieldFrameClassName =
  "flex h-14 w-full items-center gap-3 rounded-xl border border-[#bccbdc]/20 bg-[#091a2c] px-4 transition-colors focus-within:border-[#d8b76a]/65 focus-within:ring-2 focus-within:ring-[#d8b76a]/15 sm:h-[60px]";

const inputClassName =
  "min-w-0 flex-1 bg-transparent text-base text-[#f4f7fa] outline-none placeholder:text-[#8796a8] disabled:cursor-not-allowed disabled:opacity-60 sm:text-lg";

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
    <div className="space-y-5 sm:space-y-6">
      <form className="space-y-4 sm:space-y-5" onSubmit={handleSubmit}>
        <Field id="email" label="Email">
          <div className={fieldFrameClassName}>
            <Mail
              aria-hidden="true"
              className="size-5 shrink-0 text-[#8796a8] sm:size-6"
            />
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
            <Lock
              aria-hidden="true"
              className="size-5 shrink-0 text-[#8796a8] sm:size-6"
            />
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
              className="flex size-10 shrink-0 items-center justify-center rounded-lg text-[#8796a8] transition-colors hover:bg-white/5 hover:text-[#d8b76a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d8b76a]/30"
              disabled={isSubmitting}
              onClick={() => setShowPassword((current) => !current)}
              type="button"
            >
              {showPassword ? (
                <EyeOff className="size-5 sm:size-6" aria-hidden="true" />
              ) : (
                <Eye className="size-5 sm:size-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </Field>

        {error ? (
          <p className="rounded-xl border border-red-200/20 bg-red-950/30 px-4 py-3 text-sm leading-6 text-red-100">
            {error}
          </p>
        ) : null}

        <button
          className="flex h-14 w-full items-center justify-center gap-3 rounded-xl border border-[#e2c477]/30 bg-[#d8b76a] text-base font-semibold text-[#071625] shadow-none transition hover:-translate-y-px hover:bg-[#e2c477] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e2c477]/40 disabled:pointer-events-none disabled:translate-y-0 disabled:opacity-70 sm:h-16 sm:text-lg"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? "Logging in..." : "Log in"}
          <ArrowRight className="size-5" aria-hidden="true" />
        </button>
      </form>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 text-[#8796a8]">
        <div className="h-px bg-white/12" />
        <ShieldCheck className="size-7" aria-hidden="true" />
        <div className="h-px bg-white/12" />
      </div>

      <div className="space-y-3 text-sm leading-6 text-[#aebbcc] sm:text-base sm:leading-7">
        <p className="flex gap-4">
          <UserRound
            aria-hidden="true"
            className="mt-0.5 size-5 shrink-0 text-[#d8b76a] sm:size-6"
          />
          <span className="min-w-0">
            Need access? Ask a Gryphon Hub admin to add your account.
          </span>
        </p>
        <p className="flex gap-4">
          <Mail
            aria-hidden="true"
            className="mt-0.5 size-5 shrink-0 text-[#d8b76a] sm:size-6"
          />
          <span className="min-w-0">
            For password help, contact{" "}
            <span className="font-semibold text-[#e2c477]">
              gryphonrailways@gmail.com
            </span>
            .
          </span>
        </p>
      </div>
    </div>
  );
}
