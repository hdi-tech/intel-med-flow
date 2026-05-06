import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import HdiLogo from "@/components/HdiLogo";

const AuthCallback = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");
  const [errorMsg, setErrorMsg] = useState("");
  const [email, setEmail] = useState("");
  const [resending, setResending] = useState(false);

  useEffect(() => {
    const handleCallback = async () => {
      // 1. PKCE flow: Supabase redirects with ?code= query parameter
      const url = new URL(window.location.href);
      const code = url.searchParams.get("code");
      const errorDescription = url.searchParams.get("error_description");

      if (errorDescription) {
        setStatus("error");
        setErrorMsg(decodeURIComponent(errorDescription.replace(/\+/g, " ")));
        return;
      }

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          setStatus("error");
          setErrorMsg(error.message);
          return;
        }
        setStatus("success");
        setTimeout(() => navigate("/dashboard", { replace: true }), 2000);
        return;
      }

      // 2. Implicit flow fallback: tokens in hash fragment
      const hash = window.location.hash.substring(1);
      if (hash) {
        const params = new URLSearchParams(hash);
        const accessToken = params.get("access_token");
        const refreshToken = params.get("refresh_token");
        const hashError = params.get("error_description");

        if (hashError) {
          setStatus("error");
          setErrorMsg(decodeURIComponent(hashError.replace(/\+/g, " ")));
          return;
        }

        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (error) {
            setStatus("error");
            setErrorMsg(error.message);
            return;
          }
          setStatus("success");
          setTimeout(() => navigate("/dashboard", { replace: true }), 2000);
          return;
        }
      }

      // 3. Already logged in
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setStatus("success");
        setTimeout(() => navigate("/dashboard", { replace: true }), 2000);
        return;
      }

      // No tokens and not logged in
      setStatus("error");
      setErrorMsg("Invalid or expired verification link. Please request a new one.");
    };

    handleCallback();
  }, [navigate]);

  const handleResend = async () => {
    if (!email) return;
    setResending(true);
    const { error } = await supabase.auth.resend({ type: "signup", email });
    setResending(false);
    if (error) {
      setErrorMsg(error.message);
    } else {
      setErrorMsg("");
      setStatus("verifying");
      setTimeout(() => {
        setStatus("error");
        setErrorMsg("Check your inbox for the new verification link.");
      }, 2000);
    }
  };

  return (
    <div className="min-h-screen bg-hdi-dark flex items-center justify-center py-16 px-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center gap-[14px] mb-4">
            <HdiLogo size={44} />
            <span style={{ fontFamily: "'Fugaz One', cursive", fontWeight: 400, fontSize: "22px", letterSpacing: "0.08em", color: "#F0F2F5" }}>
              H D I
            </span>
          </div>
        </div>

        <div className="bg-card rounded-lg border border-hdi-border p-10 text-center">
          {status === "verifying" && (
            <>
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
              <h1 className="text-xl font-serif text-foreground mb-3">Verifying your email...</h1>
              <p className="text-muted-foreground text-sm">Please wait while we confirm your account.</p>
            </>
          )}

          {status === "success" && (
            <>
              <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-6">
                <span className="text-green-500 text-3xl">✓</span>
              </div>
              <h1 className="text-xl font-serif text-foreground mb-3">Email verified successfully!</h1>
              <p className="text-muted-foreground text-sm">Redirecting to your dashboard...</p>
            </>
          )}

          {status === "error" && (
            <>
              <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-6">
                <span className="text-destructive text-3xl">✕</span>
              </div>
              <h1 className="text-xl font-serif text-foreground mb-3">Verification failed</h1>
              <p className="text-muted-foreground text-sm mb-6">{errorMsg}</p>
              <div className="space-y-3">
                <input
                  type="email"
                  placeholder="Enter your email to resend"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <button
                  onClick={handleResend}
                  disabled={resending || !email}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  {resending ? "Sending..." : "Resend verification email"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthCallback;
