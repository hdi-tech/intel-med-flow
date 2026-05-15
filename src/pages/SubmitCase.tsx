import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import DashboardLayout from "@/components/DashboardLayout";
import { FILE_REQUIREMENTS, formatCaseId } from "@/lib/caseHelpers";
import { ArrowLeft, ArrowRight, Upload, X, Check, AlertCircle, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { sendEmail } from "@/lib/emailHelpers";

interface Service {
  id: string;
  code: string;
  name: string;
  price_usd: number;
  category_id: string | null;
  is_custom_quote: boolean;
  price_type: "fixed" | "range" | "custom_quote" | "free" | null;
  price_min_usd: number | null;
  price_max_usd: number | null;
}

interface Category {
  id: string;
  name: string;
}

interface UploadedFile {
  file: File;
  label: string;
  progress: number;
}

const STEPS = ["Service", "Details", "Files", "Consultation", "Review"];

const SubmitCase = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [step, setStep] = useState(0);
  const [categories, setCategories] = useState<Category[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [freeTrialCats, setFreeTrialCats] = useState<Set<string>>(new Set());

  // Form state
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [patientRef, setPatientRef] = useState("");
  const [clinicalNotes, setClinicalNotes] = useState("");
  const [deliveryType, setDeliveryType] = useState<"standard" | "rush">("standard");
  const [consultationRequested, setConsultationRequested] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [patientGender, setPatientGender] = useState("");
  const [patientDob, setPatientDob] = useState<Date | undefined>(undefined);

  const selectedService = services.find((s) => s.id === selectedServiceId);
  const selectedCategory = categories.find((c) => c.id === selectedCategoryId);
  const isFreeTrial = selectedCategory ? freeTrialCats.has(selectedCategory.name) : false;
  const priceType = selectedService?.price_type || (selectedService?.is_custom_quote ? "custom_quote" : "fixed");
  const isCustomQuote = priceType === "custom_quote";
  const isFreeService = priceType === "free";
  const isAlignerDesign = selectedCategory?.name?.toLowerCase().includes("aligner") || false;

  // Load categories and services (no auth needed)
  useEffect(() => {
    const load = async () => {
      const { data: cats, error: catsErr } = await supabase.from("categories").select("id, name").order("sort_order");
      if (catsErr) console.error("Failed to load categories:", catsErr);
      setCategories(cats || []);
      const { data: svcs, error: svcsErr } = await supabase
        .from("services")
        .select("id, code, name, price_usd, category_id, is_custom_quote, price_type, price_min_usd, price_max_usd")
        .eq("is_active", true)
        .order("code");
      if (svcsErr) console.error("Failed to load services:", svcsErr);
      setServices((svcs || []) as unknown as Service[]);
    };
    load();
  }, []);

  // Load free trial info (needs auth)
  useEffect(() => {
    if (!user || categories.length === 0) return;
    const loadTrials = async () => {
      const { data: usedTrials } = await supabase.from("free_trials").select("service_category").eq("user_id", user.id);
      const usedSet = new Set((usedTrials || []).map((t) => t.service_category));
      const allCats = categories.map((c) => c.name);
      setFreeTrialCats(new Set(allCats.filter((n) => !usedSet.has(n))));
    };
    loadTrials();
  }, [user, categories]);

  const filteredServices = services.filter((s) => s.category_id === selectedCategoryId);
  const fileReqs = selectedService ? FILE_REQUIREMENTS[selectedService.code] : null;

  const computePrice = () => {
    if (!selectedService) return 0;
    if (isFreeTrial) return 0;
    if (isFreeService) return 0;
    if (isCustomQuote) return 0;
    const base = priceType === "range"
      ? Number(selectedService.price_min_usd ?? 0)
      : Number(selectedService.price_usd ?? 0);
    return deliveryType === "rush" ? base * 1.2 : base;
  };

  const MAX_FILE_SIZE = 1073741824; // 1 GB

  const handleFileAdd = useCallback((files: FileList | null) => {
    if (!files) return;
    const tooBig: string[] = [];
    const valid: UploadedFile[] = [];
    Array.from(files).forEach((f) => {
      if (f.size > MAX_FILE_SIZE) {
        tooBig.push(f.name);
      } else {
        valid.push({ file: f, label: f.name, progress: 100 });
      }
    });
    if (tooBig.length > 0) {
      toast({
        title: "File too large",
        description: `${tooBig.join(", ")} exceeds the 1 GB limit.`,
        variant: "destructive",
      });
    }
    if (valid.length > 0) setUploadedFiles((prev) => [...prev, ...valid]);
  }, [toast]);

  const removeFile = (idx: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const canProceed = (): boolean => {
    switch (step) {
      case 0: return !!selectedServiceId;
      case 1: return patientRef.trim().length > 0 && clinicalNotes.trim().length > 0 && (!isAlignerDesign || !!patientDob);
      case 2: return uploadedFiles.length > 0;
      case 3: return true;
      case 4: return true;
      default: return false;
    }
  };

  const handleNext = () => {
    if (step === 2 && !consultationRequested) {
      setStep(4); // skip consultation
    } else {
      setStep((s) => Math.min(s + 1, 4));
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBack = () => {
    if (step === 4 && !consultationRequested) {
      setStep(2);
    } else {
      setStep((s) => Math.max(s - 1, 0));
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async () => {
    if (!user || !selectedService) return;
    setSubmitting(true);
    setSubmitError(null);

    try {
      const caseId = crypto.randomUUID();
      const { error: caseError } = await supabase.from("cases").insert({
        id: caseId,
        user_id: user.id,
        service_id: selectedService.id,
        service_code: selectedService.code,
        patient_ref: patientRef,
        clinical_notes: clinicalNotes,
        delivery_type: deliveryType,
        consultation_requested: consultationRequested,
        is_free_trial: isFreeTrial,
        patient_gender: patientGender || null,
        patient_dob: patientDob ? format(patientDob, "yyyy-MM-dd") : null,
        status: "submitted",
      });

      if (caseError) throw caseError;

      // Upload files to storage (don't block submission on per-file failures)
      let filesUploaded = 0;
      const fileErrors: string[] = [];
      for (const uf of uploadedFiles) {
        try {
          const safeName = uf.file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
          const filePath = `${user.id}/${caseId}/${Date.now()}_${safeName}`;
          const { error: uploadError } = await supabase.storage.from("case-files").upload(filePath, uf.file);
          if (uploadError) {
            fileErrors.push(`${uf.file.name}: ${uploadError.message}`);
            continue;
          }
          const { error: insertError } = await supabase.from("case_files").insert({
            case_id: caseId,
            file_name: uf.file.name,
            file_url: filePath,
            file_type: uf.file.type || "application/octet-stream",
            file_label: uf.label,
            uploaded_by: user.id,
          });
          if (insertError) {
            fileErrors.push(`${uf.file.name}: ${insertError.message}`);
          } else {
            filesUploaded++;
          }
        } catch (e: any) {
          fileErrors.push(`${uf.file.name}: ${e?.message || "upload failed"}`);
        }
      }
      if (fileErrors.length > 0) {
        console.error("File upload issues:", fileErrors);
        toast({
          title: `Uploaded ${filesUploaded}/${uploadedFiles.length} files`,
          description: "Some files failed. You can re-upload them from the case page.",
          variant: "destructive",
        });
      }

      // Record free trial if applicable
      if (isFreeTrial && selectedCategory) {
        await supabase.from("free_trials").insert({
          user_id: user.id,
          service_category: selectedCategory.name,
        });
      }

      // Send confirmation emails (fire-and-forget; never block navigation)
      if (user.email) {
        sendEmail("case-submitted", user.email, {
          clientName: user.user_metadata?.full_name || "",
          caseRef: formatCaseId(caseId),
          caseId,
          serviceCode: selectedService.code,
          serviceName: selectedService.name,
          deliveryType,
          fileCount: uploadedFiles.length,
        }).catch((e) => console.error("case-submitted email failed:", e));

        if (consultationRequested) {
          sendEmail("consultation-requested", user.email, {
            clientName: user.user_metadata?.full_name || "",
            caseRef: formatCaseId(caseId),
            caseId,
          }).catch((e) => console.error("consultation-requested email failed:", e));
        }
      }

      toast({
        title: "Case submitted successfully!",
        description: `Reference: ${formatCaseId(caseId)}`,
      });
      navigate(`/dashboard/cases/${caseId}`);
    } catch (err: any) {
      const msg = err?.message || "Something went wrong. Please try again.";
      console.error("Case submission failed:", err);
      setSubmitError(msg);
      toast({ title: "Error submitting case", description: msg, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const price = computePrice();

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto">
        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          {STEPS.map((s, i) => {
            const isSkipped = i === 3 && !consultationRequested;
            return (
              <div key={s} className="flex items-center gap-2 flex-1">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-sans font-medium shrink-0 ${
                    i < step ? "bg-primary text-primary-foreground" :
                    i === step ? "bg-primary text-primary-foreground ring-2 ring-primary/30" :
                    isSkipped ? "bg-gray-100 text-gray-300" :
                    "bg-gray-100 text-gray-400"
                  }`}
                >
                  {i < step ? <Check size={14} /> : i + 1}
                </div>
                <span className={`text-xs font-sans hidden sm:block ${i === step ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                  {s}
                </span>
                {i < STEPS.length - 1 && <div className="flex-1 h-px bg-border" />}
              </div>
            );
          })}
        </div>

        <div className="bg-card rounded-xl border border-border p-6 sm:p-8">
          {/* STEP 1 */}
          {step === 0 && (
            <div className="space-y-6">
              <h2 className="text-xl font-serif text-foreground">Select Service</h2>
              <div>
                <label className="block text-sm font-sans font-medium text-foreground mb-1.5">Service Category</label>
                <select
                  className="w-full border border-input rounded-lg px-3 py-2.5 text-sm font-sans bg-background text-foreground focus:ring-2 focus:ring-ring"
                  value={selectedCategoryId}
                  onChange={(e) => { setSelectedCategoryId(e.target.value); setSelectedServiceId(""); }}
                >
                  <option value="">Choose a category...</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {selectedCategoryId && (
                <div>
                  <label className="block text-sm font-sans font-medium text-foreground mb-1.5">Specific Service</label>
                  <select
                    className="w-full border border-input rounded-lg px-3 py-2.5 text-sm font-sans bg-background text-foreground focus:ring-2 focus:ring-ring"
                    value={selectedServiceId}
                    onChange={(e) => setSelectedServiceId(e.target.value)}
                  >
                    <option value="">Choose a service...</option>
                    {filteredServices.map((s) => (
                      <option key={s.id} value={s.id}>
                        {(() => {
                          const t = s.price_type || (s.is_custom_quote ? "custom_quote" : "fixed");
                          if (t === "free") return `${s.code} — ${s.name} — Free`;
                          if (t === "custom_quote") return `${s.code} — ${s.name} — Custom Quote`;
                          if (t === "range") return `${s.code} — ${s.name} — $${Number(s.price_min_usd ?? 0).toFixed(0)}–$${Number(s.price_max_usd ?? 0).toFixed(0)}`;
                          return `${s.code} — ${s.name} — $${Number(s.price_usd).toFixed(2)}`;
                        })()}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {isCustomQuote && selectedService && (
                <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <Info size={18} className="text-amber-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-sans font-medium text-amber-800">This service requires a custom quote</p>
                    <p className="text-xs font-sans text-amber-700 mt-1">
                      Upload your case files and submit. Our team will review your case and send you a personalised price quote within 24 hours via your case message thread.
                    </p>
                  </div>
                </div>
              )}

              {isFreeTrial && selectedService && (
                <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-1.5 rounded-full text-xs font-sans font-medium">
                  🎉 Free trial available — no charge this case
                </div>
              )}
            </div>
          )}

          {/* STEP 2 */}
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-xl font-serif text-foreground">Case Details</h2>

              <div>
                <label className="block text-sm font-sans font-medium text-foreground mb-1.5">Patient Reference Code *</label>
                <input
                  type="text"
                  className="w-full border border-input rounded-lg px-3 py-2.5 text-sm font-sans bg-background text-foreground focus:ring-2 focus:ring-ring"
                  placeholder="e.g. PT-2024-001"
                  value={patientRef}
                  onChange={(e) => setPatientRef(e.target.value)}
                />
                <p className="text-xs font-sans text-muted-foreground mt-1">Use an anonymous code. Do not enter patient real name.</p>
              </div>

              <div>
                <label className="block text-sm font-sans font-medium text-foreground mb-1.5">Patient Gender</label>
                <div className="flex gap-4">
                  {["Male", "Female"].map((g) => (
                    <label key={g} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="patientGender"
                        value={g}
                        checked={patientGender === g}
                        onChange={(e) => setPatientGender(e.target.value)}
                        className="accent-primary"
                      />
                      <span className="text-sm font-sans text-foreground">{g}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-sans font-medium text-foreground mb-1.5">
                  Patient Date of Birth{isAlignerDesign && " *"}
                </label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal font-sans",
                        !patientDob && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {patientDob ? format(patientDob, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={patientDob}
                      onSelect={setPatientDob}
                      defaultMonth={patientDob ?? new Date(2000, 0)}
                      captionLayout="dropdown-buttons"
                      fromYear={1940}
                      toYear={new Date().getFullYear()}
                      disabled={(date) => date > new Date() || date < new Date("1940-01-01")}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
                {isAlignerDesign && (
                  <p className="text-xs font-sans text-amber-600 mt-1">Required for aligner treatment planning</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-sans font-medium text-foreground mb-1.5">
                  Clinical Notes for Designer *
                </label>
                <textarea
                  className="w-full border border-input rounded-lg px-3 py-2.5 text-sm font-sans bg-background text-foreground focus:ring-2 focus:ring-ring min-h-[120px]"
                  placeholder="Describe the case requirements, relevant clinical history, material preferences, and any specific instructions for the specialist."
                  value={clinicalNotes}
                  onChange={(e) => setClinicalNotes(e.target.value)}
                />
                <p className="text-xs font-sans text-muted-foreground mt-1">Provide relevant details for the designer.</p>
              </div>

              <div>
                <label className="block text-sm font-sans font-medium text-foreground mb-3">Delivery Preference</label>
                <div className="space-y-2">
                  {[
                    { val: "standard" as const, label: "Standard — 48 hours", desc: "Base price" },
                    { val: "rush" as const, label: "Rush — 24 hours", desc: "+20% on service price" },
                  ].map((opt) => (
                    <label key={opt.val} className="flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 cursor-pointer transition-colors">
                      <input
                        type="radio"
                        name="delivery"
                        checked={deliveryType === opt.val}
                        onChange={() => setDeliveryType(opt.val)}
                        className="mt-0.5 accent-primary"
                      />
                      <div>
                        <p className="text-sm font-sans font-medium text-foreground">{opt.label}</p>
                        <p className="text-xs font-sans text-muted-foreground">{opt.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <label className="flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={consultationRequested}
                  onChange={(e) => setConsultationRequested(e.target.checked)}
                  className="mt-0.5 accent-primary"
                />
                <div>
                  <p className="text-sm font-sans font-medium text-foreground">Request Consultation</p>
                  <p className="text-xs font-sans text-muted-foreground">I would like an online consultation with the specialist before design begins</p>
                </div>
              </label>
            </div>
          )}

          {/* STEP 3 */}
          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-xl font-serif text-foreground">Upload Files</h2>

              {fileReqs && (
                <div className="space-y-2">
                  <p className="text-sm font-sans font-medium text-foreground">Required files for {selectedService?.code}:</p>
                  <ul className="space-y-1">
                    {fileReqs.required.map((f) => (
                      <li key={f} className="text-xs font-sans text-muted-foreground flex items-center gap-1.5">
                        <span className="text-red-400">✱</span> {f}
                      </li>
                    ))}
                    {fileReqs.optional?.map((f) => (
                      <li key={f} className="text-xs font-sans text-muted-foreground flex items-center gap-1.5">
                        <span className="text-gray-300">○</span> {f} (optional)
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div
                className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); handleFileAdd(e.dataTransfer.files); }}
                onClick={() => document.getElementById("file-input")?.click()}
              >
                <Upload size={32} className="mx-auto text-muted-foreground mb-3" />
                <p className="text-sm font-sans text-foreground font-medium">Drag and drop files here</p>
                <p className="text-xs font-sans text-muted-foreground mt-1">
                  All file formats accepted — Max 1 GB per file
                </p>
                <input
                  id="file-input"
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => handleFileAdd(e.target.files)}
                />
              </div>

              {uploadedFiles.length > 0 && (
                <div className="space-y-2">
                  {uploadedFiles.map((uf, i) => (
                    <div key={i} className="flex items-center justify-between bg-muted/50 rounded-lg px-4 py-2.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileIcon name={uf.file.name} />
                        <div className="min-w-0">
                          <p className="text-sm font-sans text-foreground truncate">{uf.file.name}</p>
                          <p className="text-xs font-sans text-muted-foreground">{formatBytes(uf.file.size)}</p>
                        </div>
                      </div>
                      <button onClick={() => removeFile(i)} className="text-muted-foreground hover:text-destructive p-1">
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* STEP 4 - Consultation */}
          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-xl font-serif text-foreground">Consultation</h2>
              <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <Info size={18} className="text-blue-600 mt-0.5 shrink-0" />
                <p className="text-sm font-sans text-blue-800">
                  You requested a consultation. The assigned specialist will contact you via the case message thread to schedule a call before work begins. This does not delay your case submission.
                </p>
              </div>
            </div>
          )}

          {/* STEP 5 - Review */}
          {step === 4 && (
            <div className="space-y-6">
              <h2 className="text-xl font-serif text-foreground">Review & Confirm</h2>

              <div className="space-y-4">
                <SummaryRow label="Service" value={`${selectedService?.code} — ${selectedService?.name}`} />
                <SummaryRow label="Category" value={selectedCategory?.name || ""} />
                <SummaryRow label="Patient Reference" value={patientRef} />
                {patientGender && <SummaryRow label="Patient Gender" value={patientGender} />}
                {patientDob && <SummaryRow label="Patient DOB" value={format(patientDob, "PPP")} />}
                <SummaryRow label="Delivery" value={deliveryType === "rush" ? "Rush — 24 hours" : "Standard — 48 hours"} />
                <SummaryRow label="Consultation" value={consultationRequested ? "Yes" : "No"} />
                <SummaryRow label="Files" value={`${uploadedFiles.length} file(s)`} />

                <div className="border-t border-border pt-4">
                  {isCustomQuote ? (
                    <SummaryRow label="Price" value="Custom Quote — you will receive a quote within 24 hours of submission" />
                  ) : isFreeService ? (
                    <SummaryRow label="Price" value="Free" highlight />
                  ) : isFreeTrial ? (
                    <SummaryRow label="Price" value="$0.00 — Free Trial Applied" highlight />
                  ) : deliveryType === "rush" && selectedService ? (
                    <SummaryRow
                      label="Price"
                      value={`$${(priceType === "range" ? Number(selectedService.price_min_usd ?? 0) : Number(selectedService.price_usd)).toFixed(2)} + 20% rush = $${price.toFixed(2)}`}
                    />
                  ) : (
                    <SummaryRow label="Price" value={`$${price.toFixed(2)}`} />
                  )}
                </div>
              </div>

              {!isCustomQuote && (
                <div className="flex items-start gap-3 border border-primary/30 bg-primary/5 rounded-lg p-4">
                  <AlertCircle size={18} className="text-primary mt-0.5 shrink-0" />
                  <p className="text-sm font-sans text-foreground">
                    Payment is collected only AFTER you approve the completed design. You will not be charged now.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Inline submission error */}
          {submitError && step === 4 && (
            <div className="mt-6 flex items-start gap-3 bg-destructive/10 border border-destructive/30 rounded-lg p-4">
              <AlertCircle size={18} className="text-destructive mt-0.5 shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-sans font-medium text-destructive">Could not submit case</p>
                <p className="text-xs font-sans text-destructive/80 mt-1 break-words">{submitError}</p>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
            {step > 0 ? (
              <button
                onClick={handleBack}
                className="flex items-center gap-1 text-sm font-sans text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft size={14} /> Back
              </button>
            ) : <div />}

            {step < 4 ? (
              <button
                onClick={handleNext}
                disabled={!canProceed()}
                className="flex items-center gap-1 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-primary-foreground px-5 py-2.5 rounded-lg text-sm font-medium font-sans transition-colors"
              >
                Continue <ArrowRight size={14} />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full sm:w-auto bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground px-8 py-3 rounded-lg text-sm font-medium font-sans transition-colors"
              >
                {submitting ? "Submitting..." : isCustomQuote ? "Submit Case for Review" : "Submit Case"}
              </button>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

function SummaryRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between items-start gap-4">
      <span className="text-sm font-sans text-muted-foreground shrink-0">{label}</span>
      <span className={`text-sm font-sans text-right ${highlight ? "text-emerald-600 font-medium" : "text-foreground"}`}>{value}</span>
    </div>
  );
}

function FileIcon({ name }: { name: string }) {
  const ext = name.split(".").pop()?.toLowerCase();
  const colors: Record<string, string> = { stl: "text-blue-500", zip: "text-amber-500", pdf: "text-red-500", jpg: "text-green-500", jpeg: "text-green-500", png: "text-green-500" };
  return <div className={`text-xs font-mono font-bold uppercase ${colors[ext || ""] || "text-gray-400"}`}>{ext}</div>;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default SubmitCase;
