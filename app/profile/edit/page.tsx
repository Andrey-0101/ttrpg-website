"use client";

import { useEffect, useState, type FormEvent } from "react";
import { createClient } from "@/utils/supabase/client";

export default function EditProfilePage() {
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      const supabase = createClient();

      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;

      if (!user) {
        window.location.href = "/login";
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("username, display_name, bio")
        .eq("id", user.id)
        .single();

      if (data) {
        setUsername(data.username ?? "");
        setDisplayName(data.display_name ?? "");
        setBio(data.bio ?? "");
      }

      setLoading(false);
    }

    loadProfile();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    const supabase = createClient();

    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;

    if (!user) {
      window.location.href = "/login";
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        username,
        display_name: displayName,
        bio,
      })
      .eq("id", user.id);

    if (error) {
      setMessage(error.message);
      return;
    }

    window.location.href = "/profile";
  }

  if (loading) {
    return <main className="p-8">Loading profile...</main>;
  }

  return (
    <main className="mx-auto min-h-screen max-w-xl p-8">
      <h1 className="text-4xl font-bold">Edit Profile</h1>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
        <label>
          Username
          <input
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            className="mt-1 w-full rounded border p-3"
          />
        </label>

        <label>
          Display name
          <input
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            className="mt-1 w-full rounded border p-3"
          />
        </label>

        <label>
          Bio
          <textarea
            value={bio}
            onChange={(event) => setBio(event.target.value)}
            className="mt-1 min-h-32 w-full rounded border p-3"
          />
        </label>

        <button
          type="submit"
          className="rounded bg-black px-6 py-3 text-white"
        >
          Save Profile
        </button>
      </form>

      {message && <p className="mt-4">{message}</p>}
    </main>
  );
}