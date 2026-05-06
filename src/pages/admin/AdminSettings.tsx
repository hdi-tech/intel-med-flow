import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import AdminLayout from "@/components/AdminLayout";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, Loader2 } from "lucide-react";

interface BankForm {
  id: string;
  bank_name: string;
  account_title: string;
  account_number: string;
  iban: string;
  currency: string;
  branch: string;
  swift_code: string;
}

const AdminSettings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [bank, setBank] = useState<BankForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase
      .from("bank_settings" as any)
      .select("*")
      .eq("is_active", true)
      .limit(1)
      .single()
      .then(({ data }) => {
        if (data) setBank(data as unknown as BankForm);
        setLoading(false);
      });
  }, []);

  const handleSave = async () => {
    if (!bank || !user) return;
    setSaving(true);
    const { error } = await supabase
      .from("bank_settings" as any)
      .update({
        bank_name: bank.bank_name,
        account_title: bank.account_title,
        account_number: bank.account_number,
        iban: bank.iban,
        currency: bank.currency,
        branch: bank.branch,
        swift_code: bank.swift_code,
        updated_at: new Date().toISOString(),
        updated_by: user.id,
      } as any)
      .eq("id", bank.id);
    setSaving(false);
    if (error) {
      toast({ title: "Error saving", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Bank details updated successfully" });
    }
  };

  const set = (field: keyof BankForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setBank((prev) => prev ? { ...prev, [field]: e.target.value } : prev);

  const inputClass = "w-full border border-input rounded-lg px-4 py-2.5 text-sm font-sans bg-background text-foreground focus:ring-2 focus:ring-ring";

  return (
    <AdminLayout>
      <h1 className="text-2xl font-serif text-foreground mb-6">Settings</h1>

      <Tabs defaultValue="bank" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="bank" className="font-sans">Bank Details</TabsTrigger>
          <TabsTrigger value="platform" className="font-sans">Platform Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="bank">
          <div className="bg-card rounded-xl border border-border p-6 max-w-xl">
            {loading ? (
              <div className="flex justify-center py-10"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
            ) : !bank ? (
              <p className="text-muted-foreground text-sm font-sans">No bank settings found.</p>
            ) : (
              <div className="space-y-4">
                {([
                  ["bank_name", "Bank Name"],
                  ["account_title", "Account Title"],
                  ["account_number", "Account Number"],
                  ["iban", "IBAN"],
                  ["currency", "Currency"],
                  ["branch", "Branch"],
                  ["swift_code", "Swift Code"],
                ] as [keyof BankForm, string][]).map(([key, label]) => (
                  <div key={key}>
                    <label className="block text-sm font-sans font-medium text-foreground mb-1">{label}</label>
                    <input type="text" className={inputClass} value={bank[key] || ""} onChange={set(key)} />
                  </div>
                ))}

                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2.5 rounded-lg text-sm font-medium font-sans transition-colors disabled:opacity-50 mt-2"
                >
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="platform">
          <div className="bg-card rounded-xl border border-border p-8 text-center">
            <p className="text-muted-foreground font-sans text-sm">Platform settings coming soon.</p>
          </div>
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
};

export default AdminSettings;
