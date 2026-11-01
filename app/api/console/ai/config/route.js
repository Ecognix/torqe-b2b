import { NextResponse } from "next/server";
import { AI_MODELS, AI_PROVIDERS } from "../../../../../lib/ai/catalog";
import { createSupabaseAdminClient } from "../../../../../lib/supabase/admin";
import { createSupabaseServerClient } from "../../../../../lib/supabase/server";
import { encryptSecret } from "../../../../../lib/supabase/secret-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function getMembership(request) {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { response: NextResponse.json({ error: "Authentication required." }, { status: 401 }) };

  const workspaceId = new URL(request.url).searchParams.get("workspaceId");
  if (!workspaceId || !/^[0-9a-f-]{36}$/i.test(workspaceId)) {
    return { response: NextResponse.json({ error: "A valid workspace is required." }, { status: 400 }) };
  }

  const { data: membership, error } = await supabase
    .from("organization_members")
    .select("role")
    .eq("organization_id", workspaceId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    console.error("Could not verify workspace AI access:", error.message);
    return { response: NextResponse.json({ error: "Could not verify workspace access." }, { status: 500 }) };
  }
  if (!membership) return { response: NextResponse.json({ error: "Workspace access denied." }, { status: 403 }) };
  return { user, membership, workspaceId };
}

function getModelList(provider) {
  return provider === "openai_byok" ? AI_MODELS.openai : AI_MODELS.nvidia;
}

export async function GET(request) {
  let context;
  try {
    context = await getMembership(request);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 503 });
  }
  if (context.response) return context.response;

  let admin;
  try {
    admin = createSupabaseAdminClient();
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 503 });
  }

  const { data, error } = await admin
    .from("workspace_model_configs")
    .select("provider, model, encrypted_api_key, updated_at")
    .eq("organization_id", context.workspaceId)
    .maybeSingle();

  if (error) {
    console.error("Could not load workspace AI configuration:", error.message);
    return NextResponse.json({ error: "Could not load AI settings. Confirm the AI configuration migration is applied." }, { status: 500 });
  }

  const provider = data?.provider || "torqe_managed";
  return NextResponse.json({
    configuration: {
      provider,
      model: data?.model || process.env.NVIDIA_MODEL || AI_MODELS.nvidia[0].id,
      keyConfigured: Boolean(data?.encrypted_api_key),
      managedKeyConfigured: Boolean(process.env.NVIDIA_API_KEY),
      updatedAt: data?.updated_at || null,
    },
    role: context.membership.role,
    models: { nvidia: AI_MODELS.nvidia, openai: AI_MODELS.openai },
  }, { headers: { "Cache-Control": "no-store" } });
}

export async function PUT(request) {
  let context;
  try {
    context = await getMembership(request);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 503 });
  }
  if (context.response) return context.response;
  if (!["owner", "admin"].includes(context.membership.role)) {
    return NextResponse.json({ error: "Only workspace owners and admins can change AI providers." }, { status: 403 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Choose an AI provider and model." }, { status: 400 });
  }

  const provider = body?.provider;
  const model = body?.model;
  if (!AI_PROVIDERS.includes(provider) || !getModelList(provider).some((item) => item.id === model)) {
    return NextResponse.json({ error: "Choose a supported provider and model." }, { status: 400 });
  }
  const apiKey = typeof body.apiKey === "string" ? body.apiKey.trim() : "";
  const removeApiKey = body.removeApiKey === true;
  if (apiKey.length > 4096) return NextResponse.json({ error: "API keys must be 4,096 characters or fewer." }, { status: 400 });
  if (provider === "torqe_managed" && apiKey) {
    return NextResponse.json({ error: "Torqe-managed models use the server key. Do not enter a customer key in this mode." }, { status: 400 });
  }
  if (provider !== "torqe_managed" && removeApiKey && !apiKey) {
    return NextResponse.json({ error: "Add a replacement API key before removing the current key." }, { status: 400 });
  }

  let admin;
  try {
    admin = createSupabaseAdminClient();
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 503 });
  }

  const { data: existing, error: existingError } = await admin
    .from("workspace_model_configs")
    .select("provider, encrypted_api_key")
    .eq("organization_id", context.workspaceId)
    .maybeSingle();
  if (existingError) {
    console.error("Could not inspect current AI configuration:", existingError.message);
    return NextResponse.json({ error: "Could not load current AI settings." }, { status: 500 });
  }

  let encryptedApiKey = null;
  if (provider !== "torqe_managed") {
    if (apiKey) {
      try {
        encryptedApiKey = encryptSecret(apiKey);
      } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 503 });
      }
    } else if (existing?.provider === provider && !removeApiKey) {
      encryptedApiKey = existing.encrypted_api_key;
    } else {
      return NextResponse.json({ error: "Enter the provider API key to use this workspace model." }, { status: 400 });
    }
  }

  const { error } = await admin.from("workspace_model_configs").upsert({
    organization_id: context.workspaceId,
    provider,
    model,
    encrypted_api_key: encryptedApiKey,
    updated_by: context.user.id,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    console.error("Could not save workspace AI configuration:", error.message);
    return NextResponse.json({ error: "Could not save AI settings. Check the database migration and server configuration." }, { status: 500 });
  }

  return NextResponse.json({
    configuration: {
      provider,
      model,
      keyConfigured: Boolean(encryptedApiKey),
      managedKeyConfigured: Boolean(process.env.NVIDIA_API_KEY),
    },
  }, { headers: { "Cache-Control": "no-store" } });
}
