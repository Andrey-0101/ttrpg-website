import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims) {
    redirect("/login");
  }

  const email =
    typeof data.claims.email === "string"
      ? data.claims.email
      : "Signed-in user";

  return (
    <main className="mx-auto min-h-screen max-w-6xl p-8">
      <h1 className="text-4xl font-bold">My Dashboard</h1>

      <p className="mt-4">
        You are logged in as: <strong>{email}</strong>
      </p>

      <section className="mt-8 rounded-lg border p-6">
        <h2 className="text-2xl font-bold">My Campaigns</h2>
        <p className="mt-2">You do not have any campaigns yet.</p>
      </section>

      <section className="mt-6 rounded-lg border p-6">
        <h2 className="text-2xl font-bold">My Characters</h2>
        <p className="mt-2">You do not have any characters yet.</p>
      </section>

      <form action="/auth/signout" method="post" className="mt-8">
        <button
            type="submit"
            className="rounded bg-black px-6 py-3 text-white"
        >
         Log out
         </button>
        </form>
    </main>
  );
}