"use client";

import { useTranslations } from "next-intl";
import { useState, type FormEvent } from "react";
import { createClient } from "@/utils/supabase/client";

export default function RegisterPage() {
  const translations = useTranslations("Register");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

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
          `${window.location.origin}/auth/confirm`,
      },
    });

    setMessage(
      error
        ? error.message
        : translations("success")
    );

    setLoading(false);
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
          className="rounded bg-black px-6 py-3 text-white disabled:opacity-50"
        >
          {loading
            ? translations("submitting")
            : translations("submit")}
        </button>
      </form>

      {message && (
        <p className="mt-4">
          {message}
        </p>
      )}
    </main>
  );
}