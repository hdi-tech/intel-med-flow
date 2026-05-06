import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/AdminLayout";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";

type AlignStatus = "new" | "contacted" | "converted" | "rejected";

interface AlignApplication {
  id: string;
  full_name: string;
  clinic_name: string;
  email: string;
  phone: string | null;
  country: string | null;
  monthly_cases: string | null;
  notes: string | null;
  status: AlignStatus;
  created_at: string;
}

const STATUS_OPTIONS: AlignStatus[] = ["new", "contacted", "converted", "rejected"];

const statusBadgeClass: Record<AlignStatus, string> = {
  new: "bg-[#1D9E75]/15 text-[#1D9E75] border border-[#1D9E75]/30",
  contacted: "bg-blue-100 text-blue-800 border border-blue-200",
  converted: "bg-emerald-100 text-emerald-800 border border-emerald-200",
  rejected: "bg-red-100 text-red-700 border border-red-200",
};

const formatDateTime = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const truncate = (text: string | null, n: number) => {
  if (!text) return "";
  return text.length > n ? text.slice(0, n) + "…" : text;
};

const AdminAlignRequests = () => {
  const { toast } = useToast();
  const [apps, setApps] = useState<AlignApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchApps = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("hdi_align_applications")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      toast({ title: "Failed to load applications", description: error.message, variant: "destructive" });
    } else {
      setApps((data || []) as AlignApplication[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchApps();
  }, []);

  const handleStatusChange = async (id: string, newStatus: AlignStatus) => {
    setUpdatingId(id);
    const prev = apps;
    setApps((cur) => cur.map((a) => (a.id === id ? { ...a, status: newStatus } : a)));
    const { error } = await supabase
      .from("hdi_align_applications")
      .update({ status: newStatus })
      .eq("id", id);
    setUpdatingId(null);
    if (error) {
      setApps(prev);
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Status updated", description: `Marked as ${newStatus}.` });
    }
  };

  const metrics = useMemo(() => {
    const total = apps.length;
    const newCount = apps.filter((a) => a.status === "new").length;
    const now = new Date();
    const thisMonth = apps.filter((a) => {
      const d = new Date(a.created_at);
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    }).length;
    return { total, newCount, thisMonth };
  }, [apps]);

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-medium text-slate-900 mb-1" style={{ fontFamily: "Georgia, serif" }}>
          Align Requests
        </h1>
        <p className="text-sm text-slate-500">
          HDI Align programme applications submitted by clinics.
        </p>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <MetricCard label="Total applications" value={metrics.total} />
        <MetricCard label="New" value={metrics.newCount} accent="#1D9E75" />
        <MetricCard label="This month" value={metrics.thisMonth} />
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 hover:bg-slate-50">
                <TableHead>Submitted</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Clinic</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Country</TableHead>
                <TableHead>Monthly cases</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-12 text-slate-400 text-sm">
                    Loading applications…
                  </TableCell>
                </TableRow>
              ) : apps.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-12 text-slate-400 text-sm">
                    No applications yet.
                  </TableCell>
                </TableRow>
              ) : (
                apps.map((app) => (
                  <TableRow key={app.id}>
                    <TableCell className="text-xs text-slate-500 whitespace-nowrap">
                      {formatDateTime(app.created_at)}
                    </TableCell>
                    <TableCell className="font-medium text-slate-900">{app.full_name}</TableCell>
                    <TableCell className="text-slate-700">{app.clinic_name}</TableCell>
                    <TableCell className="text-slate-700">
                      <a href={`mailto:${app.email}`} className="text-[#1D9E75] hover:underline">
                        {app.email}
                      </a>
                    </TableCell>
                    <TableCell className="text-slate-700 whitespace-nowrap">
                      {app.phone ? (
                        <a href={`tel:${app.phone}`} className="hover:underline">
                          {app.phone}
                        </a>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="text-slate-700">{app.country || "—"}</TableCell>
                    <TableCell className="text-slate-700 whitespace-nowrap">
                      {app.monthly_cases || "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                            statusBadgeClass[app.status]
                          }`}
                        >
                          {app.status}
                        </span>
                        <Select
                          value={app.status}
                          onValueChange={(v) => handleStatusChange(app.id, v as AlignStatus)}
                          disabled={updatingId === app.id}
                        >
                          <SelectTrigger className="h-7 w-[120px] text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {STATUS_OPTIONS.map((s) => (
                              <SelectItem key={s} value={s} className="text-xs">
                                {s}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-700 max-w-[260px]">
                      {app.notes ? (
                        <TooltipProvider delayDuration={150}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="cursor-help text-xs">{truncate(app.notes, 60)}</span>
                            </TooltipTrigger>
                            <TooltipContent side="left" className="max-w-sm whitespace-pre-wrap">
                              {app.notes}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ) : (
                        <span className="text-slate-400 text-xs">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </AdminLayout>
  );
};

const MetricCard = ({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: string;
}) => (
  <div className="bg-white border border-slate-200 rounded-xl p-5">
    <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">{label}</p>
    <p
      className="text-3xl font-medium"
      style={{ color: accent || "#0D1B2E", fontFamily: "Georgia, serif" }}
    >
      {value}
    </p>
  </div>
);

export default AdminAlignRequests;
