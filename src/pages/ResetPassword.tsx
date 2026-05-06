import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import HdiLogo from "@/components/HdiLogo";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingLink, setCheckingLink] = useState(true);
  const [hasRecoveryAccess, setHasRecoveryAccess] = useState(false);

  const inputClass =
    "w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring";

  useEffect(() => {
    let mounted = true;

    const verifyRecoverySession = async () => {
      const hash = window.location.hash.replace(/^#/, "");
      const params = new URLSearchParams(hash);
      const type = params.get("type");
      const accessToken = params.get("access_token");
      const refreshToken = params.get("refresh_token");

      if (type === "recovery" && accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (error) {
          toast.error("This reset link is invalid or expired.");
        } else if (mounted) {
          setHasRecoveryAccess(true);
        }
      } else {
        const { data, error } = await supabase.auth.getSession();
        if (!error && data.session && mounted) {
          setHasRecoveryAccess(true);
        }
      }

      if (mounted) {
        setCheckingLink(false);
      }
    };

    verifyRecoverySession();

    return () => {
      mounted = false;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) return toast.error("Password must be at least 8 characters");
    if (password !== confirm) return toast.error("Passwords do not match");
    if (!hasRecoveryAccess) return toast.error("Your reset session is invalid. Please request a new reset link.");

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      toast.error(error.message);
    } else {
      await supabase.auth.signOut();
      toast.success("Password updated successfully!");
      navigate("/login");
    }
  };

  return (
    <div className="min-h-screen bg-hdi-dark flex items-center justify-center py-16 px-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <Link to="/" className="flex items-center gap-[14px] mb-4">
            <HdiLogo size={44} />
            <span style={{ fontFamily: "'Fugaz One', cursive", fontWeight: 400, fontSize: "22px", letterSpacing: "0.08em", color: "#F0F2F5" }}>
              H D I
            </span>
          </Link>
          <h1 className="text-2xl font-serif text-hdi-off-white mb-1">Set new password</h1>
          <p className="text-hdi-muted-text text-sm">Choose a strong password for your account</p>
        </div>

        <div className="bg-card rounded-lg border border-hdi-border p-8">
          {checkingLink ? (
            <p className="text-sm text-muted-foreground text-center">Checking your reset link…</p>
          ) : !hasRecoveryAccess ? (
            <div className="text-center space-y-4">
              <p className="text-sm text-muted-foreground leading-relaxed">
                This password reset link is invalid or has expired. Please request a new reset email.
              </p>
              <Link to="/forgot-password" className="text-primary text-sm hover:underline">
                Request a new reset link
              </Link>
            </div>
          ) : (
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">New password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    className={`${inputClass} pr-10`}
                    placeholder="Min. 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Confirm new password</label>
                <input
                  type="password"
                  className={inputClass}
                  placeholder="Repeat password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {loading ? "Updating..." : "Update password"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
