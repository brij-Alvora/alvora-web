# Alvora Auth emails — Phase 1

Paste these into **Supabase → Authentication → Email Templates**.

SMTP From (`Alvora <noreply@alvora-labs.com>`) is the system mailer only. It is not a public contact address.

## Dashboard settings (do first)

1. **Authentication → URL Configuration**
   - Site URL = `https://www.alvora-labs.com`
   - Redirect URLs include `https://www.alvora-labs.com/auth/callback`
2. **Authentication → Providers → Email**
   - Confirm signup: **on**
   - Magic link / Email OTP: **off** (Alvora uses password login)
   - Do not invite users from the Supabase Users UI
3. **Authentication → SMTP**
   - Sender name: `Alvora`
   - Sender email: `noreply@alvora-labs.com` (mailer identity only)
   - Reply-To: `hello@alvora-labs.com`

Header mark: `https://www.alvora-labs.com/brand/apex-bar.png` (Apex Bar).

Footer links use `https://www.alvora-labs.com/privacy` and `/terms`. Support line is `hello@alvora-labs.com`.

## Subjects (paste into the Subject field)

| Template | Subject |
|---|---|
| Confirm signup | Confirm your Alvora account |
| Reset password | Reset your Alvora password |
| Magic link | Sign in to Alvora |
| Invite user | Your Alvora account invitation |
| Change email address | Confirm your new Alvora email |

## Body files

Paste the **entire HTML file** into the matching template body. Do not leave the default Supabase HTML.

| Template | File |
|---|---|
| Confirm signup | `confirm-signup.html` |
| Reset password | `reset-password.html` |
| Magic link | `magic-link.html` (only if the provider cannot be turned off) |
| Invite user | `invite.html` (only if dashboard invites cannot be turned off) |
| Change email address | `change-email.html` |

## QA

Register a throwaway account and run forgot-password.

- From: `Alvora <noreply@alvora-labs.com>`
- Reply-To: `hello@alvora-labs.com`
- No “Supabase Auth”, no Supabase logo, no “powered by”
- Preview line matches the hidden preview in the HTML
- Button lands on `https://www.alvora-labs.com`, not supabase.co
- Footer Privacy / Terms open production Alvora
