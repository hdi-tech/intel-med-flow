import { useEffect, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import HdiLogo from "@/components/HdiLogo";

const SPECIALIZATIONS = [
  "Aligners",
  "Surgical Guides",
  "Crowns & Bridges",
  "CBCT Reporting",
  "Splints",
  "Other",
];

const DesignerSignup = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const [invitation, setInvitation] = useState<any>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [form, setForm] = useState({
    password: "",
    confirmPassword: "",
    phone: "",
    country: "",
    yearsExperience: "",
    specializations: [] as string[],
  });

  useEffect(() => {
    if (!token) {
      setError("No invitation token provided.");
      setLoading(false);
      return;
    }

    const validate = async () => {
      const { data, error: fetchErr } = await supabase
        .from("designer_invitations")
        .select("*")
        .eq("token", token)
        .single();

      if (fetchErr || !data) {
        setError("This invitation link is invalid. Please contact info@hdi-tech.com");
        setLoading(false);
        return;
      }

      if (data.status === "accepted") {
        setError("This invitation has already been used. Please login instead.");
        setLoading(false);
        return;
      }

      if (new Date(data.expires_at) < new Date()) {
        setError("This invitation link has expired. Please contact info@hdi-tech.com");
        setLoading(false);
        return;
      }

      setInvitation(data);
      setLoading(false);
    };

    validate();
  }, [token]);

  const toggleSpecialization = (spec: string) => {
    setForm(f => ({
      ...f,
      specializations: f.specializations.includes(spec)
        ? f.specializations.filter(s => s !== spec)
        : [...f.specializations, spec],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invitation) return;

    if (form.password.length < 8) return toast.error("Password must be at least 8 characters");
    if (form.password !== form.confirmPassword) return toast.error("Passwords do not match");
    if (!form.phone || !form.country) return toast.error("Please fill in all required fields");

    // Years of experience: optional, but if provided must be a whole number 0–60.
    if (form.yearsExperience.trim() !== "") {
      const yrs = Number(form.yearsExperience);
      if (!Number.isFinite(yrs)) return toast.error("Years of experience must be a number");
      if (yrs < 0) return toast.error("Years of experience cannot be negative");
      if (yrs > 60) return toast.error("Please enter a valid number of years (0–60)");
    }

    setSubmitting(true);

    // Create account
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email: invitation.email,
      password: form.password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: {
          full_name: invitation.name,
          clinic_name: "",
          country: form.country,
          specialty: form.specializations.join(", "),
        },
      },
    });

    if (signUpError) {
      toast.error(signUpError.message);
      setSubmitting(false);
      return;
    }

    if (authData.user) {
      // Update profile with extra data
      await supabase.from("profiles").update({
        specialty: form.specializations.join(", "),
        country: form.country,
      }).eq("id", authData.user.id);

      // Change role from client to designer
      await supabase.from("user_roles").delete().eq("user_id", authData.user.id);
      await supabase.from("user_roles").insert({ user_id: authData.user.id, role: "designer" as any });

      // Mark invitation as accepted
      await supabase.from("designer_invitations").update({
        status: "accepted",
        accepted_at: new Date().toISOString(),
      }).eq("id", invitation.id);

      // Send welcome email
      await supabase.functions.invoke("send-email", {
        body: {
          template: "designer-welcome",
          to: invitation.email,
          data: { name: invitation.name },
        },
      });
    }

    toast.success("Account created successfully! Please check your email to verify.");
    setSubmitting(false);
    navigate("/verify-email", { state: { email: invitation.email } });
  };

  const inputClass = "w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring";

  if (loading) {
    return (
      <div className="min-h-screen bg-hdi-dark flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-hdi-dark flex items-center justify-center py-16 px-4">
        <div className="w-full max-w-md text-center">
          <Link to="/" className="flex items-center justify-center gap-[14px] mb-8">
            <HdiLogo size={44} />
            <span style={{ fontFamily: "'Fugaz One', cursive", fontWeight: 400, fontSize: "22px", letterSpacing: "0.08em", color: "#F0F2F5" }}>H D I</span>
          </Link>
          <div className="bg-card rounded-lg border border-hdi-border p-8">
            <p className="text-destructive font-sans mb-4">{error}</p>
            <Link to="/login" className="text-primary hover:underline text-sm font-sans">Go to Login</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-hdi-dark flex items-center justify-center py-16 px-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <Link to="/" className="flex items-center gap-[14px] mb-4">
            <HdiLogo size={44} />
            <span style={{ fontFamily: "'Fugaz One', cursive", fontWeight: 400, fontSize: "22px", letterSpacing: "0.08em", color: "#F0F2F5" }}>H D I</span>
          </Link>
          <h1 className="text-2xl font-serif text-hdi-off-white mb-1">Complete Your Designer Profile</h1>
          <p className="text-hdi-muted-text text-sm">You've been invited to join HDI Connect as a Designer</p>
        </div>

        <div className="bg-card rounded-lg border border-hdi-border p-8">
          <div className="bg-muted/50 rounded-lg p-3 mb-4">
            <p className="text-sm font-sans"><span className="text-muted-foreground">Name:</span> <span className="font-medium">{invitation?.name}</span></p>
            <p className="text-sm font-sans"><span className="text-muted-foreground">Email:</span> <span className="font-medium">{invitation?.email}</span></p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Password *</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  className={`${inputClass} pr-10`}
                  placeholder="Min. 8 characters"
                  value={form.password}
                  onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Confirm Password *</label>
              <input type="password" className={inputClass} placeholder="Repeat password" value={form.confirmPassword} onChange={(e) => setForm(f => ({ ...f, confirmPassword: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Phone Number *</label>
              <input type="tel" className={inputClass} placeholder="+971 50 123 4567" value={form.phone} onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Country *</label>
              <input type="text" className={inputClass} placeholder="United Arab Emirates" value={form.country} onChange={(e) => setForm(f => ({ ...f, country: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Years of Experience</label>
              <input
                type="number"
                min={0}
                max={60}
                step={1}
                inputMode="numeric"
                className={inputClass}
                placeholder="5"
                value={form.yearsExperience}
                onChange={(e) => {
                  const raw = e.target.value;
                  if (raw === "") {
                    setForm(f => ({ ...f, yearsExperience: "" }));
                    return;
                  }
                  const n = Number(raw);
                  if (!Number.isFinite(n)) {
                    setForm(f => ({ ...f, yearsExperience: "" }));
                    return;
                  }
                  // Clamp to 0–60 and round to whole number.
                  const clamped = Math.max(0, Math.min(60, Math.round(n)));
                  setForm(f => ({ ...f, yearsExperience: String(clamped) }));
                }}
                onKeyDown={(e) => {
                  // Block "-", "+", "e", "." so negatives / decimals can't be typed.
                  if (["-", "+", "e", "E", "."].includes(e.key)) e.preventDefault();
                }}
              />
              <p className="text-xs text-muted-foreground mt-1">Whole number between 0 and 60.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Specializations</label>
              <div className="flex flex-wrap gap-2">
                {SPECIALIZATIONS.map(spec => (
                  <button
                    key={spec}
                    type="button"
                    onClick={() => toggleSpecialization(spec)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                      form.specializations.includes(spec)
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background text-foreground border-input hover:bg-muted/50"
                    }`}
                  >
                    {spec}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-2.5 rounded-lg font-medium transition-colors mt-2 disabled:opacity-50"
            >
              {submitting ? "Creating account..." : "Complete Signup"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default DesignerSignup;
