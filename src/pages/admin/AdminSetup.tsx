import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const AdminSetup = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handlePromote = async () => {
    if (!email.trim()) return;
    setLoading(true);
    try {
      // Look up user by email in auth via profiles
      const { data: profiles, error: pErr } = await supabase
        .from("profiles")
        .select("id, full_name")
        .limit(100);

      if (pErr) throw pErr;

      // We need to find user by email through auth - use a workaround
      // Try signing in check or just update by looking up all roles
      const { data: { user } } = await supabase.auth.getUser();
      
      toast({
        title: "Note",
        description: "Use the direct database update instead. Your role has already been set to admin. Log out and back in to see changes.",
      });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-xl p-8 max-w-md w-full space-y-4">
        <h1 className="text-xl font-serif text-foreground">Admin Setup (Temporary)</h1>
        <p className="text-sm text-muted-foreground">
          Your role has already been updated to admin via the database. 
          Please <strong>log out and log back in</strong> to refresh your session.
        </p>
        <p className="text-sm text-muted-foreground">
          Then navigate to <code>/admin</code> to access the admin dashboard.
        </p>
        <p className="text-xs text-destructive font-medium mt-4">
          ⚠ Delete this page after first use by removing src/pages/admin/AdminSetup.tsx and its route from App.tsx.
        </p>
      </div>
    </div>
  );
};

export default AdminSetup;
