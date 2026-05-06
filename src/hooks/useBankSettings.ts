import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface BankSettings {
  id: string;
  bank_name: string;
  account_title: string;
  account_number: string;
  iban: string;
  currency: string;
  branch: string | null;
  swift_code: string | null;
}

export function useBankSettings() {
  const [bank, setBank] = useState<BankSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("bank_settings" as any)
      .select("*")
      .eq("is_active", true)
      .limit(1)
      .single()
      .then(({ data }) => {
        setBank(data as unknown as BankSettings);
        setLoading(false);
      });
  }, []);

  return { bank, loading };
}
