# Admin hub

One private dashboard for the Better Auth users of every product, built on
[better-auth-studio](https://github.com/Kinfe123/better-auth-studio) (MIT, npm
package, used unmodified). Each product lives at its own path, e.g.
`/onrecord`, with its own database and its own admin sign-in.

## Who can get in

Three locks, all required:

1. **Hub password** (HTTP Basic Auth, `HUB_BASIC_USER` / `HUB_BASIC_PASSWORD`)
   in front of everything. With no password set, the hub refuses all requests.
2. **Product admin sign-in**: a real user in that product whose `role` is
   `admin`, signed in with email + password (on `/onrecord`) or with Google
   (button on the hub home page, when Google credentials are set).
3. **Email allowlist** per product (`ONRECORD_ADMIN_EMAILS`). Set it to `*`
   to let in every admin of that product, so that admins added from the hub
   can sign in without a redeploy.

Studio sessions expire after 12 hours without use and are not revoked when someone loses the
admin role. To remove someone right away, take them off the allowlist, demote
them, **and** rotate that product's `*_STUDIO_SECRET` (signs everyone out).

Tools that change the schema or mint credentials (`run-migration`, OAuth and
token/secret generators) are hidden for every product.

## People and roles

`/team/<product>` adds people by email with one of the product's roles, or
changes an existing user's role. New people get a user with no password; they
sign in to the product with Google (account linking) or set a password with
"Forgot password".

The studio's own screens only know Better Auth's generic roles, so the hub
checks every user create/update before it reaches the database
(`lib/role-guard.ts`): "user" or no role becomes the product's default role
(`owner` for OnRecord), anything outside the product's roles is refused, and
the studio's fake-data "seed" endpoints are blocked.

## Google sign-in

The hub runs its own Better Auth instance per product but exposes only two of
its endpoints: `POST /api/auth/<product>/sign-in/social` (Google only) and
`GET /api/auth/<product>/callback/google`. Google can never create a user: a
Google email with no matching user is refused. After Google, `/google-done`
asks the studio to check the admin role and allowlist, the same checks as for
a password sign-in.

Setup for OnRecord: in Google Cloud Console create an OAuth client of type
"Web application", add the authorized redirect URI
`<HUB_URL>/api/auth/onrecord/callback/google`, and set
`ONRECORD_GOOGLE_CLIENT_ID` and `ONRECORD_GOOGLE_CLIENT_SECRET` in Vercel.

## Deploy on Vercel

1. Import this repo in Vercel (framework: Next.js, no build settings to change).
2. Add the env vars from `.env.example` (Production only).
3. Deploy, then set `HUB_URL` to the deployment URL and redeploy.

## Add another product

1. Copy `lib/products/onrecord.ts` to `lib/products/<name>.ts` and mirror that
   product's Better Auth config (table names, id generator, extra fields,
   plugins). Use a new `BASE_PATH` and new env var names.
2. Copy `app/onrecord/[[...path]]/route.ts` to `app/<name>/[[...path]]/route.ts`
   and import the new config. For Google, also copy
   `app/api/auth/onrecord/[...all]/route.ts`.
3. Add a line to `lib/products/index.ts` and the env vars in Vercel.

All products share one session cookie name, so opening a second product signs
you out of the first. Each product has its own secret, so a session from one
never works on another.

## Keep in step with OnRecord

`lib/products/onrecord.ts` mirrors `apps/web/lib/auth.ts` in Bruh-Codes/Onrecord.
If that file changes table names, the id generator, or user fields, change
this one too, or the studio reads the wrong tables or creates users whose ids
the API cannot parse.
