# Torqe Console

The Console is a separate Next.js application for authenticated Torqe workspaces. It uses Supabase Auth, organization memberships, and row-level security (RLS) to scope workspace data. Integrations and external agent actions are not enabled unless their provider flows and execution services are separately implemented and reviewed.

## Local setup

1. Create a Supabase project and copy its project URL, publishable/anon key, and service-role key into `.env.local` using `.env.example`.
2. Set `NEXT_PUBLIC_SITE_URL` to the exact origin serving this app (for local development, `http://localhost:3000`).
3. Apply the migrations in order:
   - [`./supabase/migrations/20261101000000_torqe_console.sql`](./supabase/migrations/20261101000000_torqe_console.sql)
   - [`./supabase/migrations/20261102000000_console_auth_and_tenants.sql`](./supabase/migrations/20261102000000_console_auth_and_tenants.sql)
   - [`./supabase/migrations/20261103000000_console_ai_model_config.sql`](./supabase/migrations/20261103000000_console_ai_model_config.sql)
   - [`./supabase/migrations/20261104000000_console_conversation_drafts.sql`](./supabase/migrations/20261104000000_console_conversation_drafts.sql)
4. In Supabase Auth, **disable public sign-ups** so only administrator-issued invitations can create accounts. Configure email delivery, add the app origin and `/auth/callback` to the Auth redirect allow list, and ensure the invitation email links to the supplied redirect URL.
5. Start the app with `npm run dev`. Invite the first owner using a trusted Supabase Auth admin process and provision an organization membership, or use an existing authenticated account and create its workspace from the Console.
6. Workspace owners and admins can invite teammates from **Settings → Team access**. Invite recipients set a password, their invitation is accepted for the matching verified email, and their assigned workspace role is applied.

The migrations create the tenant schema, workspace and invitation RPCs, AI configuration storage, per-user private conversation drafts, and role-aware RLS policies. Review SQL and test the policies against a non-production Supabase project before applying them to a client database. The migrations are **not applied automatically** by this repository.

## Deployment environment

Set these variables in the Console deployment (for example, Vercel) and redeploy:

| Variable | Required | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project endpoint |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase publishable/anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes for invitations | Server-only Auth invitation and invitation-record management |
| `NEXT_PUBLIC_SITE_URL` | Yes for invitations | Canonical app origin used for email redirects |
| `NVIDIA_API_KEY` | Optional | Server-only NVIDIA API key for Copilot |
| `NVIDIA_MODEL` | Optional | NVIDIA-compatible model identifier |
| `NVIDIA_BASE_URL` | Optional | NVIDIA-compatible API base URL |
| `CONSOLE_ENCRYPTION_KEY` | Required for workspace BYOK | Base64-encoded 32-byte AES-256-GCM key used to encrypt customer AI keys |

Never expose the service-role or NVIDIA key through a `NEXT_PUBLIC_*` variable, source control, or browser code. Production and preview deployments should use separate Supabase projects or otherwise isolated environments and distinct credentials.

Generate the encryption key with `node -e "console.log(require('node:crypto').randomBytes(32).toString('base64'))"` and store it as a server-only deployment secret. Back it up securely; rotating it requires re-encrypting existing workspace keys. Configure `NVIDIA_API_KEY` on the **Console deployment** for Torqe-managed NVIDIA access—the landing site's environment variables are not shared automatically. Workspace BYOK supports only the providers/models listed in the AI settings page. Private deployment requests are saved for review and do not connect to submitted endpoints.

## Current capability boundaries

- Sign-in, invitation acceptance, workspace creation, team invitations, and workspace-scoped reads are implemented against Supabase.
- Conversation pause settings, approval decisions, and agent instructions are persisted to the tenant database. Recording an approval does **not** dispatch a message or invoke an external tool.
- Owners and admins can select a supported model/provider, store an encrypted workspace API key, and submit private-hosting requests. The Copilot route verifies workspace membership and uses the selected provider server-side. Conversation drafts are private to the author and are not sent externally.
- The overview reports stored workspace data and shows empty states where records or analytics are unavailable; it does not fabricate metrics.
- Message delivery, provider OAuth, knowledge-file upload/ingestion, retrieval, model execution workers, billing/licensing, and production readiness/evaluation controls still require implementation and verification. API keys and instructions configure inference; they do not train or fine-tune model weights.

Do not treat the Console as production-ready for client operations until migrations, email delivery, account restrictions, tenant isolation, operational monitoring, backup/recovery, and any enabled external-action paths have been validated in the target deployment.
