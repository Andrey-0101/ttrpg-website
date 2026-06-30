"use client";

import {
  useEffect,
  useState,
  type FormEvent,
} from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { createClient } from "@/utils/supabase/client";

export default function EditProfilePage() {
  const translations = useTranslations("ProfileEdit");
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      const supabase = createClient();

      const { data: userData } =
        await supabase.auth.getUser();

      const user = userData.user;

      if (!user) {
        router.replace("/login");
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("username, display_name, bio")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error(error);
        setMessage(translations("loadError"));
        setLoading(false);
        return;
      }

      setUsername(data.username ?? "");
      setDisplayName(data.display_name ?? "");
      setBio(data.bio ?? "");
      setLoading(false);
    }

    loadProfile();
  }, [router, translations]);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setMessage("");
    setSaving(true);

    const supabase = createClient();

    const { data: userData } =
      await supabase.auth.getUser();

    const user = userData.user;

    if (!user) {
      router.replace("/login");
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
      console.error(error);
      setMessage(translations("saveError"));
      setSaving(false);
      return;
    }

    router.replace("/profile");
    router.refresh();
  }

  if (loading) {
    return (
      <main className="p-8">
        {translations("loading")}
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-xl p-8">
      <h1 className="text-4xl font-bold">
        {translations("title")}
      </h1>

      <form
        onSubmit={handleSubmit}
        className="mt-8 flex flex-col gap-4"
      >
        <label>
          {translations("username")}

          <input
            value={username}
            onChange={(event) =>
              setUsername(event.target.value)
            }
            className="mt-1 w-full rounded border p-3"
          />
        </label>

        <label>
          {translations("displayName")}

          <input
            value={displayName}
            onChange={(event) =>
              setDisplayName(event.target.value)
            }
            className="mt-1 w-full rounded border p-3"
          />
        </label>

        <label>
          {translations("bio")}

          <textarea
            value={bio}
            onChange={(event) =>
              setBio(event.target.value)
            }
            className="mt-1 min-h-32 w-full rounded border p-3"
          />
        </label>

        <button
          type="submit"
          disabled={saving}
          className="rounded bg-black px-6 py-3 text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving
            ? translations("saving")
            : translations("save")}
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