import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth, type UserRole } from "@/contexts/AuthContext";
import { ROLE_CONFIG, getSwitchableRoles, pathForRole, deriveActiveRole } from "@/lib/roleConfig";
import { Check, ChevronDown } from "lucide-react";

interface RoleSwitcherProps {
  /** Optional override for which role is active (defaults to derived-from-URL). */
  activeRoleOverride?: UserRole;
}

/**
 * Navbar role switcher — renders nothing if the user has fewer than 2 switchable roles.
 * Source of truth for the active role is the current pathname.
 */
const RoleSwitcher = ({ activeRoleOverride }: RoleSwitcherProps) => {
  const { roles, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const switchable = getSwitchableRoles(roles);
  const activeRole = activeRoleOverride ?? deriveActiveRole(location.pathname, roles) ?? switchable[0];

  // Keyboard shortcuts: Ctrl/Cmd + 1..4
  useEffect(() => {
    if (switchable.length < 2) return;
    const handler = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      const digit = parseInt(e.key, 10);
      if (!digit || digit < 1 || digit > 9) return;
      const target = switchable.find((r) => ROLE_CONFIG[r].shortcutDigit === digit);
      if (target && target !== activeRole) {
        e.preventDefault();
        navigate(pathForRole(target));
        setOpen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [switchable, activeRole, navigate]);

  // Close on outside click / Escape
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("mousedown", onClick);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onClick);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (switchable.length < 2 || !activeRole) return null;
  const activeCfg = ROLE_CONFIG[activeRole];
  const ActiveIcon = activeCfg.icon;

  return (
    <div className="relative" ref={wrapRef}>
      <button
        onClick={() => setOpen((o) => !o)}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-sans font-medium border ${activeCfg.badgeBg} ${activeCfg.badgeText} ${activeCfg.badgeBorder} hover:opacity-90 transition-opacity`}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <ActiveIcon size={13} />
        <span>{activeCfg.workspaceLabel.replace(" Dashboard", "")}</span>
        <ChevronDown size={12} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-72 bg-card border border-border rounded-xl shadow-2xl shadow-black/30 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150"
        >
          <div className="px-4 pt-3 pb-2 text-[11px] uppercase tracking-wider font-sans text-muted-foreground">
            Switch Workspace
          </div>
          <div className="py-1">
            {switchable.map((role) => {
              const cfg = ROLE_CONFIG[role];
              const Icon = cfg.icon;
              const isActive = role === activeRole;
              return (
                <button
                  key={role}
                  role="menuitem"
                  onClick={() => {
                    setOpen(false);
                    if (!isActive) navigate(pathForRole(role));
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-sans text-left transition-colors ${
                    isActive ? "bg-muted/60" : "hover:bg-muted/40"
                  }`}
                >
                  <span className={`w-7 h-7 rounded-md flex items-center justify-center ${cfg.badgeBg} ${cfg.badgeText} border ${cfg.badgeBorder}`}>
                    <Icon size={14} />
                  </span>
                  <span className="flex-1 text-foreground">{cfg.workspaceLabel}</span>
                  {isActive && <Check size={14} className="text-primary" />}
                  <kbd className="hidden sm:inline-block text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                    ⌘{cfg.shortcutDigit}
                  </kbd>
                </button>
              );
            })}
          </div>
          <div className="border-t border-border px-4 py-2.5 text-[11px] font-sans text-muted-foreground truncate">
            {user?.email}
          </div>
        </div>
      )}
    </div>
  );
};

export default RoleSwitcher;
