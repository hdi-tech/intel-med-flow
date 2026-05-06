import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import HdiLogo from "@/components/HdiLogo";
import { specialtyGroups } from "@/lib/specialties";
import { countryCodes } from "@/lib/countryCodes";

const countries = [
  "Afghanistan","Albania","Algeria","Andorra","Angola","Argentina","Armenia","Australia","Austria","Azerbaijan",
  "Bahrain","Bangladesh","Belarus","Belgium","Bhutan","Bolivia","Bosnia and Herzegovina","Brazil","Brunei","Bulgaria",
  "Cambodia","Cameroon","Canada","Chad","Chile","China","Colombia","Costa Rica","Croatia","Cuba","Cyprus","Czech Republic",
  "Denmark","Dominican Republic","Ecuador","Egypt","El Salvador","Estonia","Ethiopia","Fiji","Finland","France",
  "Georgia","Germany","Ghana","Greece","Guatemala","Honduras","Hungary","Iceland","India","Indonesia","Iran","Iraq",
  "Ireland","Israel","Italy","Jamaica","Japan","Jordan","Kazakhstan","Kenya","Kuwait","Kyrgyzstan",
  "Latvia","Lebanon","Libya","Lithuania","Luxembourg","Malaysia","Maldives","Malta","Mauritius","Mexico",
  "Moldova","Monaco","Mongolia","Montenegro","Morocco","Mozambique","Myanmar","Nepal","Netherlands","New Zealand",
  "Nigeria","North Macedonia","Norway","Oman","Pakistan","Palestine","Panama","Paraguay","Peru","Philippines",
  "Poland","Portugal","Qatar","Romania","Russia","Rwanda","Saudi Arabia","Senegal","Serbia","Singapore",
  "Slovakia","Slovenia","Somalia","South Africa","South Korea","Spain","Sri Lanka","Sudan","Sweden","Switzerland",
  "Syria","Taiwan","Tanzania","Thailand","Tunisia","Turkey","Uganda","Ukraine","United Arab Emirates",
  "United Kingdom","United States","Uruguay","Uzbekistan","Venezuela","Vietnam","Yemen","Zambia","Zimbabwe","Other",
];

const Register = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");
  const [countryOpen, setCountryOpen] = useState(false);
  const [phoneCodeSearch, setPhoneCodeSearch] = useState("");
  const [phoneCodeOpen, setPhoneCodeOpen] = useState(false);

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phoneCode: "+971",
    phoneNumber: "",
    password: "",
    confirmPassword: "",
    clinicName: "",
    country: "",
    specialty: "",
  });

  const filteredCountries = countries.filter((c) =>
    c.toLowerCase().includes(countrySearch.toLowerCase())
  );

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreed) return toast.error("Please agree to the Terms & Conditions");
    if (form.password.length < 8) return toast.error("Password must be at least 8 characters");
    if (form.password !== form.confirmPassword) return toast.error("Passwords do not match");
    if (!form.fullName || !form.email || !form.phoneNumber || !form.clinicName || !form.country || !form.specialty)
      return toast.error("Please fill in all required fields");

    setLoading(true);
    const fullPhone = `${form.phoneCode}${form.phoneNumber}`;
    const { data: signUpData, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: {
          full_name: form.fullName,
          clinic_name: form.clinicName,
          country: form.country,
          specialty: form.specialty,
        },
      },
    });

    if (!error && signUpData?.user) {
      // Update profile with phone number
      await supabase.from("profiles").update({ phone_number: fullPhone } as any).eq("id", signUpData.user.id);
    }
    setLoading(false);

    if (error) {
      toast.error(error.message);
    } else {
      // Note: Supabase Auth sends the verification email automatically.
      // We intentionally do NOT send a separate "welcome" email here so the
      // user receives a single combined Welcome + Verify email.
      navigate("/verify-email", { state: { email: form.email } });
    }
  };

  const inputClass =
    "w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring";

  return (
    <div className="min-h-screen bg-hdi-dark flex items-center justify-center py-16 px-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <Link to="/" className="flex items-center gap-[14px] mb-4">
            <HdiLogo size={44} />
            <span
              style={{
                fontFamily: "'Fugaz One', cursive",
                fontWeight: 400,
                fontSize: "22px",
                letterSpacing: "0.08em",
                color: "#F0F2F5",
              }}
            >
              H D I
            </span>
          </Link>
          <h1 className="text-2xl font-serif text-hdi-off-white mb-1">Create your account</h1>
          <p className="text-hdi-muted-text text-sm">Start with a free trial case on every service</p>
        </div>

        <div className="bg-card rounded-lg border border-hdi-border p-8">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Full name *</label>
              <input type="text" className={inputClass} placeholder="Dr. Jane Smith" value={form.fullName} onChange={set("fullName")} />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Email address *</label>
              <input type="email" className={inputClass} placeholder="jane@clinic.com" value={form.email} onChange={set("email")} />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Phone Number *</label>
              <div className="flex gap-2">
                <div className="relative" style={{ minWidth: "140px" }}>
                  <input
                    type="text"
                    className={`${inputClass} pr-2`}
                    placeholder="Search code..."
                    value={phoneCodeOpen ? phoneCodeSearch : `${countryCodes.find(c => c.code === form.phoneCode)?.country || ""} (${form.phoneCode})`}
                    onFocus={() => { setPhoneCodeOpen(true); setPhoneCodeSearch(""); }}
                    onChange={(e) => setPhoneCodeSearch(e.target.value)}
                    onBlur={() => setTimeout(() => setPhoneCodeOpen(false), 200)}
                  />
                  {phoneCodeOpen && (
                    <div className="absolute z-50 w-64 mt-1 max-h-48 overflow-y-auto rounded-lg border border-input bg-background shadow-lg">
                      {countryCodes
                        .filter(c => {
                          if (!phoneCodeSearch) return true;
                          const q = phoneCodeSearch.toLowerCase();
                          return c.country.toLowerCase().includes(q) || c.code.includes(q);
                        })
                        .map((c) => (
                          <button
                            key={c.iso}
                            type="button"
                            className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-accent/50"
                            onMouseDown={() => { setForm(f => ({ ...f, phoneCode: c.code })); setPhoneCodeOpen(false); }}
                          >
                            {c.country} ({c.code})
                          </button>
                        ))}
                    </div>
                  )}
                </div>
                <input
                  type="tel"
                  className={`${inputClass} flex-1`}
                  placeholder="Phone number"
                  value={form.phoneNumber}
                  onChange={set("phoneNumber")}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Password *</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  className={`${inputClass} pr-10`}
                  placeholder="Min. 8 characters"
                  value={form.password}
                  onChange={set("password")}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Confirm password *</label>
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  className={`${inputClass} pr-10`}
                  placeholder="Repeat password"
                  value={form.confirmPassword}
                  onChange={set("confirmPassword")}
                />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Clinic / practice name *</label>
              <input type="text" className={inputClass} placeholder="Smile Dental Clinic" value={form.clinicName} onChange={set("clinicName")} />
            </div>
            <div className="relative">
              <label className="block text-sm font-medium text-foreground mb-1">Country *</label>
              <input
                type="text"
                className={inputClass}
                placeholder="Search country..."
                value={countryOpen ? countrySearch : form.country}
                onFocus={() => { setCountryOpen(true); setCountrySearch(""); }}
                onChange={(e) => setCountrySearch(e.target.value)}
                onBlur={() => setTimeout(() => setCountryOpen(false), 200)}
              />
              {countryOpen && (
                <div className="absolute z-50 w-full mt-1 max-h-48 overflow-y-auto rounded-lg border border-input bg-background shadow-lg">
                  {filteredCountries.map((c) => (
                    <button
                      key={c}
                      type="button"
                      className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-accent/50"
                      onMouseDown={() => { setForm((f) => ({ ...f, country: c })); setCountryOpen(false); }}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Specialty *</label>
              <select className={inputClass} value={form.specialty} onChange={set("specialty")}>
                <option value="">Select specialty</option>
                {specialtyGroups.map((g) => (
                  <optgroup key={g.label} label={g.label}>
                    {g.options.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-input accent-primary"
              />
              <span className="text-sm text-muted-foreground">
                I agree to the <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Terms & Conditions</a>
              </span>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-2.5 rounded-lg font-medium transition-colors mt-2 disabled:opacity-50"
            >
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Already have an account?{" "}
            <Link to="/login" className="text-primary hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
