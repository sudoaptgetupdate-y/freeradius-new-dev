// src/components/layout/MainLayout.jsx
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import useAuthStore from "@/store/authStore";
import { Button } from "@/components/ui/button";
import { LogOut, LayoutDashboard, Server, Building, Users, Settings } from "lucide-react"; // <-- เพิ่มไอคอน Settings

// Component สำหรับรายการเมนูแต่ละอัน
const NavItem = ({ to, icon, text }) => (
    <NavLink
        to={to}
        className={({ isActive }) =>
            `flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm transition-colors font-medium
            ${isActive
                ? "bg-primary text-primary-foreground"
                : "text-slate-600 hover:bg-slate-200 hover:text-slate-900"
            }`
        }
    >
        {icon}
        <span>{text}</span>
    </NavLink>
);

export default function MainLayout() {
    const navigate = useNavigate();
    const { user, logout } = useAuthStore();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="flex min-h-screen bg-slate-50">
            {/* --- Sidebar --- */}
            <aside className="w-64 bg-white border-r flex-shrink-0">
                <div className="p-4 border-b flex items-center gap-3 h-[65px]">
                    <div className="bg-primary p-2 rounded-lg">
                        <Server className="text-primary-foreground" size={24} />
                    </div>
                    <h1 className="text-lg font-bold text-slate-800">
                        Freeradius UI
                    </h1>
                </div>
                <nav className="p-3 space-y-1.5">
                    <NavItem to="/dashboard" icon={<LayoutDashboard size={18} />} text="Dashboard" />
                    <NavItem to="/organizations" icon={<Building size={18} />} text="Organizations" />
                    <NavItem to="/users" icon={<Users size={18} />} text="Users" />
                    <NavItem to="/profiles" icon={<Settings size={18} />} text="Profiles" /> {/* <-- เพิ่มเมนู Profiles */}
                    <NavItem to="/nas" icon={<Server size={18} />} text="NAS" />
                </nav>
            </aside>

            <div className="flex-1 flex flex-col max-h-screen">
                {/* --- Header --- */}
                <header className="bg-white/80 backdrop-blur-sm sticky top-0 z-10 border-b flex justify-end items-center px-4 h-[65px]">
                    <div className="flex items-center gap-4">
                        <span className="font-medium">{user?.username}</span>
                        <Button variant="outline" size="sm" onClick={handleLogout}>
                            <LogOut className="mr-2 h-4 w-4" />
                            Log Out
                        </Button>
                    </div>
                </header>

                {/* --- Main Content --- */}
                <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">
                    <Outlet /> {/* <-- หน้าเว็บต่างๆ จะถูกแสดงผลตรงนี้ */}
                </main>
            </div>
        </div>
    );
}