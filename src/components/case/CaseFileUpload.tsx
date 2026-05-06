import { useState } from "react";
import { Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Props {
  caseId: string;
  userId: string;
  uploaderRole: "client" | "designer" | "admin";
  onUploaded: () => void;
  title?: string;
}

export default function CaseFileUpload({ caseId, userId, uploaderRole, onUploaded, title = "Add More Files" }: Props) {
  const { toast } = useToast();
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async () => {
    if (files.length === 0) return;
    setUploading(true);

    for (const file of files) {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `${userId}/${caseId}/${Date.now()}_${safeName}`;
      const { error } = await supabase.storage.from("case-files").upload(path, file);
      if (error) { console.error(error); continue; }

      await supabase.from("case_files").insert({
        case_id: caseId,
        file_name: file.name,
        file_url: path,
        uploaded_by: userId,
        uploader_role: uploaderRole,
      } as any);

      // Post system message
      await supabase.from("case_messages").insert({
        case_id: caseId,
        sender_id: userId,
        sender_role: uploaderRole,
        message: `📎 ${uploaderRole.toUpperCase()} added ${file.name} to this case`,
      });
    }

    toast({ title: "File uploaded successfully" });
    setFiles([]);
    setUploading(false);
    onUploaded();
  };

  return (
    <div className="bg-card rounded-xl border border-border p-5">
      <h3 className="text-sm font-sans font-semibold text-foreground mb-3 flex items-center gap-2">
        <Upload size={16} /> {title}
      </h3>
      <div
        className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-primary/50 cursor-pointer transition-colors"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); setFiles(Array.from(e.dataTransfer.files)); }}
        onClick={() => document.getElementById(`file-upload-${caseId}`)?.click()}
      >
        <Upload size={24} className="mx-auto text-muted-foreground mb-2" />
        <p className="text-sm font-sans text-foreground">Drag & drop or click to browse</p>
        <p className="text-xs font-sans text-muted-foreground mt-1">STL, DCM, ZIP, PDF, JPG, PNG · Max 500MB per file</p>
        <input id={`file-upload-${caseId}`} type="file" multiple className="hidden" accept=".stl,.dcm,.zip,.pdf,.jpg,.jpeg,.png" onChange={(e) => setFiles(Array.from(e.target.files || []))} />
      </div>

      {files.length > 0 && (
        <div className="mt-3 space-y-3">
          <div className="space-y-1">
            {files.map((f, i) => (
              <p key={i} className="text-sm font-sans text-foreground">📄 {f.name}</p>
            ))}
          </div>
          <button onClick={handleUpload} disabled={uploading} className="w-full bg-primary text-primary-foreground py-2.5 rounded-lg text-sm font-sans font-medium hover:bg-primary/90 disabled:opacity-50">
            {uploading ? "Uploading..." : "Upload Files"}
          </button>
        </div>
      )}
    </div>
  );
}
