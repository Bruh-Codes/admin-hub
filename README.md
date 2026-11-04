# Admin hub

A private, multi-project dashboard for the Better Auth users of all your
products, built on [better-auth-studio](https://github.com/Kinfe123/better-auth-studio)
(MIT, used unmodified from npm).

- **Sign in** with Google. Accounts are invite-only: only emails in
  `HUB_OWNER_EMAILS` or with a pending project invitation can sign up.
- **Projects**: one per product. Owners in `HUB_OWNER_EMAILS` create them.
- **Team** per project: invite by email as `member` (read-only), `admin`
  (edit users, invite, settings) or `owner` (also delete the project).
  Invitees sign in with Google and accept on the Projects page.
- **Dashboard** per project: the studio, opened only for project members.

## Connecting a product

**Better Auth apps (recommended).** Copy [`plugin/admin-hub.ts`](plugin/admin-hub.ts)
into the app and add it to its Better Auth plugins:

```ts
import { adminHub } from "./admin-hub";

plugins: [
  // ...your plugins
  adminHub({ key: process.env.ADMIN_HUB_KEY, roles: ["owner", "reviewer", "admin"] }),
]
```

Set `ADMIN_HUB_KEY` (`openssl rand -base64 32`) in the app's env and deploy.
In the hub: project → Settings → paste the app URL and the same key. The hub
reads the app's tables, fields and plugins from the plugin, and every read or
write goes through the app's own Better Auth adapter. `roles` is optional; it
lists the user roles the hub may assign (default first).

**Advanced: a database URL.** For apps whose auth tables follow Better Auth's
shape under other names. Saved encrypted with `HUB_ENCRYPTION_KEY`.

## Safety rails

- Studio requests require a hub session and project membership; members are read-only.
- Product user roles are checked against the product's roles (`lib/role-guard.ts`);
  the studio's fake-data "seed" endpoints are blocked.
- Tools that change schemas or mint credentials are hidden.
- Keys and database URLs are stored encrypted and never sent to the browser.
- App URLs must be https (`HUB_ALLOW_HTTP_APPS=1` only for local testing).

## Deploy on Vercel

1. Create an empty Postgres for the hub (e.g. Neon from Vercel's Storage tab).
2. Set the env vars from `.env.example`.
3. Google Cloud Console: OAuth client (Web application) with redirect URI
   `<HUB_URL>/api/auth/callback/google`.
4. Deploy. The `vercel-build` script creates/updates the hub's tables first.
