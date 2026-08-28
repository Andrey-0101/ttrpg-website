export type CampaignCreationActionResult =
  | {
      ok: true;
      campaignId: string;
    }
  | {
      ok: false;
      error:
        | "invalid_input"
        | "game_system_unavailable"
        | "unauthenticated"
        | "create_failed";
    };

export type CampaignCreationSubmissionState = {
  inFlight: boolean;
  createdCampaignId: string | null;
};

type CampaignCreationDependencies<TInput> = {
  createCampaign: (input: TInput) => Promise<CampaignCreationActionResult>;
  requestLoginNavigation: () => boolean;
  allowCampaignNavigation: () => void;
  navigate: (href: string) => void;
  setCreating: (creating: boolean) => void;
  onFailure: (
    error: Exclude<
      CampaignCreationActionResult,
      { ok: true }
    >["error"],
  ) => void;
  onAuthenticationRequired: () => void;
  onCreated: (campaignId: string) => void;
  onNavigationFailure: (campaignId: string) => void;
};

export type CampaignCreationSubmissionOutcome =
  | { kind: "duplicate_blocked" }
  | { kind: "failed" }
  | { kind: "login_navigation_cancelled" }
  | { kind: "login_navigation_requested" }
  | { kind: "created"; campaignId: string }
  | { kind: "navigation_failed"; campaignId: string }
  | { kind: "recovery_navigation_requested"; campaignId: string };

export function createCampaignCreationSubmissionState(): CampaignCreationSubmissionState {
  return {
    inFlight: false,
    createdCampaignId: null,
  };
}

export function getCampaignHref(campaignId: string): string {
  return `/campaigns/${campaignId}`;
}

function navigateToCreatedCampaign<TInput>(
  campaignId: string,
  dependencies: CampaignCreationDependencies<TInput>,
): CampaignCreationSubmissionOutcome {
  dependencies.allowCampaignNavigation();

  try {
    dependencies.navigate(getCampaignHref(campaignId));
    return {
      kind: "recovery_navigation_requested",
      campaignId,
    };
  } catch {
    dependencies.onNavigationFailure(campaignId);
    return {
      kind: "navigation_failed",
      campaignId,
    };
  }
}

export async function submitCampaignCreation<TInput>({
  input,
  state,
  dependencies,
}: {
  input: TInput;
  state: CampaignCreationSubmissionState;
  dependencies: CampaignCreationDependencies<TInput>;
}): Promise<CampaignCreationSubmissionOutcome> {
  if (state.inFlight) {
    return { kind: "duplicate_blocked" };
  }

  if (state.createdCampaignId) {
    return navigateToCreatedCampaign(state.createdCampaignId, dependencies);
  }

  state.inFlight = true;
  dependencies.setCreating(true);

  try {
    const result = await dependencies.createCampaign(input);

    if (!result.ok && result.error === "unauthenticated") {
      dependencies.onAuthenticationRequired();

      if (!dependencies.requestLoginNavigation()) {
        return { kind: "login_navigation_cancelled" };
      }

      dependencies.navigate("/login");
      return { kind: "login_navigation_requested" };
    }

    if (!result.ok) {
      dependencies.onFailure(result.error);
      return { kind: "failed" };
    }

    state.createdCampaignId = result.campaignId;
    dependencies.onCreated(result.campaignId);
    dependencies.allowCampaignNavigation();

    try {
      dependencies.navigate(getCampaignHref(result.campaignId));
      return {
        kind: "created",
        campaignId: result.campaignId,
      };
    } catch {
      dependencies.onNavigationFailure(result.campaignId);
      return {
        kind: "navigation_failed",
        campaignId: result.campaignId,
      };
    }
  } catch {
    dependencies.onFailure("create_failed");
    return { kind: "failed" };
  } finally {
    state.inFlight = false;
    dependencies.setCreating(false);
  }
}
