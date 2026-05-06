import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import HdiLogo from "./HdiLogo";
import RoleSwitcher from "./RoleSwitcher";
import RoleAccentBar from "./RoleAccentBar";
import { getSwitchableRoles } from "@/lib/roleConfig";
import {
  LayoutDashboard, FolderOpen, Users, Palette, Package,
  CreditCard, GraduationCap, Settings, LogOut, Menu, X, CalendarCheck, UserCog, Sparkles, Building2, MessageSquare,
} from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const navItems = [
  { label: "Overview", href: "/admin", icon: LayoutDashboard },
  { label: "All Cases", href: "/admin/cases", icon: FolderOpen },
  { label: "Align Requests", href: "/admin/align-requests", icon: Sparkles },
  { label: "OS Enquiries", href: "/admin/os-enquiries", icon: Building2 },
  { label: "Consultations", href: "/admin/consultations", icon: CalendarCheck },
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "Designers", href: "/admin/designers", icon: Palette },
  { label: "Services & Pricing", href: "/admin/services", icon: Package },
  { label: "Payments", href: "/admin/payments", icon: CreditCard },
  { label: "Feedback", href: "/admin/feedback", icon: MessageSquare, badgeKey: "feedback" as const },
  { label: "Education", href: "#", icon: GraduationCap, disabled: true },
  { label: "Settings", href: "/admin/settings", icon: Settings },
];

const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  const { signOut, roles } = useAuth();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [newFeedbackCount, setNewFeedbackCount] = useState<number>(0);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const { count } = await supabase
        .from("feedback")
        .select("id", { count: "exact", head: true })
        .eq("status", "new");
      if (active) setNewFeedbackCount(count || 0);
    };
    load();
    const channel = supabase
      .channel("admin-feedback-badge")
      .on("postgres_changes", { event: "*", schema: "public", table: "feedback" }, () => load())
      .subscribe();
    return () => { active = false; supabase.removeChannel(channel); };
  }, []);

  const isActive = (href: string) => location.pathname === href;

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-hdi-border/10 flex items-center gap-3">
        <Link to="/admin" className="flex items-center gap-3">
          <div className="w-9 h-9 shrink-0"><HdiLogo size={36} /></div>
          {!collapsed && (
            <span style={{ fontFamily: "'Fugaz One', cursive", fontWeight: 400, fontSize: "18px", letterSpacing: "0.08em", color: "#F0F2F5" }}>
              H D I
            </span>
          )}
        </Link>
        <button onClick={() => setCollapsed(!collapsed)} className="ml-auto text-hdi-sky/50 hover:text-hdi-off-white hidden lg:block">
          <Menu size={16} />
        </button>
      </div>

      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => (
          <Link
            key={item.label}
            to={item.disabled ? "#" : item.href}
            onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-sans transition-colors ${
              item.disabled
                ? "text-hdi-sky/30 cursor-not-allowed"
                : isActive(item.href)
                ? "bg-primary/10 text-primary font-medium"
                : "text-hdi-sky/70 hover:text-hdi-off-white hover:bg-white/5"
            }`}
          >
            <item.icon size={18} className="shrink-0" />
            {!collapsed && (
              <span className="flex items-center gap-2">
                {item.label}
                {item.disabled && (
                  <span className="text-[10px] bg-hdi-sky/10 text-hdi-sky/40 px-1.5 py-0.5 rounded font-medium">Soon</span>
                )}
                {item.badgeKey === "feedback" && newFeedbackCount > 0 && (
                  <span className="text-[10px] bg-red-500 text-white px-1.5 py-0.5 rounded-full font-semibold min-w-[18px] text-center">
                    {newFeedbackCount}
                  </span>
                )}
              </span>
            )}
            {collapsed && item.badgeKey === "feedback" && newFeedbackCount > 0 && (
              <span className="ml-auto text-[9px] bg-red-500 text-white px-1 py-0.5 rounded-full font-semibold">
                {newFeedbackCount}
              </span>
            )}
          </Link>
        ))}
      </nav>

      <div className="p-3 border-t border-hdi-border/10">
        <button
          onClick={signOut}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-sans text-hdi-sky/70 hover:text-hdi-off-white hover:bg-white/5 w-full transition-colors"
        >
          <LogOut size={18} />
          {!collapsed && "Sign out"}
        </button>
      </div>
    </div>
  );

  const showHeader = getSwitchableRoles(roles).length >= 2;

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: "#F5F8FC" }}>
      <RoleAccentBar />
      {/* Desktop sidebar */}
      <aside
        className={`hidden lg:flex flex-col shrink-0 border-r border-hdi-border/10 transition-all duration-200 ${
          collapsed ? "w-16" : "w-60"
        }`}
        style={{ backgroundColor: "#07111D" }}
      >
        <SidebarContent />
      </aside>

      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 h-14 border-b border-hdi-border/10 flex items-center px-4 gap-3" style={{ backgroundColor: "#07111D" }}>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="text-hdi-off-white">
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
        <Link to="/admin" className="flex items-center gap-2">
          <div className="w-8 h-8"><HdiLogo size={32} /></div>
          <span style={{ fontFamily: "'Fugaz One', cursive", fontSize: "16px", letterSpacing: "0.08em", color: "#F0F2F5" }}>H D I</span>
        </Link>
        <div className="ml-auto"><RoleSwitcher /></div>
      </div>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <>
          <div className="lg:hidden fixed inset-0 bg-black/60 z-40" onClick={() => setMobileOpen(false)} />
          <aside className="lg:hidden fixed top-14 left-0 bottom-0 w-60 z-50 border-r border-hdi-border/10" style={{ backgroundColor: "#07111D" }}>
            <SidebarContent />
          </aside>
        </>
      )}

      {/* Main content */}
      <main className="flex-1 min-w-0 lg:pt-0 pt-14">
        {showHeader && (
          <div className="hidden lg:flex items-center justify-end gap-3 px-8 pt-4">
            <RoleSwitcher />
          </div>
        )}
        <div className="p-6 lg:p-8 max-w-7xl">{children}</div>
      </main>
    </div>
  );
};

export default AdminLayout;
