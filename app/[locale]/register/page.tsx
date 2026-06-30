"use client";

import {
  useEffect,
  useState,
  type FormEvent,
} from "react";
import {
  useLocale,
  useTranslations,
} from "next-intl";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/utils/supabase/client";

export default function RegisterPage() {
  const translations = useTranslations("Register");
  const locale = useLocale();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [checkingSession, setCheckingSession] =
    useState(true);

  const [isSignedIn, setIsSignedIn] =
    useState(false);

  const [signedInEmail, setSignedInEmail] =
    useState("");

  useEffect(() => {
    let isMounted = true;

    async function checkSession() {
      const supabase = createClient();

      const { data } =
        await supabase.auth.getUser();

      if (!isMounted) {
        return;
      }

      if (data.user) {
        setIsSignedIn(true);
        setSignedInEmail(data.user.email ?? "");
      }

      setCheckingSession(false);
    }

    checkSession();

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setLoading(true);
    setMessage("");

    const supabase = createClient();

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo:
          `${window.location.origin}/auth/confirm?locale=${locale}`,
      },
    });

    setMessage(
      error
        ? error.message
        : translations("success")
    );

    setLoading(false);
  }

  if (checkingSession) {
    return (
      <main className="mx-auto min-h-screen max-w-md p-8">
        <p>{translations("checkingSession")}</p>
      </main>
    );
  }

  if (isSignedIn) {
    return (
      <main className="mx-auto min-h-screen max-w-md p-8">
        <h1 className="text-4xl font-bold">
          {translations("title")}
        </h1>

        <p className="mt-6">
          {translations("alreadySignedIn")}
        </p>

        {signedInEmail && (
          <p className="mt-2 font-mono font-semibold">
            {signedInEmail}
          </p>
        )}

        <div className="mt-8 flex flex-wrap gap-4">
          <Link
            href="/profile"
            className="rounded bg-black px-5 py-3 text-white"
          >
            {translations("myProfile")}
          </Link>

          <Link
            href="/account"
            className="rounded border px-5 py-3"
          >
            {translations("accountSettings")}
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-md p-8">
      <h1 className="text-4xl font-bold">
        {translations("title")}
      </h1>

      <form
        onSubmit={handleSubmit}
        className="mt-8 flex flex-col gap-4"
      >
        <label>
          {translations("email")}

          <input
            type="email"
            value={email}
            onChange={(event) =>
              setEmail(event.target.value)
            }
            className="mt-1 w-full rounded border p-3"
            required
          />
        </label>

        <label>
          {translations("password")}

          <input
            type="password"
            value={password}
            onChange={(event) =>
              setPassword(event.target.value)
            }
            className="mt-1 w-full rounded border p-3"
            minLength={6}
            required
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          className="rounded bg-black px-6 py-3 text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading
            ? translations("submitting")
            : translations("submit")}
        </button>
      </form>

      {message && (
        <p className="mt-4" role="status">
          {message}
        </p>
      )}
    </main>
  );
}