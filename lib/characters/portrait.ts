import type { SupabaseClient } from "@supabase/supabase-js";

export const CHARACTER_PORTRAIT_BUCKET = "character-portraits";
export const CHARACTER_PORTRAIT_MAX_BYTES = 5 * 1024 * 1024;
export const CHARACTER_PORTRAIT_ACCEPT = "image/jpeg,image/png,image/webp";
export const CHARACTER_PORTRAIT_SIGNED_URL_TTL = 60 * 60;

const PORTRAIT_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export type CharacterPortraitValidationError =
  | "invalidType"
  | "tooLarge";

export function validateCharacterPortraitFile(
  file: File,
): CharacterPortraitValidationError | null {
  if (!PORTRAIT_EXTENSIONS[file.type]) {
    return "invalidType";
  }

  if (file.size > CHARACTER_PORTRAIT_MAX_BYTES) {
    return "tooLarge";
  }

  return null;
}

export function createCharacterPortraitPath(
  userId: string,
  characterId: string,
  file: File,
): string {
  const extension = PORTRAIT_EXTENSIONS[file.type] ?? "img";
  const uniquePart =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  return `${userId}/${characterId}/${uniquePart}.${extension}`;
}

export function isCharacterPortraitStoragePath(
  portraitPath: string | null,
): portraitPath is string {
  return Boolean(
    portraitPath &&
      !portraitPath.startsWith("http://") &&
      !portraitPath.startsWith("https://"),
  );
}

export async function getCharacterPortraitSignedUrl(
  supabase: Pick<SupabaseClient, "storage">,
  portraitPath: string | null,
): Promise<string | null> {
  if (!portraitPath) {
    return null;
  }

  if (!isCharacterPortraitStoragePath(portraitPath)) {
    return portraitPath;
  }

  const { data, error } = await supabase.storage
    .from(CHARACTER_PORTRAIT_BUCKET)
    .createSignedUrl(
      portraitPath,
      CHARACTER_PORTRAIT_SIGNED_URL_TTL,
    );

  if (error) {
    console.error("Failed to create a character portrait URL:", error);
    return null;
  }

  return data.signedUrl;
}
