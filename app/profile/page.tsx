import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import Link from "next/link";

export default async function ProfilePage() {
  const supabase = await createClient();

  const { data: claimsData, error: claimsError } =
    await supabase.auth.getClaims();

  const userId = claimsData?.claims?.sub;

  if (claimsError || typeof userId !== "string") {
    redirect("/login");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("username, display_name, bio")
    .eq("id", userId)
    .single();

  if (profileError) {
    return (
      <main className="mx-auto min-h-screen max-w-3xl p-8">
        <h1 className="text-4xl font-bold">My Profile</h1>
        <p className="mt-4">Unable to load the profile.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-3xl p-8">
      <h1 className="text-4xl font-bold">My Profile</h1>

      <section className="mt-8 rounded-lg border p-6">
        <p>
          <strong>Username:</strong> {profile.username || "Not specified"}
        </p>

        <p className="mt-4">
          <strong>Display name:</strong>{" "}
          {profile.display_name || "Not specified"}
        </p>

        <p className="mt-4">
          <strong>Bio:</strong> {profile.bio || "Not specified"}
        </p>
      </section>

      <Link
        href="/profile/edit"
        className="mt-6 inline-block rounded bg-black px-6 py-3 text-white"
      >    
        Edit Profile
      </Link>
    </main>
  );
}