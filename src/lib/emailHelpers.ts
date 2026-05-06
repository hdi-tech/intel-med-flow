import { supabase } from "@/integrations/supabase/client";

export async function sendEmail(template: string, to: string, data?: Record<string, any>) {
  try {
    const { error } = await supabase.functions.invoke("send-email", {
      body: { template, to, data },
    });
    if (error) console.error(`Email (${template}) failed:`, error);
  } catch (err) {
    console.error(`Email (${template}) error:`, err);
  }
}

export const ADMIN_EMAIL = "info@hdi-tech.com";
