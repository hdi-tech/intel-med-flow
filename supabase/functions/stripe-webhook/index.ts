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
    const body = await req.text();
    const sig = req.headers.get("stripe-signature");

    // If webhook secret is set, verify signature; otherwise accept (for testing)
    let event: Stripe.Event;
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

    if (webhookSecret && sig) {
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    } else {
      event = JSON.parse(body) as Stripe.Event;
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const caseId = session.metadata?.case_id;
      const userId = session.metadata?.user_id;

      if (!caseId) {
        return new Response(JSON.stringify({ error: "No case_id in metadata" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      );

      // Update payment record
      await supabase
        .from("payments")
        .update({
          status: "paid",
          paid_at: new Date().toISOString(),
          stripe_session_id: session.id,
        })
        .eq("stripe_session_id", session.id);

      // Update case status to paid
      await supabase
        .from("cases")
        .update({ status: "paid" })
        .eq("id", caseId)
        .eq("status", "awaiting_payment");

      console.log(`Payment completed for case ${caseId}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("Webhook error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
