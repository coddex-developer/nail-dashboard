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
    Package,
    PackagePlus,
    CalendarClock
} from "lucide-react";

// --- TIPOS ---
interface Notification {
    id: number;
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
}

export default function Navbar() {
    const navigate = useNavigate();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [storeOpen, setStoreOpen] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);

    const storeRef = useRef<HTMLDivElement>(null);
    const settingsRef = useRef<HTMLDivElement>(null);

    // Fecha dropdowns ao clicar fora
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (storeRef.current && !storeRef.current.contains(event.target as Node)) {
                setStoreOpen(false);
            }
            if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
                setSettingsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);
    
    // Mock de notificações
    useEffect(() => {
        // Em uma aplicação real, você faria um fetch para /api/notifications
        const mockData: Notification[] = [
            { id: 1, title: "Novo agendamento", message: "Carlos Silva agendou um corte.", date: new Date().toISOString(), read: false },
            { id: 2, title: "Novo agendamento", message: "Ana Pereira agendou Barba Terapia.", date: new Date().toISOString(), read: false },
            { id: 3, title: "Produto esgotando", message: "O estoque de 'Cera Modeladora' está baixo.", date: new Date().toISOString(), read: true },
        ];
        setNotifications(mockData);
        setUnreadCount(mockData.filter(n => !n.read).length);
    }, []);

    const go = (path: string) => {
        setMobileOpen(false);
        navigate(path);
    };

    const markAllAsRead = async () => {
        // Em um app real, aqui você faria uma chamada PUT/POST para /api/notifications/mark-all-as-read
        // para atualizar o status no banco de dados.
        
        // Atualização otimista na UI
        setUnreadCount(0);
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    };

    const openNotifications = () => {
        // Marca como lido assim que o usuário clica para ver
        if (unreadCount > 0) {
            markAllAsRead();
        }

        const html = notifications.length > 0
            ? notifications.map(n => `
                <div style="padding: 10px; border-bottom: 1px solid #eee; text-align: left; opacity: ${n.read ? 0.6 : 1};">
                    <strong style="display: block; font-size: 15px;">${n.title}</strong>
                    <p style="font-size: 13px; color: #555; margin: 4px 0 0;">${n.message}</p>
                </div>`).join("")
            : '<p style="padding: 20px; text-align: center; color: #666;">Nenhuma notificação encontrada.</p>';

        Swal.fire({
            title: "Notificações",
            html: `<div style="max-height: 400px; overflow-y: auto;">${html}</div>`,
            showConfirmButton: false,
            showCloseButton: true,
        });
    };

    return (
        <nav className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Esquerda: Logo + Menu Desktop */}
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2 cursor-pointer" onClick={() => go("/dashboard")}>
                            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                                <Store size={18} />
                            </div>
                            <span className="font-bold text-lg text-gray-800 hidden sm:block">Meu Painel</span>
                        </div>
                        <div className="hidden md:flex items-center gap-2">
                            <div ref={storeRef} className="relative">
                                <button onClick={() => setStoreOpen(s => !s)} className={`inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium transition ${storeOpen ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-100'}`}>
                                    <Package size={16} /> Loja <ChevronDown size={16} className={`transition-transform ${storeOpen ? 'rotate-180' : ''}`} />
                                </button>
                                {storeOpen && <DropdownMenu items={[
                                    { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
                                    { label: "Ver Produtos", icon: List, path: "/view-itens" },
                                    { label: "Criar Produto", icon: PackagePlus, path: "/create-product" },
                                    { label: "Categorias", icon: Tag, path: "/categories" },
                                    { label: "Gerir Agendamentos", icon: CalendarClock, path: "/appointments" },
                                ]} onNavigate={go} />}
                            </div>
                            <div ref={settingsRef} className="relative">
                                <button onClick={() => setSettingsOpen(s => !s)} className={`inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium transition ${settingsOpen ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-100'}`}>
                                    <Settings size={16} /> Ajustes <ChevronDown size={16} className={`transition-transform ${settingsOpen ? 'rotate-180' : ''}`} />
                                </button>
                                {settingsOpen && <DropdownMenu items={[
                                    { label: "Perfil Admin", icon: User, path: "/admin/settings" },
                                ]} onNavigate={go} />}
                            </div>
                        </div>
                    </div>

                    {/* Direita: Ações */}
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

            {/* Mobile Drawer */}
            <MobileDrawer isOpen={mobileOpen} onClose={() => setMobileOpen(false)} onNavigate={go} />
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

function MobileDrawer({ isOpen, onClose, onNavigate }: MobileDrawerProps) {
    return (
        <div className={`fixed inset-0 z-50 md:hidden transition-all duration-300 ${isOpen ? 'bg-black/40' : 'bg-transparent pointer-events-none'}`} onClick={onClose}>
            <div className={`fixed top-0 right-0 h-full w-4/5 max-w-sm bg-white shadow-xl transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`} onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between p-4 border-b">
                    <span className="font-semibold">Menu</span>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100"><X size={20} /></button>
                </div>
                <div className="p-4 space-y-2">
                    <p className="px-3 text-xs font-semibold text-gray-400 uppercase">Loja</p>
                    <MobileNavItem icon={LayoutDashboard} label="Dashboard" onClick={() => onNavigate("/dashboard")} />
                    <MobileNavItem icon={List} label="Ver Produtos" onClick={() => onNavigate("/view-itens")} />
                    <MobileNavItem icon={PackagePlus} label="Criar Produto" onClick={() => onNavigate("/create-product")} />
                    <MobileNavItem icon={Tag} label="Categorias" onClick={() => onNavigate("/categories")} />
                    <MobileNavItem icon={CalendarClock} label="Agendamentos" onClick={() => onNavigate("/appointments")} />
                    <div className="pt-2 mt-2 border-t">
                        <p className="px-3 text-xs font-semibold text-gray-400 uppercase">Conta</p>
                        <MobileNavItem icon={Settings} label="Ajustes" onClick={() => onNavigate("/admin/settings")} />
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
