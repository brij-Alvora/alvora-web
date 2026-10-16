type ConfirmableUser = {
  email_confirmed_at?: string | null;
  confirmed_at?: string | null;
};

export function isEmailConfirmed(user: ConfirmableUser | null | undefined) {
  if (!user) return false;
  return Boolean(user.email_confirmed_at || user.confirmed_at);
}

export const EMAIL_CONFIRM_REQUIRED_MESSAGE =
  "Confirm your email before signing in. Check your inbox for the link.";
