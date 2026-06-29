"use client";

import { useState, type FormEvent } from "react";
import { createClient } from "@/utils/supabase/client";

export default function NewCharacterPage() {
  const [name, setName] = useState("");
  const [gameSystem, setGameSystem] = useState(
    "Vampire: The Masquerade V5"
  );
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState("private");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const supabase = createClient();

    const { data: userData, error: userError } =
      await supabase.auth.getUser();

    if (userError || !userData.user) {
      window.location.href = "/login";
      return;
    }

    const { error } = await supabase.from("characters").insert({
      owner_id: userData.user.id,
      name,
      game_system: gameSystem,
      description,
      visibility,
    });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    window.location.href = "/characters";
  }

  return (
    <main className="mx-auto min-h-screen max-w-xl p-8">
      <h1 className="text-4xl font-bold">Create Character</h1>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
        <label>
          Character name
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="mt-1 w-full rounded border p-3"
            required
          />
        </label>

        <label>
          Game system
          <select
            value={gameSystem}
            onChange={(event) => setGameSystem(event.target.value)}
            className="mt-1 w-full rounded border p-3"
          >
            <option>Vampire: The Masquerade V5</option>
            <option>Call of Cthulhu</option>
          </select>
        </label>

        <label>
          Description
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            className="mt-1 min-h-32 w-full rounded border p-3"
          />
        </label>

        <label>
          Visibility
          <select
            value={visibility}
            onChange={(event) => setVisibility(event.target.value)}
            className="mt-1 w-full rounded border p-3"
          >
            <option value="private">Private</option>
            <option value="campaign">Campaign members</option>
            <option value="public">Public</option>
          </select>
        </label>

        <button
          type="submit"
          disabled={loading}
          className="rounded bg-black px-6 py-3 text-white disabled:opacity-50"
        >
          {loading ? "Creating..." : "Create Character"}
        </button>
      </form>

      {message && <p className="mt-4">{message}</p>}
    </main>
  );
}