"use client";

import { useState, type FormEvent } from "react";
import { createClient } from "@/utils/supabase/client";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const supabase = createClient();

    const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            emailRedirectTo: `${window.location.origin}/auth/confirm`,
        },
    });

    setMessage(
      error
        ? error.message
        : "Registration submitted. Check your email for confirmation."
    );

    setLoading(false);
  }

  return (
    <main className="mx-auto min-h-screen max-w-md p-8">
      <h1 className="text-4xl font-bold">Create account</h1>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-1 w-full rounded border p-3"
            required
          />
        </label>

        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
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
          {loading ? "Creating account..." : "Register"}
        </button>
      </form>

      {message && <p className="mt-4">{message}</p>}
    </main>
  );
}