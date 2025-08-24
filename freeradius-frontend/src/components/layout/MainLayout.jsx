// freeradius-frontend/src/components/layout/MainLayout.jsx
import { useState, useEffect, useCallback } from "react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import useAuthStore from "@/store/authStore";
import { Button } from "@/components/ui/button";
import { 
    LogOut, LayoutDashboard, Server, Building, Users, Settings, 
    Wifi, History, Menu, User as UserIcon, UserCog, ListChecks, Palette,
    Ticket, PlusSquare, History as HistoryIcon, SlidersHorizontal,
    Megaphone,ShieldCheck
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useIdleTimeout } from "@/hooks/useIdleTimeout";
import Footer from "./Footer";
import axiosInstance from '@/api/axiosInstance';
import { useTranslation } from 'react-i18next';

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
    const isSuperAdmin = user?.role === 'superadmin';
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [appName, setAppName] = useState('Freeradius UI');
    
    const { t, i18n } = useTranslation();

    useEffect(() => {
        axiosInstance.get('/settings')
            .then(response => {
                const fetchedAppName = response.data.data.appName;
                if (fetchedAppName) {
                    setAppName(fetchedAppName);
                    document.title = fetchedAppName;
                }
            })
            .catch(() => console.warn("Could not load app name setting."));
    }, []);

    const handleIdle = useCallback(() => {
        toast.warning("Logged out due to inactivity", {
            description: "You have been automatically logged out for security purposes.",
        });
        logout();
        navigate('/login', { replace: true });
    }, [navigate, logout]);

    useIdleTimeout(handleIdle, 600000);

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
                <div className="p-4 border-b flex items-center gap-3 h-[65px] overflow-hidden">
                    <img 
                        src="/uploads/nt-head-logo.png" 
                        alt="Logo" 
                        className="h-9 w-9 object-contain flex-shrink-0"
                    />
                    <h1 className={cn(
                        "text-lg font-bold text-slate-800 transition-opacity truncate",
                        (isSidebarCollapsed && !isMobileMenuOpen) && "opacity-0 hidden"
                    )}>
                        NTIdentity Center
                    </h1>
                </div>
                <nav className="p-3 space-y-1.5 h-[calc(100vh-65px)] overflow-y-auto">
                    <NavItem to="/dashboard" icon={<LayoutDashboard size={18} />} text={t('nav.dashboard')} isCollapsed={isSidebarCollapsed} onClick={navLinkClickHandler} />
                    <NavItem to="/online-users" icon={<Wifi size={18} />} text={t('nav.online_users')} isCollapsed={isSidebarCollapsed} onClick={navLinkClickHandler} />
                    <NavItem to="/history" icon={<History size={18} />} text={t('nav.history')} isCollapsed={isSidebarCollapsed} onClick={navLinkClickHandler} />
                    
                    <div className="pt-2">
                        <p className="px-3 mt-4 mb-2 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                           {t('nav.section_users')}
                        </p>
                        <div className="space-y-1">
                            <NavItem to="/organizations" icon={<Building size={18} />} text={t('nav.organizations')} isCollapsed={isSidebarCollapsed} onClick={navLinkClickHandler} />
                            <NavItem to="/users" icon={<Users size={18} />} text={t('nav.all_users')} isCollapsed={isSidebarCollapsed} onClick={navLinkClickHandler} />
                            <NavItem to="/vouchers/packages" icon={<Ticket size={18} />} text={t('nav.voucher_packages')} isCollapsed={isSidebarCollapsed} onClick={navLinkClickHandler} />
                            <NavItem to="/vouchers/batches" icon={<HistoryIcon size={18} />} text={t('nav.voucher_batches')} isCollapsed={isSidebarCollapsed} onClick={navLinkClickHandler} />
                        </div>
                    </div>
                    
                    <div className="pt-2">
                        <p className="px-3 mt-4 mb-2 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                           {t('nav.section_config')}
                        </p>
                         <div className="space-y-1">
                            <NavItem to="/radius-profiles" icon={<Settings size={18} />} text={t('nav.radius_profiles')} isCollapsed={isSidebarCollapsed} onClick={navLinkClickHandler} />
                            <NavItem to="/nas" icon={<Server size={18} />} text={t('nav.nas')} isCollapsed={isSidebarCollapsed} onClick={navLinkClickHandler} />
                            <NavItem to="/advertisements" icon={<Megaphone size={18} />} text={t('nav.advertisements')} isCollapsed={isSidebarCollapsed} onClick={navLinkClickHandler} />
                            <NavItem to="/customization" icon={<Palette size={18} />} text={t('nav.customization')} isCollapsed={isSidebarCollapsed} onClick={navLinkClickHandler} />
                         </div>
                    </div>

                    <div className="pt-2">
                        <p className="px-3 mt-4 mb-2 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                            {t('nav.section_system')}
                        </p>
                        <div className="space-y-1">
                            {isSuperAdmin && (
                                <>
                                    <NavItem to="/admins" icon={<UserCog size={18} />} text={t('nav.admins')} isCollapsed={isSidebarCollapsed} onClick={navLinkClickHandler} />
                                    <NavItem to="/attribute-management" icon={<ListChecks size={18} />} text={t('nav.attributes')} isCollapsed={isSidebarCollapsed} onClick={navLinkClickHandler} />
                                </>
                            )}
                            <NavItem to="/settings" icon={<SlidersHorizontal size={18} />} text={t('nav.system_settings')} isCollapsed={isSidebarCollapsed} onClick={navLinkClickHandler} />
                            {isSuperAdmin && (
                                <NavItem to="/log-management" icon={<ShieldCheck size={18} />} text={t('nav.log_management')} isCollapsed={isSidebarCollapsed} onClick={navLinkClickHandler} />
                            )}
                        </div>
                    </div>
                </nav>
            </aside>

            <div className="flex-1 flex flex-col h-screen overflow-hidden">
                <header className="bg-white/80 backdrop-blur-sm sticky top-0 z-10 border-b flex justify-between items-center px-4 h-[65px] flex-shrink-0">
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" className="hidden md:flex" onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}>
                            <Menu className="h-6 w-6" />
                        </Button>
                        <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsMobileMenuOpen(true)}>
                            <Menu className="h-6 w-6" />
                        </Button>
                        <h2 className="font-semibold text-slate-700 hidden sm:block">
                            {appName}
                        </h2>
                    </div>
                    <div className="flex items-center gap-4">
                        
                        <div className="flex items-center gap-1">
                            <Button
                                variant="ghost"
                                size="sm"
                                disabled={i18n.language === 'th'}
                                onClick={() => i18n.changeLanguage('th')}
                                className="disabled:opacity-100 disabled:font-semibold disabled:text-primary"
                            >
                                ภาษาไทย
                            </Button>
                            <Separator orientation="vertical" className="h-4" />
                            <Button
                                variant="ghost"
                                size="sm"
                                disabled={i18n.language === 'en'}
                                onClick={() => i18n.changeLanguage('en')}
                                className="disabled:opacity-100 disabled:font-semibold disabled:text-primary"
                            >
                                English
                            </Button>
                        </div>

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
                                <DropdownMenuItem onClick={() => navigate('/account-settings')}>
                                    <UserIcon className="mr-2 h-4 w-4" />
                                    <span>{t('account_settings')}</span>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={handleLogout} className="text-red-500 focus:text-red-500">
                                    <LogOut className="mr-2 h-4 w-4" />
                                    <span>{t('logout')}</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
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
                <Footer appName={appName} />
            </div>
        </div>
    );
}