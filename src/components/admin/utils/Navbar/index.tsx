import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import {
    Menu,
    X,
    Bell,
    Store,
    Settings,
    List,
    Tag,
    User,
    ChevronDown,
    LayoutDashboard,
    PackagePlus,
    CalendarClock,
    LogOut,
    Users,
    BookOpen
} from "lucide-react";
import { UrlNotifications } from "../../utils/scripts/url";

// --- TIPOS ---
interface Notification {
    id: number;
    type: 'NEW_APPOINTMENT' | 'NEW_USER';
    title: string;
    message: string;
    date: string;
    read: boolean;
}

interface DropdownItem {
    label: string;
    icon: React.ElementType;
    path: string;
}

interface DropdownMenuProps {
    items: DropdownItem[];
    onNavigate: (path: string) => void;
}

interface MobileNavItemProps {
    icon: React.ElementType;
    label: string;
    onClick: () => void;
}

interface MobileDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    onNavigate: (path: string) => void;
    onLogout: () => void;
}

// SVGs dos ícones para usar no SweetAlert
const userIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-user"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`;
const calendarIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-calendar-clock"><path d="M21 7.5V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h3.5"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/><circle cx="18" cy="18" r="4"/><path d="M18 16v2h1"/></svg>`;


export default function Navbar() {
    const navigate = useNavigate();
    const [mobileOpen, setMobileOpen] = useState(false);
    // Estados para os novos menus
    const [catalogOpen, setCatalogOpen] = useState(false);
    const [clientsOpen, setClientsOpen] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);
    
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);

    // Refs para os novos menus
    const catalogRef = useRef<HTMLDivElement>(null);
    const clientsRef = useRef<HTMLDivElement>(null);
    const settingsRef = useRef<HTMLDivElement>(null);

    // Fecha dropdowns ao clicar fora
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (catalogRef.current && !catalogRef.current.contains(event.target as Node)) {
                setCatalogOpen(false);
            }
            if (clientsRef.current && !clientsRef.current.contains(event.target as Node)) {
                setClientsOpen(false);
            }
            if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
                setSettingsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);
    
    const handleLogout = () => {
        localStorage.removeItem('admin_token');
        navigate('/admin');
    };

    // Busca as notificações do backend
    useEffect(() => {
        const fetchNotifications = async () => {
            const token = localStorage.getItem('admin_token');
            if (!token) return;

            try {
                const res = await fetch(UrlNotifications.all, { 
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!res.ok) {
                    if (res.status === 401 || res.status === 403) {
                        handleLogout();
                    }
                    console.error("Falha ao buscar notificações");
                    return;
                }
                const data: Notification[] = await res.json();
                setNotifications(data);
                setUnreadCount(data.filter(n => !n.read).length);
            } catch (error) {
                console.error("Erro de rede ao buscar notificações:", error);
            }
        };

        fetchNotifications();
        const intervalId = setInterval(fetchNotifications, 30000);

        return () => clearInterval(intervalId);
    }, []);

    const go = (path: string) => {
        setMobileOpen(false);
        setCatalogOpen(false);
        setClientsOpen(false);
        setSettingsOpen(false);
        navigate(path);
    };

    const markAllAsRead = async () => {
        const token = localStorage.getItem('admin_token');
        const previouslyUnread = notifications.filter(n => !n.read);
        if (previouslyUnread.length === 0 || !token) return;

        setUnreadCount(0);
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));

        try {
            await fetch(UrlNotifications.markRead, { 
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });
        } catch (error) {
            console.error("Falha ao marcar notificações como lidas:", error);
            setNotifications(prev => prev.map(n => previouslyUnread.find(p => p.id === n.id) ? { ...n, read: false } : n));
            setUnreadCount(previouslyUnread.length);
        }
    };

    const openNotifications = () => {
        if (unreadCount > 0) {
            markAllAsRead();
        }

        const getIconForType = (type: Notification['type']) => {
            return type === 'NEW_USER' ? userIconSvg : calendarIconSvg;
        };

        const html = notifications.length > 0
            ? notifications.map(n => `
                <div style="display: flex; align-items: flex-start; gap: 12px; padding: 12px; border-bottom: 1px solid #eee; text-align: left; opacity: ${n.read ? 0.6 : 1};">
                    <div style="flex-shrink: 0; color: #4B5563;">${getIconForType(n.type)}</div>
                    <div>
                        <strong style="display: block; font-size: 15px; color: #111827;">${n.title}</strong>
                        <p style="font-size: 13px; color: #555; margin: 4px 0 0;">${n.message}</p>
                    </div>
                </div>`).join("")
            : '<p style="padding: 20px; text-align: center; color: #666;">Nenhuma notificação encontrada.</p>';

        Swal.fire({
            title: "Notificações",
            html: `<div style="max-height: 400px; overflow-y: auto; border-top: 1px solid #eee;">${html}</div>`,
            showConfirmButton: false,
            showCloseButton: true,
            width: '450px',
        });
    };

    return (
        <nav className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2 cursor-pointer" onClick={() => go("/admin/dashboard")}>
                            <div className="w-8 h-8 rounded-lg bg-pink-600 text-white flex items-center justify-center">
                                <Store size={18} />
                            </div>
                            <span className="font-bold text-lg text-gray-800 hidden sm:block">Meu Painel</span>
                        </div>
                        <div className="hidden md:flex items-center gap-2">
                            {/* Menu Catálogo */}
                            <div ref={catalogRef} className="relative">
                                <button onClick={() => setCatalogOpen(s => !s)} className={`inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium transition ${catalogOpen ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-100'}`}>
                                    <BookOpen size={16} /> Catálogo <ChevronDown size={16} className={`transition-transform ${catalogOpen ? 'rotate-180' : ''}`} />
                                </button>
                                {catalogOpen && <DropdownMenu items={[
                                    { label: "Ver Produtos", icon: List, path: "/admin/dashboard/produtos" },
                                    { label: "Criar Produto", icon: PackagePlus, path: "/admin/dashboard/produtos/novo" },
                                    { label: "Categorias", icon: Tag, path: "/admin/dashboard/categorias" },
                                ]} onNavigate={go} />}
                            </div>

                            {/* Menu Clientes */}
                            <div ref={clientsRef} className="relative">
                                <button onClick={() => setClientsOpen(s => !s)} className={`inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium transition ${clientsOpen ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-100'}`}>
                                    <Users size={16} /> Clientes <ChevronDown size={16} className={`transition-transform ${clientsOpen ? 'rotate-180' : ''}`} />
                                </button>
                                {clientsOpen && <DropdownMenu items={[
                                    { label: "Lista de Clientes", icon: Users, path: "/admin/dashboard/clientes" },
                                    { label: "Agendamentos", icon: CalendarClock, path: "/admin/dashboard/agendamentos" },
                                ]} onNavigate={go} />}
                            </div>
                            
                            {/* Menu Configurações */}
                            <div ref={settingsRef} className="relative">
                                <button onClick={() => setSettingsOpen(s => !s)} className={`inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium transition ${settingsOpen ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-100'}`}>
                                    <Settings size={16} /> Configurações <ChevronDown size={16} className={`transition-transform ${settingsOpen ? 'rotate-180' : ''}`} />
                                </button>
                                {settingsOpen && <DropdownMenu items={[
                                    { label: "Perfil Admin", icon: User, path: "/admin/dashboard/configuracoes" },
                                ]} onNavigate={go} />}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button onClick={openNotifications} className="relative p-2 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-800">
                            <Bell size={20} />
                            {unreadCount > 0 && (
                                <span className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                                    {unreadCount}
                                </span>
                            )}
                        </button>
                        <div className="w-px h-6 bg-gray-200 mx-2 hidden sm:block"></div>
                        <div className="hidden sm:flex items-center gap-3">
                            <div className="text-right">
                                <p className="text-sm font-semibold text-gray-800">Admin</p>
                                <p className="text-xs text-gray-500">Online</p>
                            </div>
                            <img className="h-10 w-10 rounded-full object-cover" src="https://placehold.co/100x100/E2E8F0/4A5568?text=A" alt="Avatar" />
                        </div>
                        <button onClick={() => setMobileOpen(true)} className="md:hidden p-2 rounded-full text-gray-500 hover:bg-gray-100">
                            <Menu size={22} />
                        </button>
                    </div>
                </div>
            </div>

            <MobileDrawer isOpen={mobileOpen} onClose={() => setMobileOpen(false)} onNavigate={go} onLogout={handleLogout} />
        </nav>
    );
}

// --- COMPONENTES AUXILIARES ---

function DropdownMenu({ items, onNavigate }: DropdownMenuProps) {
    return (
        <div className="absolute left-0 mt-2 w-56 bg-white rounded-xl shadow-lg z-50 border border-gray-100 overflow-hidden">
            <ul className="py-2">
                {items.map(item => (
                    <li key={item.label}>
                        <button onClick={() => onNavigate(item.path)} className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-3">
                            <item.icon size={16} /> {item.label}
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
}

function MobileDrawer({ isOpen, onClose, onNavigate, onLogout }: MobileDrawerProps) {
    return (
        <div className={`fixed inset-0 z-50 md:hidden transition-all duration-300 ${isOpen ? 'bg-black/40' : 'bg-transparent pointer-events-none'}`} onClick={onClose}>
            <div className={`fixed top-0 right-0 h-full w-4/5 max-w-sm bg-white shadow-xl transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`} onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between p-4 border-b">
                    <span className="font-semibold">Menu</span>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100"><X size={20} /></button>
                </div>
                <div className="p-4 space-y-2">
                    <MobileNavItem icon={LayoutDashboard} label="Dashboard" onClick={() => onNavigate("/admin/dashboard")} />
                    <div className="pt-2 mt-2 border-t">
                        <p className="px-3 text-xs font-semibold text-gray-400 uppercase">Catálogo</p>
                        <MobileNavItem icon={List} label="Ver Produtos" onClick={() => onNavigate("/admin/dashboard/produtos")} />
                        <MobileNavItem icon={PackagePlus} label="Criar Produto" onClick={() => onNavigate("/admin/dashboard/produtos/novo")} />
                        <MobileNavItem icon={Tag} label="Categorias" onClick={() => onNavigate("/admin/dashboard/categorias")} />
                    </div>
                     <div className="pt-2 mt-2 border-t">
                        <p className="px-3 text-xs font-semibold text-gray-400 uppercase">Clientes</p>
                        <MobileNavItem icon={Users} label="Lista de Clientes" onClick={() => onNavigate("/admin/dashboard/clientes")} />
                        <MobileNavItem icon={CalendarClock} label="Agendamentos" onClick={() => onNavigate("/admin/dashboard/agendamentos")} />
                    </div>
                    <div className="pt-2 mt-2 border-t">
                        <p className="px-3 text-xs font-semibold text-gray-400 uppercase">Conta</p>
                        <MobileNavItem icon={Settings} label="Configurações" onClick={() => onNavigate("/admin/dashboard/configuracoes")} />
                        <MobileNavItem icon={LogOut} label="Sair" onClick={onLogout} />
                    </div>
                </div>
            </div>
        </div>
    );
}

function MobileNavItem({ icon: Icon, label, onClick }: MobileNavItemProps) {
    return (
        <button onClick={onClick} className="w-full flex items-center gap-4 px-3 py-3 rounded-lg text-gray-700 hover:bg-gray-100 font-medium">
            <Icon size={20} />
            <span>{label}</span>
        </button>
    );
}
