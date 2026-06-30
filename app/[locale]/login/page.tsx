"use client";

import {
  useEffect,
  useState,
  type FormEvent,
} from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { createClient } from "@/utils/supabase/client";
import SignOutButton from "@/components/account/sign-out-button";

export default function LoginPage() {
  const translations = useTranslations("Login");
  const router = useRouter();

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

    const { error } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    router.replace("/");
    router.refresh();
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
          {translations("signedInAs")}{" "}

          <span className="font-mono font-semibold">
            {signedInEmail ||
              translations("signedInUser")}
          </span>

          .
        </p>

        <div className="mt-8 flex flex-wrap gap-4">
          <Link
            href="/profile"
            className="rounded bg-black px-5 py-3 text-white"
          >
            {translations("myProfile")}
          </Link>

          <SignOutButton
            onSignedOut={() => {
              setIsSignedIn(false);
              setSignedInEmail("");
              setMessage("");
            }}
            className="rounded border border-red-600 px-5 py-3 text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
          />
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
        <p className="mt-4" role="alert">
          {message}
        </p>
      )}
    </main>
  );
}