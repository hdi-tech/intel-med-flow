import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import HdiLogo from "@/components/HdiLogo";
import type { UserRole } from "@/contexts/AuthContext";
import { getLoginRedirect } from "@/contexts/AuthContext";

const Login = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectParam = searchParams.get("redirect");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) {
      setLoading(false);
      toast.error(error.message);
      return;
    }

    // Fetch roles + default_role and redirect
    const [rolesRes, profileRes] = await Promise.all([
      supabase.from("user_roles").select("role").eq("user_id", data.user.id),
      supabase.from("profiles").select("default_role").eq("id", data.user.id).maybeSingle(),
    ]);
    const roles = (rolesRes.data || []).map((r) => r.role as UserRole);
    const dr = (profileRes.data as { default_role?: string | null } | null)?.default_role as UserRole | undefined;
    const defaultRole = dr && roles.includes(dr) ? dr : null;
    setLoading(false);
    navigate(redirectParam || getLoginRedirect(roles, defaultRole));
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
          <h1 className="text-2xl font-serif text-hdi-off-white mb-1">Welcome back</h1>
          <p className="text-hdi-muted-text text-sm">Sign in to your HDI dashboard</p>
        </div>

        <div className="bg-card rounded-lg border border-hdi-border p-8">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Email address</label>
              <input type="email" className={inputClass} placeholder="jane@clinic.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  className={`${inputClass} pr-10`}
                  placeholder="Your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <div className="text-right mt-1">
                <Link to="/forgot-password" className="text-primary text-xs hover:underline">Forgot password?</Link>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Don't have an account?{" "}
            <Link to="/register" className="text-primary hover:underline">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
