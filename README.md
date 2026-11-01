# Torqe Console

The Console is an independent Next.js application. Deploy this folder as its own repository and map the deployment to `console.torqe.ai`. The landing site's Console menu item links to that subdomain. Its command-center UI currently uses clearly identified sample data; external messages, approvals, and integrations are not executed from the preview workspace. Knowledge-file selections and saved agent instructions are browser-local preview state; files are not uploaded or synchronized.

## Invite-only access

Set `CONSOLE_INVITE_CODE` to a high-entropy invitation code and `CONSOLE_SESSION_SECRET` to a separate random value of at least 32 characters in the server environment. The access endpoint compares codes in constant time and issues an eight-hour, HTTP-only, same-site cookie. Do not prefix either value with `NEXT_PUBLIC_`. Rotate the invite code to revoke future access; existing sessions expire within eight hours.

## Supabase

1. Create a Supabase project and set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in the server environment.
2. Apply [`./supabase/migrations/20261101000000_torqe_console.sql`](./supabase/migrations/20261101000000_torqe_console.sql) to that project.
3. Invite team members through Supabase Auth, then provision organization and membership rows using a trusted administrative process.
4. Never expose a Supabase service-role key or NVIDIA key to the browser. The status endpoint only reports whether public Supabase configuration and the server-side model key exist.

The database schema enables row-level security and scopes operational data by organization. Connecting live data, verified individual Supabase identities, OAuth integrations, and execution workers requires the target Supabase project and provider credentials; the preview UI does not claim those external systems are connected.

## Model setup

Add credentials only to this app's deployment secrets (`NVIDIA_API_KEY`, and optionally `NVIDIA_MODEL` / `NVIDIA_BASE_URL`). A product brief configures an agent; it does not train or fine-tune a model. Production behavior still requires reviewed system instructions, a curated knowledge base, evaluation, and guarded tool implementations.
