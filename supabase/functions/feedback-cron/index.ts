import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SITE_URL = Deno.env.get("SITE_URL") || "https://intel-med-flow.lovable.app";
const FROM = "HDI Connect <info@hdi-tech.com>";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Find cases delivered > 24h ago
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const { data: cases, error } = await supabase
      .from("cases")
      .select("id, user_id, service_code, delivered_at")
      .eq("status", "delivered")
      .not("delivered_at", "is", null)
      .lt("delivered_at", cutoff);

    if (error) throw error;
    if (!cases || cases.length === 0) {
      return new Response(JSON.stringify({ sent: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check which cases already had feedback email sent (tracked via notes in status history)
    const caseIds = cases.map(c => c.id);
    const { data: sentHistory } = await supabase
      .from("case_status_history")
      .select("case_id")
      .in("case_id", caseIds)
      .eq("notes", "Automated feedback request sent");

    const sentSet = new Set((sentHistory || []).map(h => h.case_id));
    const pendingCases = cases.filter(c => !sentSet.has(c.id));

    let sent = 0;
    for (const c of pendingCases) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", c.user_id)
        .single();

      const { data: authUser } = await supabase.auth.admin.getUserById(c.user_id);
      const email = authUser?.user?.email;
      if (!email) continue;

      const caseRef = `HDI-${c.id.substring(0, 8).toUpperCase()}`;

      const html = buildFeedbackEmail(profile?.full_name || "", caseRef, c.id);
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
        body: JSON.stringify({ from: FROM, to: [email], subject: `How Was Your Experience? — Case ${caseRef}`, html }),
      });

      if (res.ok) {
        // Track that feedback was sent using status history with "delivered" as status (valid enum)
        await supabase.from("case_status_history").insert({
          case_id: c.id,
          old_status: "delivered",
          new_status: "delivered",
          notes: "Automated feedback request sent",
        });
        sent++;
      }
    }

    return new Response(JSON.stringify({ sent, checked: pendingCases.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("feedback-cron error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function buildFeedbackEmail(name: string, caseRef: string, caseId: string): string {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 0;"><tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.06);">
<tr><td style="background:#0d1b2e;padding:24px 32px;"><span style="font-family:'Fugaz One',cursive;font-size:20px;letter-spacing:.08em;color:#f0f2f5;">H D I</span><span style="padding-left:12px;font-size:13px;color:#8fb5c9;"> Connect</span></td></tr>
<tr><td style="padding:32px;">
<h1 style="font-size:22px;font-weight:700;color:#0d1b2e;margin:0 0 16px;font-family:Georgia,serif;">We'd Love Your Feedback</h1>
<p style="font-size:14px;color:#334155;line-height:1.6;margin:0 0 12px;">Hi ${name || "there"},</p>
<p style="font-size:14px;color:#334155;line-height:1.6;margin:0 0 12px;">Your case <strong>${caseRef}</strong> was delivered recently. We'd love to hear about your experience.</p>
<p style="font-size:14px;color:#334155;line-height:1.6;margin:0 0 12px;">Please take a moment to rate:</p>
<ul style="color:#334155;font-size:14px;line-height:1.8;"><li>Design quality</li><li>Designer performance</li><li>Overall experience</li></ul>
<a href="${SITE_URL}/dashboard/cases/${caseId}?feedback=true" style="display:inline-block;background:#1d9e75;color:#fff;padding:12px 28px;border-radius:8px;font-size:14px;font-weight:600;text-decoration:none;margin:16px 0;">Share Feedback</a>
<p style="font-size:12px;color:#94a3b8;margin:24px 0 0;">Your feedback helps us improve our services.</p>
</td></tr>
<tr><td style="background:#f8fafc;padding:20px 32px;border-top:1px solid #e2e8f0;"><p style="font-size:11px;color:#94a3b8;margin:0;">© ${new Date().getFullYear()} HDI Connect. All rights reserved.<br/><a href="${SITE_URL}" style="color:#1d9e75;text-decoration:none;">hdi-tech.com</a></p></td></tr>
</table></td></tr></table></body></html>`;
}
