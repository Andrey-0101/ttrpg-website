"use client";

import { useState } from "react";

import { useRouter } from "@/i18n/navigation";

type RetryCampaignsButtonProps = {
  label: string;
};

export default function RetryCampaignsButton({
  label,
}: RetryCampaignsButtonProps) {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  function handleRetry() {
    if (refreshing) {
      return;
    }

    setRefreshing(true);
    router.refresh();

    window.setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }

  return (
    <button
      type="button"
      onClick={handleRetry}
      disabled={refreshing}
      className="mt-4 rounded bg-red-950 px-4 py-2 font-medium text-white disabled:cursor-wait disabled:opacity-60"
    >
      {label}
    </button>
  );
}
