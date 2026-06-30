export type AuthErrorKey =
  | "invalidCredentials"
  | "emailNotConfirmed"
  | "emailAddressInvalid"
  | "weakPassword"
  | "signupDisabled"
  | "rateLimit"
  | "userAlreadyRegistered"
  | "generic";

type AuthErrorLike = {
  code?: string;
  message?: string;
};

export function getAuthErrorKey(
  error: AuthErrorLike
): AuthErrorKey {
  const code = error.code?.toLowerCase() ?? "";
  const message =
    error.message?.toLowerCase() ?? "";

  if (
    code === "invalid_credentials" ||
    message.includes("invalid login credentials")
  ) {
    return "invalidCredentials";
  }

  if (
    code === "email_not_confirmed" ||
    message.includes("email not confirmed")
  ) {
    return "emailNotConfirmed";
  }

  if (
    code === "email_address_invalid" ||
    message.includes("invalid email")
  ) {
    return "emailAddressInvalid";
  }

  if (
    code === "weak_password" ||
    message.includes("password should be") ||
    message.includes("password is too weak")
  ) {
    return "weakPassword";
  }

  if (
    code === "signup_disabled" ||
    message.includes("signups not allowed") ||
    message.includes("signup is disabled")
  ) {
    return "signupDisabled";
  }

  if (
    code.includes("rate_limit") ||
    message.includes("rate limit") ||
    message.includes("too many requests")
  ) {
    return "rateLimit";
  }

  if (
    code === "user_already_exists" ||
    code === "user_already_registered" ||
    message.includes("already registered") ||
    message.includes("already exists")
  ) {
    return "userAlreadyRegistered";
  }

  return "generic";
}