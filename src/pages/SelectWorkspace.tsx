import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { getSwitchableRoles, ROLE_CONFIG, pathForRole } from "@/lib/roleConfig";
import HdiLogo from "@/components/HdiLogo";
import { ArrowRight } from "lucide-react";

const SelectWorkspace = () => {
  const { user, roles, defaultRole, loading, refreshRoles } = useAuth();
  const navigate = useNavigate();
  const [remember, setRemember] = useState(false);
  const [name, setName] = useState<string>("");

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate("/login", { replace: true });
      return;
    }
    // Single role users must never reach this page
    const switchable = getSwitchableRoles(roles);
    if (switchable.length <= 1) {
      navigate(switchable.length === 1 ? pathForRole(switchable[0]) : "/no-role", { replace: true });
      return;
    }
    // Honor remembered default if set
    if (defaultRole && roles.includes(defaultRole)) {
      navigate(pathForRole(defaultRole), { replace: true });
    }
  }, [user, roles, defaultRole, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle()
      .then(({ data }) => setName((data?.full_name as string | undefined)?.split(" ")[0] || ""));
  }, [user]);

  const switchable = getSwitchableRoles(roles);

  const handleSelect = async (role: typeof switchable[number]) => {
    if (remember && user) {
      await supabase.from("profiles").update({ default_role: role }).eq("id", user.id);
      await refreshRoles();
    }
    try { localStorage.setItem("hdi.activeRole", role); } catch { /* ignore */ }
    navigate(pathForRole(role));
  };

  if (loading || switchable.length <= 1) {
    return (
      <div className="min-h-screen bg-hdi-dark flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-hdi-dark flex flex-col items-center justify-center px-4 py-12">
      <div className="flex items-center gap-[14px] mb-10">
        <HdiLogo size={44} />
        <span style={{ fontFamily: "'Fugaz One', cursive", fontSize: "22px", letterSpacing: "0.08em", color: "#F0F2F5" }}>
          H D I
        </span>
      </div>

      <div className="text-center mb-10">
        <h1 className="text-3xl sm:text-4xl font-serif text-hdi-off-white mb-3">
          Welcome back{name ? `, ${name}` : ""} <span aria-hidden>👋</span>
        </h1>
        <p className="text-hdi-muted-text text-base">Where would you like to go?</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-4xl w-full">
        {switchable.map((role) => {
          const cfg = ROLE_CONFIG[role];
          const Icon = cfg.icon;
          return (
            <button
              key={role}
              onClick={() => handleSelect(role)}
              className="group relative bg-card hover:bg-card/95 border border-hdi-border/30 rounded-2xl p-6 text-left transition-all duration-200 hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/40 hover:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <div className={`w-12 h-12 rounded-xl ${cfg.badgeBg} ${cfg.badgeText} flex items-center justify-center mb-4 border ${cfg.badgeBorder}`}>
                <Icon size={24} />
              </div>
              <h3 className="text-lg font-serif text-foreground mb-1">{cfg.workspaceLabel}</h3>
              <p className="text-sm text-muted-foreground font-sans leading-relaxed">{cfg.description}</p>
              <div className="mt-5 inline-flex items-center gap-1.5 text-sm text-primary font-sans font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                Open <ArrowRight size={14} />
              </div>
            </button>
          );
        })}
      </div>

      <label className="mt-8 flex items-center gap-2 text-sm text-hdi-muted-text font-sans cursor-pointer select-none">
        <input
          type="checkbox"
          checked={remember}
          onChange={(e) => setRemember(e.target.checked)}
          className="accent-primary w-4 h-4"
        />
        Remember my choice
      </label>

      <Link to="/" className="mt-6 text-xs text-hdi-muted-text/70 hover:text-hdi-off-white transition-colors font-sans">
        ← Return to homepage
      </Link>
    </div>
  );
};

export default SelectWorkspace;
