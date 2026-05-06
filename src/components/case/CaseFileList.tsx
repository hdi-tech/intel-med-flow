import { Download, FileText } from "lucide-react";
import { formatDate } from "@/lib/caseHelpers";
import { downloadCaseFile } from "@/lib/storageHelpers";

export interface CaseFileItem {
  id: string;
  file_name: string;
  file_url: string;
  file_label: string | null;
  uploader_role: string | null;
  created_at: string;
}

const roleBadgeClasses: Record<string, string> = {
  client: "bg-blue-100 text-blue-700",
  designer: "bg-indigo-100 text-indigo-700",
  admin: "bg-amber-100 text-amber-700",
};

export default function CaseFileList({ files, title = "Case Files" }: { files: CaseFileItem[]; title?: string }) {
  return (
    <div className="bg-card rounded-xl border border-border p-5">
      <h3 className="text-sm font-sans font-semibold text-foreground mb-3 flex items-center gap-2">
        <FileText size={16} /> {title}
      </h3>
      {files.length === 0 ? (
        <p className="text-sm font-sans text-muted-foreground">No files uploaded.</p>
      ) : (
        <div className="space-y-2">
          {files.map((f) => (
            <div key={f.id} className="flex items-center justify-between bg-muted/30 rounded-lg px-4 py-2.5">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-sans text-foreground truncate">{f.file_name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {f.uploader_role && (
                      <span className={`text-[10px] font-sans font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded ${roleBadgeClasses[f.uploader_role] || "bg-muted text-muted-foreground"}`}>
                        {f.uploader_role}
                      </span>
                    )}
                    <span className="text-[10px] font-sans text-muted-foreground">{formatDate(f.created_at)}</span>
                  </div>
                </div>
              </div>
              <button onClick={() => downloadCaseFile(f.file_url, f.file_name)} className="text-primary p-1 shrink-0 hover:text-primary/80">
                <Download size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
