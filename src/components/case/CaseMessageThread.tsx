import { useState, useRef, useEffect } from "react";
import { Send, Paperclip, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { downloadCaseFile } from "@/lib/storageHelpers";
import { sendEmail } from "@/lib/emailHelpers";

export interface CaseMessageItem {
  id: string;
  sender_id: string;
  sender_role: string;
  message: string;
  created_at: string;
  attachment_name?: string | null;
  attachment_url?: string | null;
}

interface Props {
  caseId: string;
  userId: string;
  senderRole: "client" | "designer" | "admin";
  messages: CaseMessageItem[];
  title?: string;
  maxHeight?: string;
  caseData?: { assigned_designer_id?: string | null; user_id?: string; service_code?: string | null };
}

export default function CaseMessageThread({ caseId, userId, senderRole, messages, title = "Messages", maxHeight = "500px", caseData }: Props) {
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [attachFile, setAttachFile] = useState<File | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const isSelf = (role: string) => role === senderRole;

  const handleSend = async () => {
    if ((!newMessage.trim() && !attachFile) || !userId || !caseId) return;
    setSending(true);

    let attachmentName: string | null = null;
    let attachmentUrl: string | null = null;

    if (attachFile) {
      const safeName = attachFile.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `${userId}/${caseId}/${Date.now()}_${safeName}`;
      const { error } = await supabase.storage.from("case-files").upload(path, attachFile);
      if (!error) {
        attachmentUrl = path;
        attachmentName = attachFile.name;

        // Also insert into case_files
        await supabase.from("case_files").insert({
          case_id: caseId,
          file_name: attachFile.name,
          file_url: path,
          uploaded_by: userId,
          uploader_role: senderRole,
        } as any);
      }
    }

    const msgText = newMessage.trim() || (attachmentName ? `📎 Attached: ${attachmentName}` : "");
    if (msgText) {
      await supabase.from("case_messages").insert({
        case_id: caseId,
        sender_id: userId,
        sender_role: senderRole,
        message: attachmentName ? `${msgText}\n__ATTACHMENT__${attachmentName}__${attachmentUrl}__` : msgText,
      });
    }

    setNewMessage("");
    setAttachFile(null);
    setSending(false);

    // Send email notifications for new messages
    const caseRef = `HDI-${caseId.substring(0, 8).toUpperCase()}`;
    const preview = msgText.substring(0, 200);
    if (senderRole === "designer" && caseData?.user_id) {
      // Designer sent message → notify client
      sendEmail("new-message-client", caseData.user_id, {
        caseRef, caseId, preview,
      });
    } else if (senderRole === "client" && caseData?.assigned_designer_id) {
      // Client sent message → notify designer
      sendEmail("new-message-designer", caseData.assigned_designer_id, {
        caseRef, caseId, preview,
      });
    }
  };

  const parseMessage = (msg: string) => {
    const attachRegex = /__ATTACHMENT__(.+?)__(.+?)__$/;
    const match = msg.match(attachRegex);
    if (match) {
      return { text: msg.replace(attachRegex, "").trim(), fileName: match[1], fileUrl: match[2] };
    }
    return { text: msg, fileName: null, fileUrl: null };
  };

  const bubbleColor = (role: string) => {
    if (isSelf(role)) return "bg-primary text-primary-foreground rounded-br-sm";
    if (role === "admin") return "bg-amber-100 text-amber-900 rounded-bl-sm";
    if (role === "designer") return "bg-indigo-100 text-indigo-900 rounded-bl-sm";
    return "bg-muted text-foreground rounded-bl-sm";
  };

  return (
    <div className="bg-card rounded-xl border border-border flex flex-col" style={{ maxHeight }}>
      <div className="p-4 border-b border-border">
        <h3 className="text-sm font-sans font-semibold text-foreground">{title}</h3>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[200px]">
        {messages.length === 0 && <p className="text-xs font-sans text-muted-foreground text-center py-8">No messages yet.</p>}
        {messages.map((m) => {
          const { text, fileName, fileUrl } = parseMessage(m.message);
          return (
            <div key={m.id} className={`flex ${isSelf(m.sender_role) ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] rounded-xl px-3.5 py-2.5 ${bubbleColor(m.sender_role)}`}>
                <span className={`text-[10px] font-sans font-medium uppercase tracking-wide ${isSelf(m.sender_role) ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                  {m.sender_role}
                </span>
                {text && <p className="text-sm font-sans mt-1 leading-relaxed">{text}</p>}
                {fileName && fileUrl && (
                  <button onClick={() => downloadCaseFile(fileUrl, fileName)} className={`mt-2 flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-sans w-full ${isSelf(m.sender_role) ? "bg-white/20 text-primary-foreground" : "bg-background border border-border text-foreground"} hover:opacity-80`}>
                    <Paperclip size={12} />
                    <span className="truncate flex-1 text-left">{fileName}</span>
                    <Download size={12} />
                  </button>
                )}
                <p className={`text-[10px] font-sans mt-1 ${isSelf(m.sender_role) ? "text-primary-foreground/50" : "text-muted-foreground"}`}>
                  {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-3 border-t border-border">
        {attachFile && (
          <div className="flex items-center gap-2 mb-2 text-xs font-sans text-muted-foreground bg-muted/50 rounded-lg px-3 py-1.5">
            <Paperclip size={12} />
            <span className="truncate flex-1">{attachFile.name}</span>
            <button onClick={() => setAttachFile(null)} className="text-destructive hover:underline">Remove</button>
          </div>
        )}
        <div className="flex gap-2">
          <textarea
            className="flex-1 border border-input rounded-lg px-3 py-2 text-sm font-sans bg-background text-foreground resize-none focus:ring-2 focus:ring-ring"
            rows={2}
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          />
          <div className="flex flex-col gap-1 self-end">
            <button
              onClick={() => document.getElementById(`msg-attach-${caseId}`)?.click()}
              className="p-2.5 rounded-lg border border-border hover:bg-muted transition-colors"
              title="Attach file"
            >
              <Paperclip size={16} className="text-muted-foreground" />
            </button>
            <input id={`msg-attach-${caseId}`} type="file" className="hidden" accept=".stl,.dcm,.zip,.pdf,.jpg,.jpeg,.png" onChange={(e) => { if (e.target.files?.[0]) setAttachFile(e.target.files[0]); e.target.value = ""; }} />
            <button
              onClick={handleSend}
              disabled={(!newMessage.trim() && !attachFile) || sending}
              className="bg-primary text-primary-foreground p-2.5 rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
