# Alvora Auth emails — Phase 1

Paste these into **Supabase → Authentication → Email Templates**.
SMTP and From (`Alvora <noreply@alvora-labs.com>`) are already live. This pass replaces default GoTrue copy.

## Dashboard settings (do first)

1. **Authentication → URL Configuration**
   - Site URL = the public Alvora site origin (the same host as Privacy / Terms).
   - Redirect URLs include `/auth/callback` on that origin.
2. **Authentication → Providers → Email**
   - Confirm signup: **on**
   - Magic link / Email OTP: **off** (Alvora uses password login)
   - Do not invite users from the Supabase Users UI
3. **Authentication → SMTP**
   - Sender name: `Alvora`
   - Sender email: `noreply@alvora-labs.com`
   - Reply-To: `support@alvora.ai` if that mailbox exists; otherwise `support@alvora-labs.com`

Header mark: `{{ .SiteURL }}/brand/apex-bar.png` (Apex Bar). Deploy that file before pasting templates.

Footer links use `{{ .SiteURL }}/privacy`, `/terms`, `/support`. If Site URL is still `*.supabase.co`, those links will be wrong.

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
- No “Supabase Auth”, no Supabase logo, no “powered by”
- Preview line matches the hidden preview in the HTML
- Button lands on Alvora, not supabase.co
- Footer Privacy / Terms / Support open the Alvora site
