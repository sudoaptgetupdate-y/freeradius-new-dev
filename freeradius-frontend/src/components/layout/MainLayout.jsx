// src/components/layout/MainLayout.jsx
import { useState, useEffect } from "react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import useAuthStore from "@/store/authStore";
import { Button } from "@/components/ui/button";
import { LogOut, LayoutDashboard, Server, Building, Users, Settings, Wifi, History, Menu, User as UserIcon } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const NavItem = ({ to, icon, text, isCollapsed, onClick }) => (
    <NavLink
        to={to}
        onClick={onClick}
        className={({ isActive }) =>
            cn(
                "flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm transition-colors font-medium",
                "text-slate-600 hover:bg-slate-200 hover:text-slate-900",
                isCollapsed && "justify-center",
                isActive && "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground"
            )
        }
    >
        {icon}
        <span className={cn(
            "whitespace-nowrap transition-opacity",
            isCollapsed ? "opacity-0 hidden" : "opacity-100"
        )}>
            {text}
        </span>
    </NavLink>
);

export default function MainLayout() {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, logout } = useAuthStore();
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        if (isMobileMenuOpen) {
            setIsMobileMenuOpen(false);
        }
    }, [location.pathname]);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navLinkClickHandler = () => {
        if (isMobileMenuOpen) {
            setIsMobileMenuOpen(false);
        }
    };

    return (
        <div className="flex h-screen bg-slate-50 overflow-hidden">
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/60 z-20 md:hidden"
                    onClick={() => setIsMobileMenuOpen(false)}
                ></div>
            )}

            <aside className={cn(
                "bg-white border-r flex-shrink-0 transition-all duration-300 ease-in-out",
                "fixed inset-y-0 left-0 z-30 transform md:relative md:translate-x-0",
                isMobileMenuOpen ? "translate-x-0 w-64" : "-translate-x-full",
                isSidebarCollapsed ? "md:w-20" : "md:w-64"
            )}>
                 <div className="p-4 border-b flex items-center gap-3 h-[65px]">
                    <div className="bg-primary p-2 rounded-lg">
                        <Server className="text-primary-foreground" size={24} />
                    </div>
                    <h1 className={cn(
                        "text-lg font-bold text-slate-800 whitespace-nowrap transition-opacity",
                        (isSidebarCollapsed && !isMobileMenuOpen) && "opacity-0 hidden"
                    )}>
                        Freeradius UI
                    </h1>
                </div>
                <nav className="p-3 space-y-1.5 h-[calc(100vh-65px)] overflow-y-auto">
                    <NavItem to="/dashboard" icon={<LayoutDashboard size={18} />} text="Dashboard" isCollapsed={isSidebarCollapsed} onClick={navLinkClickHandler} />
                    <NavItem to="/online-users" icon={<Wifi size={18} />} text="Online Users" isCollapsed={isSidebarCollapsed} onClick={navLinkClickHandler} />
                    <NavItem to="/history" icon={<History size={18} />} text="History" isCollapsed={isSidebarCollapsed} onClick={navLinkClickHandler} />
                    <NavItem to="/organizations" icon={<Building size={18} />} text="Organizations" isCollapsed={isSidebarCollapsed} onClick={navLinkClickHandler} />
                    <NavItem to="/users" icon={<Users size={18} />} text="Users" isCollapsed={isSidebarCollapsed} onClick={navLinkClickHandler} />
                    <NavItem to="/profiles" icon={<Settings size={18} />} text="Profiles" isCollapsed={isSidebarCollapsed} onClick={navLinkClickHandler} />
                    <NavItem to="/nas" icon={<Server size={18} />} text="NAS" isCollapsed={isSidebarCollapsed} onClick={navLinkClickHandler} />
                </nav>
            </aside>

            <div className="flex-1 flex flex-col h-screen overflow-hidden">
                <header className="bg-white/80 backdrop-blur-sm sticky top-0 z-10 border-b flex justify-between items-center px-4 h-[65px] flex-shrink-0">
                    <div className="flex items-center">
                        <Button variant="ghost" size="icon" className="hidden md:flex" onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}>
                            <Menu className="h-6 w-6" />
                        </Button>
                        <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsMobileMenuOpen(true)}>
                            <Menu className="h-6 w-6" />
                        </Button>
                    </div>
                    {/* --- START: แก้ไขส่วนนี้ --- */}
                    <div className="flex items-center gap-4">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="flex items-center gap-2 h-10 px-3">
                                    <UserIcon className="h-5 w-5 text-muted-foreground" />
                                    <span className="hidden sm:inline-block font-medium">{user?.fullName || user?.username}</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-56" align="end" forceMount>
                                <DropdownMenuLabel className="font-normal">
                                    <div className="flex flex-col space-y-1">
                                        <p className="text-sm font-medium leading-none">{user?.fullName || user?.username}</p>
                                        <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                {/* You can add a link to a profile page here in the future */}
                                {/* <DropdownMenuItem onClick={() => navigate('/profile')}>
                                    <UserIcon className="mr-2 h-4 w-4" />
                                    <span>Profile</span>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator /> */}
                                <DropdownMenuItem onClick={handleLogout} className="text-red-500 focus:text-red-500">
                                    <LogOut className="mr-2 h-4 w-4" />
                                    <span>Log Out</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                    {/* --- END: สิ้นสุดส่วนที่แก้ไข --- */}
                </header>

                <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
                     <AnimatePresence mode="wait">
                        <motion.div
                            key={location.pathname}
                            className="h-full"
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 15 }}
                            transition={{ duration: 0.25, ease: "easeInOut" }}
                        >
                            <Outlet />
                        </motion.div>
                    </AnimatePresence>
                </main>
            </div>
        </div>
    );
}