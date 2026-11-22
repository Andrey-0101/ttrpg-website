import { CAMPAIGN_HANDOUT_SIGNED_URL_TTL } from "../../campaign-handouts/contracts";

const NORMAL_INTERVAL_MS = CAMPAIGN_HANDOUT_SIGNED_URL_TTL * 1000 - 5 * 60_000;
// Leave room for the controller's 10-second renewal throttle.
const RETRY_DELAYS_MS = [12_000, 24_000, 48_000];

export type PresentationRenewalResult = "renewed" | "retry" | "obsolete";

export function createPresentationRenewalSchedule(renew: (revision: number) => Promise<PresentationRenewalResult>) {
  let target: { revision: number; deadline: number | null; retries: number } | null = null;
  let available = false;
  let running = false;
  let timer: ReturnType<typeof setTimeout> | undefined;

  function check() {
    clearTimeout(timer);
    if (!target || !available || running || target.deadline === null) return;
    timer = setTimeout(() => void attempt(), Math.max(0, target.deadline - Date.now()));
  }

  function renewed(revision: number) {
    if (target?.revision !== revision) return;
    setTarget(revision);
  }

  function setTarget(revision: number | null) {
    target = revision === null ? null : { revision, deadline: Date.now() + NORMAL_INTERVAL_MS, retries: 0 };
    check();
  }

  async function attempt() {
    const current = target;
    if (!current || !available || running) return;
    running = true;
    try {
      const result = await renew(current.revision);
      if (target !== current) return;
      if (result === "renewed") {
        renewed(current.revision);
      } else if (result === "obsolete") {
        target = null;
      } else {
        const delay = RETRY_DELAYS_MS[current.retries++];
        current.deadline = delay === undefined ? null : Date.now() + delay;
      }
    } finally {
      running = false;
      check();
    }
  }

  return {
    setTarget,
    setAvailable(next: boolean) {
      if (next === available) return;
      available = next;
      check();
    },
    renewed,
    check,
  };
}
