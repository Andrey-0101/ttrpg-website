const storageKey = "ttrpg.gameRoom.mirrorPreview";
const changeEvent = "ttrpg:mirror-preview-changed";
let unsavedPreference: boolean | undefined;

export function getMirrorPreview() {
  if (unsavedPreference !== undefined) return unsavedPreference;
  try {
    return window.localStorage.getItem(storageKey) === "true";
  } catch {
    return false;
  }
}

export function getServerMirrorPreview() {
  return false;
}

export function setMirrorPreview(enabled: boolean) {
  try {
    window.localStorage.setItem(storageKey, String(enabled));
    unsavedPreference = undefined;
  } catch {
    // Still apply the preference for this page when storage is blocked.
    unsavedPreference = enabled;
  }
  window.dispatchEvent(new Event(changeEvent));
}

export function subscribeMirrorPreview(onChange: () => void) {
  function onStorage(event: StorageEvent) {
    if (event.key === storageKey || event.key === null) onChange();
  }

  window.addEventListener(changeEvent, onChange);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(changeEvent, onChange);
    window.removeEventListener("storage", onStorage);
  };
}
