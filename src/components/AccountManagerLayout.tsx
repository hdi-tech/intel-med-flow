import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import HdiLogo from "./HdiLogo";
import RoleSwitcher from "./RoleSwitcher";
import RoleAccentBar from "./RoleAccentBar";
import { getSwitchableRoles } from "@/lib/roleConfig";
import {
  LayoutDashboard, FolderOpen, Users, CreditCard, LogOut, Menu, X,
  MessageSquare, CalendarCheck,
} from "lucide-react";
import { useState } from "react";

const navItems = [
  { label: "Overview", href: "/account-manager", icon: LayoutDashboard },
  { label: "My Clients", href: "/account-manager/clients", icon: Users },
  { label: "Cases", href: "/account-manager/cases", icon: FolderOpen },
  { label: "Consultations", href: "/account-manager/consultations", icon: CalendarCheck },
  { label: "Payments", href: "/account-manager/payments", icon: CreditCard },
];

const AccountManagerLayout = ({ children }: { children: React.ReactNode }) => {
  const { signOut, roles } = useAuth();
  const showHeader = getSwitchableRoles(roles).length >= 2;
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) => location.pathname === href;

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-hdi-border/10 flex items-center gap-3">
        <Link to="/account-manager" className="flex items-center gap-3">
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
            to={item.href}
            onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-sans transition-colors ${
              isActive(item.href)
                ? "bg-primary/10 text-primary font-medium"
                : "text-hdi-sky/70 hover:text-hdi-off-white hover:bg-white/5"
            }`}
          >
            <item.icon size={18} className="shrink-0" />
            {!collapsed && item.label}
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

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: "#F5F8FC" }}>
      <RoleAccentBar />
      <aside
        className={`hidden lg:flex flex-col shrink-0 border-r border-hdi-border/10 transition-all duration-200 ${
          collapsed ? "w-16" : "w-60"
        }`}
        style={{ backgroundColor: "#07111D" }}
      >
        <SidebarContent />
      </aside>

      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 h-14 border-b border-hdi-border/10 flex items-center px-4 gap-3" style={{ backgroundColor: "#07111D" }}>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="text-hdi-off-white">
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
        <Link to="/account-manager" className="flex items-center gap-2">
          <div className="w-8 h-8"><HdiLogo size={32} /></div>
          <span style={{ fontFamily: "'Fugaz One', cursive", fontSize: "16px", letterSpacing: "0.08em", color: "#F0F2F5" }}>H D I</span>
        </Link>
        <div className="ml-auto"><RoleSwitcher /></div>
      </div>

      {mobileOpen && (
        <>
          <div className="lg:hidden fixed inset-0 bg-black/60 z-40" onClick={() => setMobileOpen(false)} />
          <aside className="lg:hidden fixed top-14 left-0 bottom-0 w-60 z-50 border-r border-hdi-border/10" style={{ backgroundColor: "#07111D" }}>
            <SidebarContent />
          </aside>
        </>
      )}

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

export default AccountManagerLayout;
