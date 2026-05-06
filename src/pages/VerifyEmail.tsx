import { useState } from "react";
import { useLocation, Link } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import HdiLogo from "@/components/HdiLogo";

const VerifyEmail = () => {
  const location = useLocation();
  const email = (location.state as { email?: string })?.email || "your email";
  const [resending, setResending] = useState(false);

  const handleResend = async () => {
    setResending(true);
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
    });
    setResending(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Verification email sent!");
    }
  };

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
        </div>

        <div className="bg-card rounded-lg border border-hdi-border p-10 text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <span className="text-primary text-2xl">✉</span>
          </div>
          <h1 className="text-xl font-serif text-foreground mb-3">Check your email</h1>
          <p className="text-muted-foreground text-sm leading-relaxed mb-6">
            We've sent a verification link to <span className="text-foreground font-medium">{email}</span>. Click the link to verify your account and access your dashboard.
          </p>
          <button
            onClick={handleResend}
            disabled={resending}
            className="text-primary text-sm hover:underline disabled:opacity-50"
          >
            {resending ? "Sending..." : "Resend verification email"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
