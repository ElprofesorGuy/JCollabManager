import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Layers, Users, ChevronLeft, ChevronRight } from "lucide-react";
import useAuthStore from "../../store/useAuthStore";

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { user } = useAuthStore();
  const location = useLocation();

  const isActive = (path) =>
    location.pathname === path || location.pathname.startsWith(path + "/");

  const navItems = [
    { to: "/dashboard", Icon: LayoutDashboard, label: "Tableau de bord" },
    { to: "/projects", Icon: Layers, label: "Projets" },
    ...(user?.role === "ADMIN" ? [{ to: "/users", Icon: Users, label: "Utilisateurs" }] : []),
  ];

  return (
    <aside
      className={
        "relative flex flex-col shrink-0 bg-[#121824]/70 backdrop-blur-lg border-r border-[#1f293d] transition-all duration-300 ease-in-out min-h-full " +
        (collapsed ? "w-[64px]" : "w-[220px]")
      }
    >
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="absolute -right-3 top-6 z-10 flex items-center justify-center w-6 h-6 rounded-full bg-[#1f293d] border border-[#2d3f5e] text-slate-400 hover:text-white hover:bg-slate-700 transition-all shadow-md"
        title={collapsed ? "Developper" : "Reduire"}
      >
        {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>

      <nav className="flex flex-col gap-1 p-3 pt-4">
        {navItems.map(({ to, Icon, label }) => {
          const active = isActive(to);
          return (
            <Link
              key={to}
              to={to}
              title={collapsed ? label : undefined}
              className={
                "flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold text-sm transition-all duration-150 group " +
                (active
                  ? "bg-primary-600/20 text-primary-400 border border-primary-500/30 shadow-[0_0_12px_rgba(139,92,246,0.15)]"
                  : "text-slate-400 hover:text-white hover:bg-[#1f293d]/60 border border-transparent")
              }
            >
              <span className={active ? "text-primary-400" : "text-slate-500 group-hover:text-slate-300"}>
                <Icon className="w-5 h-5 shrink-0" />
              </span>
              {!collapsed && <span className="truncate">{label}</span>}
              {active && !collapsed && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-400 shrink-0" />}
            </Link>
          );
        })}
      </nav>

      {!collapsed && (
        <div className="mt-auto p-3 border-t border-[#1f293d]">
          <div className="flex items-center gap-2.5 px-2 py-2">
            <div className="w-7 h-7 rounded-full bg-primary-600/20 border border-primary-500/30 flex items-center justify-center shrink-0">
              <span className="text-primary-400 text-xs font-bold">{(user?.username || "U")[0].toUpperCase()}</span>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-300 truncate">{user?.username || "Utilisateur"}</p>
              <p className="text-[10px] text-slate-500 truncate">{user?.role || ""}</p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
