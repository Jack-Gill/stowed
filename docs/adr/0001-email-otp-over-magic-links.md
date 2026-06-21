# Email OTP over magic links for authentication

Supabase supports both magic links and email OTP. We use OTP (a 6-digit code the user types into the app) because clicking a magic link from a mobile email client opens a new browser tab, breaking out of the installed PWA shell and destroying the session context. OTP keeps the entire auth flow inside the PWA.

## Considered Options

- Magic link (default Supabase behaviour) — rejected because mobile email clients open links in a separate browser, not the PWA shell
- Email OTP via Resend custom SMTP — chosen; the user types the code directly into the PWA
