"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { createClient } from "@/utils/supabase/client";

type SignOutButtonProps = {
  className?: string;
  redirectTo?: string;
  onSignedOut?: () => void;
};

export default function SignOutButton({
  className,
  redirectTo = "/login",
  onSignedOut,
}: SignOutButtonProps) {
  const translations =
    useTranslations("AccountArea");

  const router = useRouter();

  const [signingOut, setSigningOut] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

  async function handleSignOut() {
    if (signingOut) {
      return;
    }

    setSigningOut(true);
    setErrorMessage("");

    try {
      const supabase = createClient();

      const { error } =
        await supabase.auth.signOut();

      if (error) {
        throw error;
      }

      onSignedOut?.();

      router.replace(redirectTo);
      router.refresh();
    } catch (error) {
      console.error(error);

      setErrorMessage(
        translations("signOutError")
      );
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleSignOut}
        disabled={signingOut}
        className={
          className ??
          "rounded border px-4 py-2 disabled:cursor-not-allowed disabled:opacity-50"
        }
      >
        {signingOut
          ? translations("signingOut")
          : translations("signOut")}
      </button>

      {errorMessage && (
        <p
          className="mt-2 text-sm text-red-600"
          role="alert"
        >
          {errorMessage}
        </p>
      )}
    </div>
  );
}