import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import HdiLogo from "@/components/HdiLogo";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const inputClass =
    "w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return toast.error("Please enter your email address");
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: "https://hdi-tech.com/reset-password",
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      setSent(true);
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
          <h1 className="text-2xl font-serif text-hdi-off-white mb-1">Reset your password</h1>
          <p className="text-hdi-muted-text text-sm">We'll send you a link to reset it</p>
        </div>

        <div className="bg-card rounded-lg border border-hdi-border p-8">
          {sent ? (
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <span className="text-primary text-2xl">✉</span>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                We've sent a reset link to <span className="text-foreground font-medium">{email}</span>. Check your inbox and follow the instructions.
              </p>
              <Link to="/login" className="text-primary text-sm hover:underline">Back to sign in</Link>
            </div>
          ) : (
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Email address</label>
                <input type="email" className={inputClass} placeholder="jane@clinic.com" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {loading ? "Sending..." : "Send reset link"}
              </button>
              <p className="text-center text-sm text-muted-foreground">
                <Link to="/login" className="text-primary hover:underline">Back to sign in</Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
