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

type OsStatus = "new" | "contacted" | "proposal sent" | "converted" | "closed";

interface OsEnquiry {
  id: string;
  full_name: string;
  organisation_name: string;
  email: string;
  phone: string | null;
  facility_type: string | null;
  country: string | null;
  workflow_challenge: string | null;
  status: string;
  created_at: string;
}

const STATUS_OPTIONS: OsStatus[] = ["new", "contacted", "proposal sent", "converted", "closed"];

const statusBadgeClass: Record<OsStatus, string> = {
  "new": "bg-[#1D9E75]/15 text-[#1D9E75] border border-[#1D9E75]/30",
  "contacted": "bg-blue-100 text-blue-800 border border-blue-200",
  "proposal sent": "bg-amber-100 text-amber-800 border border-amber-200",
  "converted": "bg-emerald-100 text-emerald-800 border border-emerald-200",
  "closed": "bg-red-100 text-red-700 border border-red-200",
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

const normalizeStatus = (s: string): OsStatus => {
  const v = (s || "new").toLowerCase();
  return (STATUS_OPTIONS as string[]).includes(v) ? (v as OsStatus) : "new";
};

const AdminOsEnquiries = () => {
  const { toast } = useToast();
  const [rows, setRows] = useState<OsEnquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchRows = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("hdi_os_enquiries")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      toast({ title: "Failed to load enquiries", description: error.message, variant: "destructive" });
    } else {
      setRows((data || []) as OsEnquiry[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRows();
  }, []);

  const handleStatusChange = async (id: string, newStatus: OsStatus) => {
    setUpdatingId(id);
    const prev = rows;
    setRows((cur) => cur.map((r) => (r.id === id ? { ...r, status: newStatus } : r)));
    const { error } = await supabase
      .from("hdi_os_enquiries")
      .update({ status: newStatus })
      .eq("id", id);
    setUpdatingId(null);
    if (error) {
      setRows(prev);
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Status updated", description: `Marked as ${newStatus}.` });
    }
  };

  const metrics = useMemo(() => {
    const total = rows.length;
    const newCount = rows.filter((r) => normalizeStatus(r.status) === "new").length;
    const now = new Date();
    const thisMonth = rows.filter((r) => {
      const d = new Date(r.created_at);
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    }).length;
    return { total, newCount, thisMonth };
  }, [rows]);

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-medium text-slate-900 mb-1" style={{ fontFamily: "Georgia, serif" }}>
          OS Enquiries
        </h1>
        <p className="text-sm text-slate-500">
          HDI OS platform enquiries submitted by healthcare facilities.
        </p>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <MetricCard label="Total enquiries" value={metrics.total} />
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
                <TableHead>Organisation</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Facility type</TableHead>
                <TableHead>Country</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Challenge</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-12 text-slate-400 text-sm">
                    Loading enquiries…
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-12 text-slate-400 text-sm">
                    No enquiries yet.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row) => {
                  const status = normalizeStatus(row.status);
                  return (
                    <TableRow key={row.id}>
                      <TableCell className="text-xs text-slate-500 whitespace-nowrap">
                        {formatDateTime(row.created_at)}
                      </TableCell>
                      <TableCell className="font-medium text-slate-900">{row.full_name}</TableCell>
                      <TableCell className="text-slate-700">{row.organisation_name}</TableCell>
                      <TableCell className="text-slate-700">
                        <a href={`mailto:${row.email}`} className="text-[#1D9E75] hover:underline">
                          {row.email}
                        </a>
                      </TableCell>
                      <TableCell className="text-slate-700 whitespace-nowrap">
                        {row.phone ? (
                          <a href={`tel:${row.phone}`} className="hover:underline">
                            {row.phone}
                          </a>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell className="text-slate-700 whitespace-nowrap">
                        {row.facility_type || "—"}
                      </TableCell>
                      <TableCell className="text-slate-700">{row.country || "—"}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[11px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${statusBadgeClass[status]}`}
                          >
                            {status}
                          </span>
                          <Select
                            value={status}
                            onValueChange={(v) => handleStatusChange(row.id, v as OsStatus)}
                            disabled={updatingId === row.id}
                          >
                            <SelectTrigger className="h-7 w-[140px] text-xs">
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
                        {row.workflow_challenge ? (
                          <TooltipProvider delayDuration={150}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="cursor-help text-xs">
                                  {truncate(row.workflow_challenge, 60)}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent side="left" className="max-w-sm whitespace-pre-wrap">
                                {row.workflow_challenge}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ) : (
                          <span className="text-slate-400 text-xs">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
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

export default AdminOsEnquiries;
