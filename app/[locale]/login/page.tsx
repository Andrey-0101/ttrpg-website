"use client";

import {
  useEffect,
  useState,
  type FormEvent,
} from "react";
import { useTranslations } from "next-intl";
import {
  Link,
  useRouter,
} from "@/i18n/navigation";
import SignOutButton from "@/components/account/sign-out-button";
import { getAuthErrorKey } from "@/lib/auth/get-auth-error-key";
import { createClient } from "@/utils/supabase/client";

function getSafeNextPath(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  const nextPath = new URLSearchParams(window.location.search).get("next");

  if (
    !nextPath ||
    !nextPath.startsWith("/") ||
    nextPath.startsWith("//") ||
    nextPath.includes("\\")
  ) {
    return null;
  }

  return nextPath;
}

export default function LoginPage() {
  const translations = useTranslations("Login");
  const authErrors = useTranslations("AuthErrors");
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
      try {
        const supabase = createClient();

        const { data, error } =
          await supabase.auth.getUser();

        if (!isMounted) {
          return;
        }

        if (!error && data.user) {
          const nextPath = getSafeNextPath();

          if (nextPath) {
            router.replace(nextPath);
            router.refresh();
            return;
          }

          setIsSignedIn(true);
          setSignedInEmail(
            data.user.email ?? ""
          );
        }
      } catch (error) {
        console.error(
          "Failed to check the user session:",
          error
        );
      } finally {
        if (isMounted) {
          setCheckingSession(false);
        }
      }
    }

    checkSession();

    return () => {
      isMounted = false;
    };
  }, [router]);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setLoading(true);
    setMessage("");

    try {
      const supabase = createClient();

      const { error } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      if (error) {
        const errorKey = getAuthErrorKey(error);

        setMessage(
          authErrors(
            errorKey === "userAlreadyRegistered"
              ? "generic"
              : errorKey
          )
        );

        return;
      }

      router.replace(getSafeNextPath() ?? "/");
      router.refresh();
    } catch (error) {
      console.error("Login failed:", error);
      setMessage(authErrors("generic"));
    } finally {
      setLoading(false);
    }
  }

  if (checkingSession) {
    return (
      <main className="mx-auto min-h-screen max-w-md p-8">
        <p>
          {translations("checkingSession")}
        </p>
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
            autoComplete="email"
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
            autoComplete="current-password"
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
