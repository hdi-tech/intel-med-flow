import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/AdminLayout";
import { useToast } from "@/hooks/use-toast";
import { Pencil, Save, X, Plus, Eye, EyeOff } from "lucide-react";

type PriceType = "fixed" | "range" | "custom_quote" | "free";

interface Service {
  id: string;
  code: string;
  name: string;
  description: string | null;
  price_usd: number;
  price_type: PriceType;
  price_min_usd: number | null;
  price_max_usd: number | null;
  quote_note: string | null;
  turnaround_time: string | null;
  is_active: boolean;
  is_visible: boolean;
  is_custom_quote: boolean;
  category_id: string | null;
  categories?: { name: string } | null;
}

interface Category {
  id: string;
  name: string;
  is_visible: boolean;
}

const priceTypeBadge = (t: PriceType, s: Service) => {
  if (t === "free") return <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">Free</span>;
  if (t === "custom_quote") return <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">Custom</span>;
  if (t === "range") return <span className="font-mono text-xs">${Number(s.price_min_usd ?? 0).toFixed(0)}–${Number(s.price_max_usd ?? 0).toFixed(0)}</span>;
  return <span className="font-mono text-xs">${Number(s.price_usd).toFixed(2)}</span>;
};

const AdminServices = () => {
  const { toast } = useToast();
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<Service>>({});
  const [showAdd, setShowAdd] = useState(false);
  const [newSvc, setNewSvc] = useState<Partial<Service>>({
    code: "", name: "", description: "", price_usd: 0, category_id: "",
    is_active: true, is_visible: true, price_type: "fixed",
    price_min_usd: 0, price_max_usd: 0, quote_note: "", turnaround_time: "",
  });

  const load = async () => {
    setLoading(true);
    const { data: svcs } = await supabase.from("services").select("*, categories(name)").order("code");
    setServices((svcs || []) as unknown as Service[]);
    const { data: cats } = await supabase.from("categories").select("id, name, is_visible").order("sort_order");
    setCategories((cats || []) as Category[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const startEdit = (s: Service) => {
    setEditingId(s.id);
    setEditData({
      name: s.name,
      description: s.description,
      price_usd: s.price_usd,
      price_type: s.price_type,
      price_min_usd: s.price_min_usd,
      price_max_usd: s.price_max_usd,
      quote_note: s.quote_note,
      turnaround_time: s.turnaround_time,
      category_id: s.category_id,
      is_active: s.is_active,
      is_visible: s.is_visible,
    });
  };

  const saveEdit = async () => {
    if (!editingId) return;
    const payload: any = { ...editData };
    payload.is_custom_quote = payload.price_type === "custom_quote";
    const { error } = await supabase.from("services").update(payload).eq("id", editingId);
    if (error) {
      toast({ title: "Failed to update", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Service updated" });
    setEditingId(null);
    load();
  };

  const addService = async () => {
    if (!newSvc.code || !newSvc.name) {
      toast({ title: "Code and name required", variant: "destructive" });
      return;
    }
    const payload: any = { ...newSvc };
    payload.is_custom_quote = payload.price_type === "custom_quote";
    if (!payload.category_id) payload.category_id = null;
    const { error } = await supabase.from("services").insert(payload);
    if (error) {
      toast({ title: "Failed to add", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Service added" });
    setShowAdd(false);
    setNewSvc({
      code: "", name: "", description: "", price_usd: 0, category_id: "",
      is_active: true, is_visible: true, price_type: "fixed",
      price_min_usd: 0, price_max_usd: 0, quote_note: "", turnaround_time: "",
    });
    load();
  };

  const toggleServiceVisibility = async (s: Service) => {
    const { error } = await supabase.from("services").update({ is_visible: !s.is_visible }).eq("id", s.id);
    if (error) { toast({ title: "Failed", description: error.message, variant: "destructive" }); return; }
    toast({ title: !s.is_visible ? "Visible on website" : "Hidden from website" });
    load();
  };

  const toggleCategoryVisibility = async (c: Category) => {
    const { error } = await supabase.from("categories").update({ is_visible: !c.is_visible }).eq("id", c.id);
    if (error) { toast({ title: "Failed", description: error.message, variant: "destructive" }); return; }
    toast({ title: !c.is_visible ? `${c.name} visible on website` : `${c.name} hidden from website` });
    load();
  };

  const inputCls = "border border-input rounded-lg px-3 py-2 text-sm font-sans bg-background w-full";

  const renderPriceFields = (data: Partial<Service>, set: (d: Partial<Service>) => void) => {
    const t = data.price_type || "fixed";
    return (
      <>
        <div>
          <label className="block text-xs font-sans text-muted-foreground mb-1">Price Type</label>
          <select className={inputCls} value={t} onChange={(e) => set({ ...data, price_type: e.target.value as PriceType })}>
            <option value="fixed">Fixed Price</option>
            <option value="range">Price Range</option>
            <option value="custom_quote">Custom Quote</option>
            <option value="free">Free</option>
          </select>
        </div>
        {t === "fixed" && (
          <div>
            <label className="block text-xs font-sans text-muted-foreground mb-1">Price (USD)</label>
            <input type="number" step="0.01" className={inputCls} value={data.price_usd ?? 0} onChange={(e) => set({ ...data, price_usd: parseFloat(e.target.value) || 0 })} />
          </div>
        )}
        {t === "range" && (
          <>
            <div>
              <label className="block text-xs font-sans text-muted-foreground mb-1">Min Price (USD)</label>
              <input type="number" step="0.01" className={inputCls} value={data.price_min_usd ?? 0} onChange={(e) => set({ ...data, price_min_usd: parseFloat(e.target.value) || 0 })} />
            </div>
            <div>
              <label className="block text-xs font-sans text-muted-foreground mb-1">Max Price (USD)</label>
              <input type="number" step="0.01" className={inputCls} value={data.price_max_usd ?? 0} onChange={(e) => set({ ...data, price_max_usd: parseFloat(e.target.value) || 0 })} />
            </div>
          </>
        )}
        {t === "custom_quote" && (
          <div className="md:col-span-2">
            <label className="block text-xs font-sans text-muted-foreground mb-1">Quote note (optional)</label>
            <input className={inputCls} placeholder="e.g. Price depends on complexity" value={data.quote_note ?? ""} onChange={(e) => set({ ...data, quote_note: e.target.value })} />
          </div>
        )}
      </>
    );
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-2xl font-serif text-foreground">Services & Pricing</h1>
        <button onClick={() => setShowAdd(!showAdd)} className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-sans font-medium hover:bg-primary/90 min-h-[44px]">
          <Plus size={16} /> Add Service
        </button>
      </div>

      {/* Categories visibility */}
      <div className="bg-card rounded-xl border border-border p-5 mb-6">
        <h2 className="text-sm font-sans font-semibold mb-3">Categories — Website Visibility</h2>
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => toggleCategoryVisibility(c)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-sans border min-h-[40px] ${c.is_visible ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-muted border-border text-muted-foreground"}`}
              title={c.is_visible ? "Click to hide from website" : "Click to show on website"}
            >
              {c.is_visible ? <Eye size={14} /> : <EyeOff size={14} />}
              {c.name}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-2 font-sans">Hidden categories don't appear on the public website but stay editable here.</p>
      </div>

      {showAdd && (
        <div className="bg-card rounded-xl border border-border p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-sans font-semibold">New Service</h3>
            <button onClick={() => setShowAdd(false)} className="text-muted-foreground p-2 min-h-[44px] min-w-[44px]"><X size={16} /></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-sans text-muted-foreground mb-1">Code *</label>
              <input className={inputCls} value={newSvc.code || ""} onChange={(e) => setNewSvc({ ...newSvc, code: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-sans text-muted-foreground mb-1">Name *</label>
              <input className={inputCls} value={newSvc.name || ""} onChange={(e) => setNewSvc({ ...newSvc, name: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-sans text-muted-foreground mb-1">Category</label>
              <select className={inputCls} value={newSvc.category_id || ""} onChange={(e) => setNewSvc({ ...newSvc, category_id: e.target.value })}>
                <option value="">Choose...</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-sans text-muted-foreground mb-1">Description</label>
              <input className={inputCls} value={newSvc.description || ""} onChange={(e) => setNewSvc({ ...newSvc, description: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-sans text-muted-foreground mb-1">Turnaround Time</label>
              <input className={inputCls} placeholder="e.g. 24h, 2-3 days" value={newSvc.turnaround_time || ""} onChange={(e) => setNewSvc({ ...newSvc, turnaround_time: e.target.value })} />
            </div>
            {renderPriceFields(newSvc, setNewSvc)}
            <div className="flex items-center gap-4 md:col-span-3">
              <label className="flex items-center gap-2 text-sm font-sans">
                <input type="checkbox" checked={newSvc.is_active ?? true} onChange={(e) => setNewSvc({ ...newSvc, is_active: e.target.checked })} className="accent-primary" /> Active
              </label>
              <label className="flex items-center gap-2 text-sm font-sans">
                <input type="checkbox" checked={newSvc.is_visible ?? true} onChange={(e) => setNewSvc({ ...newSvc, is_visible: e.target.checked })} className="accent-primary" /> Visible on website
              </label>
            </div>
          </div>
          <button onClick={addService} className="mt-4 bg-primary text-primary-foreground px-5 py-2 rounded-lg text-sm font-sans font-medium hover:bg-primary/90 min-h-[44px]">Add Service</button>
        </div>
      )}

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        {loading ? (
          <div className="p-10 text-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead><tr className="text-left text-xs font-sans text-muted-foreground uppercase tracking-wide bg-muted/30">
                <th className="px-5 py-3">Code</th>
                <th className="px-5 py-3">Category</th>
                <th className="px-5 py-3">Name</th>
                <th className="px-5 py-3">Price</th>
                <th className="px-5 py-3">Active</th>
                <th className="px-5 py-3">Website</th>
                <th className="px-5 py-3"></th>
              </tr></thead>
              <tbody>
                {services.map((s) => editingId === s.id ? (
                  <tr key={s.id} className="border-t border-border bg-muted/20">
                    <td colSpan={7} className="p-5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-sans text-muted-foreground mb-1">Name</label>
                          <input className={inputCls} value={editData.name || ""} onChange={(e) => setEditData({ ...editData, name: e.target.value })} />
                        </div>
                        <div>
                          <label className="block text-xs font-sans text-muted-foreground mb-1">Category</label>
                          <select className={inputCls} value={editData.category_id || ""} onChange={(e) => setEditData({ ...editData, category_id: e.target.value })}>
                            <option value="">Choose...</option>
                            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-sans text-muted-foreground mb-1">Turnaround Time</label>
                          <input className={inputCls} placeholder="e.g. 24h" value={editData.turnaround_time || ""} onChange={(e) => setEditData({ ...editData, turnaround_time: e.target.value })} />
                        </div>
                        <div className="md:col-span-3">
                          <label className="block text-xs font-sans text-muted-foreground mb-1">Description</label>
                          <input className={inputCls} value={editData.description || ""} onChange={(e) => setEditData({ ...editData, description: e.target.value })} />
                        </div>
                        {renderPriceFields(editData, setEditData)}
                        <div className="flex items-center gap-4 md:col-span-3">
                          <label className="flex items-center gap-2 text-sm font-sans">
                            <input type="checkbox" checked={editData.is_active ?? true} onChange={(e) => setEditData({ ...editData, is_active: e.target.checked })} className="accent-primary" /> Active
                          </label>
                          <label className="flex items-center gap-2 text-sm font-sans">
                            <input type="checkbox" checked={editData.is_visible ?? true} onChange={(e) => setEditData({ ...editData, is_visible: e.target.checked })} className="accent-primary" /> Visible on website
                          </label>
                        </div>
                      </div>
                      <div className="mt-4 flex gap-2">
                        <button onClick={saveEdit} className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-sans font-medium hover:bg-primary/90 min-h-[44px] flex items-center gap-2"><Save size={14} /> Save</button>
                        <button onClick={() => setEditingId(null)} className="bg-muted text-foreground px-4 py-2 rounded-lg text-sm font-sans min-h-[44px]">Cancel</button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <tr key={s.id} className="border-t border-border hover:bg-muted/30">
                    <td className="px-5 py-3 text-sm font-mono">{s.code}</td>
                    <td className="px-5 py-3 text-sm font-sans text-muted-foreground">{(s.categories as any)?.name || "—"}</td>
                    <td className="px-5 py-3 text-sm font-sans">{s.name}</td>
                    <td className="px-5 py-3 text-sm font-sans">{priceTypeBadge(s.price_type || (s.is_custom_quote ? "custom_quote" : "fixed"), s)}</td>
                    <td className="px-5 py-3 text-sm font-sans">
                      <span className={`text-xs font-medium ${s.is_active ? "text-emerald-600" : "text-gray-400"}`}>{s.is_active ? "Yes" : "No"}</span>
                    </td>
                    <td className="px-5 py-3">
                      <button onClick={() => toggleServiceVisibility(s)} className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-sans border min-h-[36px] ${s.is_visible ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-muted border-border text-muted-foreground"}`} title={s.is_visible ? "Hide from website" : "Show on website"}>
                        {s.is_visible ? <Eye size={12} /> : <EyeOff size={12} />}
                        {s.is_visible ? "Shown" : "Hidden"}
                      </button>
                    </td>
                    <td className="px-5 py-3">
                      <button onClick={() => startEdit(s)} className="text-muted-foreground hover:text-foreground p-2 min-h-[44px] min-w-[44px]"><Pencil size={14} /></button>
                    </td>
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

export default AdminServices;
