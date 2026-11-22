"use client";

import Image from "next/image";
import { useRef, useState, type ComponentProps } from "react";
import { useTranslations } from "next-intl";

type ImageProps = Pick<ComponentProps<typeof Image>, "alt" | "className" | "loading" | "sizes">;

export function CampaignGalleryImage({
  campaignId,
  imageId,
  thumbnail = false,
  alt,
  ...image
}: ImageProps & { campaignId: string; imageId: string; thumbnail?: boolean }) {
  const [request, setRequest] = useState({ retryId: "", failed: false });

  function retry() {
    setRequest({ retryId: crypto.randomUUID(), failed: false });
  }

  if (request.failed) return <GalleryImageRetry onRetry={retry} />;

  const url = `/api/campaigns/${encodeURIComponent(campaignId)}/gallery/${encodeURIComponent(imageId)}`;
  const params = new URLSearchParams();
  if (thumbnail) params.set("variant", "thumbnail");
  if (request.retryId) params.set("retry", request.retryId);
  const src = params.size ? `${url}?${params}` : url;
  return (
    <Image
      key={src}
      {...image}
      src={src}
      alt={alt}
      fill
      unoptimized
      onError={() => {
        // <img> does not expose the HTTP status, including Storage's 400 InvalidJWT.
        // Retry once via the authenticated endpoint, never via the failed signed URL.
        if (!request.retryId) retry();
        else setRequest({ ...request, failed: true });
      }}
    />
  );
}

export function CampaignPresentedImage({
  url,
  revision,
  onRenew,
  ...image
}: ImageProps & { url: string; onRenew(revision: number): Promise<boolean>; revision: number }) {
  return <PresentedImage key={revision} {...image} url={url} onRenew={() => onRenew(revision)} />;
}

function PresentedImage({
  url,
  onRenew,
  alt,
  ...image
}: ImageProps & { url: string; onRenew(): Promise<boolean> }) {
  const [failedUrl, setFailedUrl] = useState<string>();
  const [pending, setPending] = useState(false);
  const triedAutomatically = useRef(false);

  async function renew() {
    if (pending) return;
    setPending(true);
    try {
      await onRenew();
    } catch {
      // Keep the retry available after a network failure.
    } finally {
      setPending(false);
    }
  }

  if (failedUrl === url) return <GalleryImageRetry pending={pending} onRetry={() => void renew()} />;
  return (
    <Image
      key={url}
      {...image}
      src={url}
      alt={alt}
      fill
      unoptimized
      onError={() => {
        setFailedUrl(url);
        if (!triedAutomatically.current) {
          triedAutomatically.current = true;
          void renew();
        }
      }}
    />
  );
}

function GalleryImageRetry({ pending, onRetry }: { pending?: boolean; onRetry(): void }) {
  const t = useTranslations("CampaignHandouts");
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-neutral-900 px-1 text-center text-xs text-white">
      <p role="status">{t("previewLoadError")}</p>
      <button type="button" disabled={pending} onClick={onRetry}
        className="relative z-10 rounded border border-white/60 px-2 py-1 font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-60">
        {t("previewRetry")}
      </button>
    </div>
  );
}
