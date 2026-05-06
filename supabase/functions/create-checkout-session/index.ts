const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};
import { createClient } from "npm:@supabase/supabase-js@2";
import Stripe from "npm:stripe@17";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, { apiVersion: "2024-12-18.acacia" });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { case_id } = await req.json();
    if (!case_id) {
      return new Response(JSON.stringify({ error: "case_id is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch case with service info
    const { data: caseData, error: caseError } = await supabase
      .from("cases")
      .select("*, services(name, price_usd, is_custom_quote)")
      .eq("id", case_id)
      .eq("user_id", user.id)
      .single();

    if (caseError || !caseData) {
      return new Response(JSON.stringify({ error: "Case not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (caseData.status !== "awaiting_payment") {
      return new Response(JSON.stringify({ error: "Case is not awaiting payment" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (caseData.is_free_trial) {
      // Free trial — mark as paid directly
      const serviceRoleClient = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      );
      await serviceRoleClient.from("cases").update({ status: "paid" }).eq("id", case_id);
      await serviceRoleClient.from("payments").insert({
        case_id,
        user_id: user.id,
        amount_usd: 0,
        status: "paid",
        method: "card",
        paid_at: new Date().toISOString(),
      });
      return new Response(JSON.stringify({ free_trial: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const svc = caseData.services as any;
    const isCustomQuote = svc?.is_custom_quote || false;
    const basePrice = isCustomQuote ? (caseData.quoted_price_usd || 0) : (svc?.price_usd || 0);
    const price = caseData.delivery_type === "rush" ? basePrice * 1.2 : basePrice;
    const amountCents = Math.round(price * 100);

    if (amountCents <= 0) {
      return new Response(JSON.stringify({ error: "Invalid price" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const origin = req.headers.get("Origin") || "https://id-preview--d629d28b-c867-4925-be53-98c8314080b5.lovable.app";

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [{
        price_data: {
          currency: "usd",
          product_data: {
            name: `${caseData.service_code} — ${svc?.name || "Design Service"}`,
            description: `Case ${case_id.slice(0, 8).toUpperCase()}`,
          },
          unit_amount: amountCents,
        },
        quantity: 1,
      }],
      metadata: {
        case_id,
        user_id: user.id,
      },
      success_url: `${origin}/dashboard/cases/${case_id}?payment=success`,
      cancel_url: `${origin}/dashboard/cases/${case_id}?payment=cancelled`,
    });

    // Create pending payment record
    const serviceRoleClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    await serviceRoleClient.from("payments").insert({
      case_id,
      user_id: user.id,
      amount_usd: price,
      status: "pending",
      method: "card",
      stripe_session_id: session.id,
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("Checkout error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
