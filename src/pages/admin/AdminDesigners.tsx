import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/AdminLayout";
import { formatDate } from "@/lib/caseHelpers";
import { Plus, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DesignerProfile {
  id: string;
  full_name: string | null;
  specialty: string | null;
  created_at: string;
  activeCases: number;
  completedCases: number;
}

const AdminDesigners = () => {
  const { toast } = useToast();
  const [designers, setDesigners] = useState<DesignerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [newSpecialty, setNewSpecialty] = useState("");

  const load = async () => {
    const { data: roles } = await supabase.from("user_roles").select("user_id").eq("role", "designer");
    if (!roles || roles.length === 0) { setDesigners([]); setLoading(false); return; }
    const ids = roles.map((r) => r.user_id);
    const { data: profiles } = await supabase.from("profiles").select("*").in("id", ids);
    const { data: cases } = await supabase.from("cases").select("assigned_designer_id, status");

    const result = (profiles || []).map((p) => {
      const assigned = (cases || []).filter((c) => c.assigned_designer_id === p.id);
      return {
        ...p,
        activeCases: assigned.filter((c) => !["delivered", "paid"].includes(c.status)).length,
        completedCases: assigned.filter((c) => c.status === "delivered").length,
      };
    });
    setDesigners(result);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleAddDesigner = async () => {
    if (!newEmail || !newName) return;
    toast({ title: "Designer invitation", description: `To add a designer, register them at /register and then assign the 'designer' role via the database.` });
    setShowAdd(false);
    setNewEmail(""); setNewName(""); setNewSpecialty("");
  };

  return (
    <AdminLayout>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl font-serif text-foreground">Designers</h1>
        <button onClick={() => setShowAdd(!showAdd)} className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-sans font-medium hover:bg-primary/90 whitespace-nowrap">
          <Plus size={16} /> Add Designer
        </button>
      </div>

      {showAdd && (
        <div className="bg-card rounded-xl border border-border p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-sans font-semibold">Add New Designer</h3>
            <button onClick={() => setShowAdd(false)} className="text-muted-foreground"><X size={16} /></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <input placeholder="Full Name *" className="border border-input rounded-lg px-3 py-2 text-sm font-sans bg-background" value={newName} onChange={(e) => setNewName(e.target.value)} />
            <input placeholder="Email *" type="email" className="border border-input rounded-lg px-3 py-2 text-sm font-sans bg-background" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
            <input placeholder="Specialty" className="border border-input rounded-lg px-3 py-2 text-sm font-sans bg-background" value={newSpecialty} onChange={(e) => setNewSpecialty(e.target.value)} />
          </div>
          <button onClick={handleAddDesigner} className="mt-4 bg-primary text-primary-foreground px-5 py-2 rounded-lg text-sm font-sans font-medium hover:bg-primary/90">Create Designer Account</button>
        </div>
      )}

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        {loading ? (
          <div className="p-10 text-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" /></div>
        ) : designers.length === 0 ? (
          <div className="p-10 text-center text-muted-foreground text-sm font-sans">No designers registered yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="text-left text-xs font-sans text-muted-foreground uppercase tracking-wide bg-muted/30">
                <th className="px-5 py-3">Name</th>
                <th className="px-5 py-3">Specialty</th>
                <th className="px-5 py-3">Active</th>
                <th className="px-5 py-3">Completed</th>
                <th className="px-5 py-3">Joined</th>
              </tr></thead>
              <tbody>
                {designers.map((d) => (
                  <tr key={d.id} className="border-t border-border hover:bg-muted/30">
                    <td className="px-5 py-3 text-sm font-sans font-medium">{d.full_name || "—"}</td>
                    <td className="px-5 py-3 text-sm font-sans text-muted-foreground">{d.specialty || "—"}</td>
                    <td className="px-5 py-3 text-sm font-sans">{d.activeCases}</td>
                    <td className="px-5 py-3 text-sm font-sans">{d.completedCases}</td>
                    <td className="px-5 py-3 text-sm font-sans text-muted-foreground">{formatDate(d.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminDesigners;
