import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { 
    Calendar, Clock, XCircle, CheckCircle, Gem, User, LogOut, ArrowRight, Tag, Heart, 
    LayoutDashboard, Star, Menu, X, RotateCw, ShoppingCart, ChevronLeft, ChevronRight
} from 'lucide-react';

// --- TIPOS E CONFIGURAÇÕES ---
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

type AppointmentStatus = 'CONFIRMED' | 'COMPLETED' | 'CANCELED';
type ActiveTab = 'dashboard' | 'favorites' | 'appointments';

interface Appointment {
    id: number;
    appointmentDate: string;
    status: AppointmentStatus;
    post: {
        id: number;
        title: string;
        image: string;
    };
}

// Interface para os horários de início e fim
interface TimeSlot {
    start: string;
    end: string;
}

// Interface para a disponibilidade semanal
interface Availability {
    monday: TimeSlot[];
    tuesday: TimeSlot[];
    wednesday: TimeSlot[];
    thursday: TimeSlot[];
    friday: TimeSlot[];
    saturday: TimeSlot[];
    sunday: TimeSlot[];
}

interface FavoritePost {
    id: number;
    title: string;
    image: string;
    price: number;
    category: {
        name:string;
    };
    availability: Availability | null;
}

interface CurrentUser {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
}

// --- COMPONENTE PRINCIPAL ---
export default function ClientDashboardPage() {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [favoritePosts, setFavoritePosts] = useState<FavoritePost[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
    const [schedulingPost, setSchedulingPost] = useState<FavoritePost | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchInitialData = async () => {
            setLoading(true);
            try {
                const userRes = await fetch(`${API_BASE_URL}/auth/me`, { credentials: 'include' });
                if (!userRes.ok) {
                    setCurrentUser(null);
                    throw new Error("Utilizador não autenticado.");
                }
                const userData = await userRes.json();
                setCurrentUser(userData);

                const [appointmentsRes, favoritesRes] = await Promise.all([
                    fetch(`${API_BASE_URL}/user/appointments`, { credentials: 'include' }),
                    fetch(`${API_BASE_URL}/user/saved-posts`, { credentials: 'include' })
                ]);

                const appointmentsData = await appointmentsRes.json();
                const favoritesData = await favoritesRes.json();

                setAppointments(Array.isArray(appointmentsData) ? appointmentsData : []);
                setFavoritePosts(Array.isArray(favoritesData) ? favoritesData : []);

            } catch (err: any) {
                console.error(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchInitialData();
    }, []);

    const handleLogout = async () => {
        await fetch(`${API_BASE_URL}/auth/logout`, { method: 'POST', credentials: 'include' });
        setCurrentUser(null);
        navigate('/');
    };
    
    if (loading) {
        return <SkeletonDashboard />;
    }

    if (!currentUser) {
        return <LoggedOutView />;
    }

    return (
        <div className="min-h-screen bg-gray-50 flex">
            <Sidebar 
                user={currentUser} 
                onLogout={handleLogout} 
                isOpen={sidebarOpen} 
                setOpen={setSidebarOpen}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
            />
            <div className="flex-1 flex flex-col h-screen">
                <Header user={currentUser} onLogout={handleLogout} onMenuClick={() => setSidebarOpen(true)} />
                <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
                    <DashboardContent 
                        appointments={appointments}
                        favoritePosts={favoritePosts}
                        setAppointments={setAppointments}
                        setFavoritePosts={setFavoritePosts}
                        activeTab={activeTab}
                        onSchedule={setSchedulingPost}
                    />
                </main>
            </div>
            {schedulingPost && (
                <ScheduleModal
                    post={schedulingPost}
                    existingAppointments={appointments}
                    onClose={() => setSchedulingPost(null)}
                    onSuccess={(newAppointmentData) => {
                        // Recria o objeto appointment com os dados do post para evitar erros
                        const newAppointmentObject = {
                            ...newAppointmentData,
                            post: {
                                id: schedulingPost.id,
                                title: schedulingPost.title,
                                image: schedulingPost.image,
                            }
                        };
                        setAppointments(prev => [...prev, newAppointmentObject]);
                        setSchedulingPost(null);
                    }}
                />
            )}
        </div>
    );
}

// --- COMPONENTES DE LAYOUT ---

const Sidebar: React.FC<{ user: CurrentUser, onLogout: () => void, isOpen: boolean, setOpen: (open: boolean) => void, activeTab: ActiveTab, setActiveTab: (tab: ActiveTab) => void }> = ({ user, onLogout, isOpen, setOpen, activeTab, setActiveTab }) => {
    const navigate = useNavigate();
    
    const handleNavigation = (tab: ActiveTab) => {
        setActiveTab(tab);
        setOpen(false);
    };

    const handleGoHome = () => {
        setOpen(false);
        navigate('/');
    };

    return (
        <>
            <div 
                className={`fixed inset-0 bg-black/60 z-30 lg:hidden transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={() => setOpen(false)}
            ></div>

            <aside className={`fixed lg:relative top-0 left-0 h-full w-64 bg-white border-r border-gray-200 flex flex-col z-40 transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
                <div className="flex items-center gap-3 p-4 h-16 border-b border-gray-200">
                    <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center">
                        <Gem className="text-white w-5 h-5" />
                    </div>
                    <span className="font-bold text-xl text-gray-800">Sua Marca</span>
                </div>
                <nav className="flex-1 px-2 py-4 space-y-1">
                    <NavItem icon={LayoutDashboard} label="Minha Conta" onClick={() => handleNavigation('dashboard')} isActive={activeTab === 'dashboard'} />
                    <NavItem icon={Star} label="Favoritos" onClick={() => handleNavigation('favorites')} isActive={activeTab === 'favorites'} />
                    <NavItem icon={Calendar} label="Agendamentos" onClick={() => handleNavigation('appointments')} isActive={activeTab === 'appointments'} />
                    <div className="pt-2 mt-2 border-t border-gray-200 mx-2"></div>
                    <NavItem icon={ArrowRight} label="Voltar à Loja" onClick={handleGoHome} />
                </nav>
                <div className="p-4 border-t border-gray-200">
                     <button onClick={onLogout} className="w-full text-left flex items-center gap-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg font-semibold">
                        <LogOut size={16} /> Sair da Conta
                    </button>
                </div>
            </aside>
        </>
    );
};

const Header: React.FC<{ user: CurrentUser, onLogout: () => void, onMenuClick: () => void }> = ({ user, onLogout, onMenuClick }) => {
    return (
        <header className="bg-white/80 backdrop-blur-lg sticky top-0 z-20 border-b border-gray-200">
            <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
                <button onClick={onMenuClick} className="lg:hidden p-2 -ml-2 text-gray-600">
                    <Menu size={24} />
                </button>
                <div className="flex-1"></div>
                <div className="flex items-center gap-4">
                    <UserProfile user={user} onLogout={onLogout} />
                </div>
            </div>
        </header>
    );
};

const UserProfile: React.FC<{ user: CurrentUser; onLogout: () => void }> = ({ user, onLogout }) => {
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) setIsOpen(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={ref}>
            <button onClick={() => setIsOpen(!isOpen)} className="flex items-center gap-2">
                <img src={user.image || `https://ui-avatars.com/api/?name=${user.name || 'U'}&background=random`} alt="Avatar" className="w-9 h-9 rounded-full object-cover" />
                <span className="hidden sm:inline font-semibold text-sm text-gray-700">{user.name}</span>
            </button>
            {isOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg z-50 border border-gray-200 overflow-hidden">
                    <div className="p-4 border-b border-gray-200">
                        <p className="font-semibold text-gray-800 truncate">{user.name}</p>
                        <p className="text-sm text-gray-500 truncate">{user.email}</p>
                    </div>
                    <div className="p-2">
                        <button onClick={() => navigate('/')} className="w-full text-left flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg">
                            <ArrowRight size={16} /> Voltar à Loja
                        </button>
                        <button onClick={onLogout} className="w-full text-left flex items-center gap-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg">
                            <LogOut size={16} /> Sair
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

const NavItem: React.FC<{ icon: React.ElementType, label: string, onClick: () => void, isActive?: boolean }> = ({ icon: Icon, label, onClick, isActive }) => (
    <button 
        onClick={onClick} 
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
            isActive 
            ? 'bg-blue-50 text-blue-600' 
            : 'text-gray-600 hover:bg-gray-100'
        }`}
    >
        <Icon size={20} />
        <span>{label}</span>
    </button>
);


// --- CONTEÚDO DO DASHBOARD ---

const DashboardContent: React.FC<{ 
    appointments: Appointment[], 
    favoritePosts: FavoritePost[], 
    setAppointments: React.Dispatch<React.SetStateAction<Appointment[]>>, 
    setFavoritePosts: React.Dispatch<React.SetStateAction<FavoritePost[]>>,
    activeTab: ActiveTab,
    onSchedule: (post: FavoritePost) => void
}> = ({ appointments, favoritePosts, setAppointments, setFavoritePosts, activeTab, onSchedule }) => {
    
    const { upcomingAppointments, pastAppointments } = useMemo(() => {
        const now = new Date();
        const upcomingList = appointments.filter(app => new Date(app.appointmentDate) >= now && app.status === 'CONFIRMED').sort((a, b) => new Date(a.appointmentDate).getTime() - new Date(b.appointmentDate).getTime());
        const pastList = appointments.filter(app => new Date(app.appointmentDate) < now || app.status !== 'CONFIRMED').sort((a, b) => new Date(b.appointmentDate).getTime() - new Date(a.appointmentDate).getTime());
        return { upcomingAppointments: upcomingList, pastAppointments: pastList };
    }, [appointments]);
    
    const handleCancel = async (appointmentId: number) => {
        const result = await Swal.fire({
            title: 'Tem a certeza?',
            text: "Deseja mesmo cancelar este agendamento?",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonText: 'Não',
            confirmButtonText: 'Sim, cancelar',
        });

        if (result.isConfirmed) {
            try {
                const res = await fetch(`${API_BASE_URL}/user/appointments/${appointmentId}/cancel`, {
                    method: 'PATCH',
                    credentials: 'include',
                });
                if (!res.ok) throw new Error('Falha ao comunicar com o servidor.');
                setAppointments(prev => prev.map(app => 
                    app.id === appointmentId ? { ...app, status: 'CANCELED' } : app
                ));
                Swal.fire('Cancelado!', 'O seu agendamento foi cancelado.', 'success');
            } catch (error) {
                console.error("Erro ao cancelar agendamento:", error);
                Swal.fire('Erro!', 'Não foi possível cancelar o agendamento. Tente novamente.', 'error');
            }
        }
    };

    const handleRebook = (appointment: Appointment) => {
        const postToRebook = favoritePosts.find(p => p.id === appointment.post.id);
        if (postToRebook) {
            onSchedule(postToRebook);
        } else {
            Swal.fire('Erro', 'Não foi possível encontrar os detalhes deste serviço para reagendar.', 'error');
        }
    };

    const handleRemoveFavorite = async (postId: number) => {
        const result = await Swal.fire({
            title: 'Remover Favorito?',
            text: "Tem a certeza que quer remover este item dos seus favoritos?",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonText: 'Não',
            confirmButtonText: 'Sim, remover'
        });

        if (result.isConfirmed) {
            try {
                const res = await fetch(`${API_BASE_URL}/user/posts/${postId}/save`, {
                    method: 'POST',
                    credentials: 'include'
                });
                if (!res.ok) throw new Error("Falha ao remover favorito.");
                
                setFavoritePosts(prev => prev.filter(p => p.id !== postId));
                Swal.fire('Removido!', 'O item foi removido dos seus favoritos.', 'success');
            } catch (error: any) {
                Swal.fire('Erro!', error.message, 'error');
            }
        }
    };

    return (
        <div className="space-y-12">
            {(activeTab === 'dashboard' || activeTab === 'favorites') && (
                <section>
                    <h2 className="text-2xl font-bold text-gray-800 mb-5 flex items-center gap-3"><Star className="text-yellow-500"/>Meus Favoritos</h2>
                    {favoritePosts.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {favoritePosts.map(post => <FavoritePostCard key={post.id} post={post} onRemove={handleRemoveFavorite} onSchedule={onSchedule} />)}
                        </div>
                    ) : <EmptyState message="Você ainda não salvou nenhum item como favorito." />}
                </section>
            )}

            {(activeTab === 'dashboard' || activeTab === 'appointments') && (
                <>
                    <section>
                        <h2 className="text-2xl font-bold text-gray-800 mb-5">Próximos Agendamentos</h2>
                        {upcomingAppointments.length > 0 ? (
                            <div className="space-y-4">
                                {upcomingAppointments.map(app => <AppointmentCard key={app.id} appointment={app} onCancel={handleCancel} />)}
                            </div>
                        ) : <EmptyState message="Você não tem agendamentos futuros." />}
                    </section>
                    <section>
                        <h2 className="text-2xl font-bold text-gray-800 mb-5">Histórico de Agendamentos</h2>
                        {pastAppointments.length > 0 ? (
                            <div className="space-y-4">
                                {pastAppointments.map(app => <AppointmentCard key={app.id} appointment={app} onCancel={handleCancel} onRebook={handleRebook} />)}
                            </div>
                        ) : <EmptyState message="O seu histórico de agendamentos está vazio." />}
                    </section>
                </>
            )}
        </div>
    );
};


// --- COMPONENTES DE CARD, MODAL E ESTADO ---

const AppointmentCard: React.FC<{ appointment: Appointment; onCancel?: (id: number) => void; onRebook?: (appointment: Appointment) => void; }> = ({ appointment, onCancel, onRebook }) => {
    const { id, appointmentDate, status, post } = appointment;
    const date = new Date(appointmentDate);
    const formattedDate = date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
    const formattedTime = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    const statusInfo = {
        CONFIRMED: { text: 'Confirmado', icon: Clock, color: 'text-blue-700 bg-blue-100' },
        COMPLETED: { text: 'Concluído', icon: CheckCircle, color: 'text-green-700 bg-green-100' },
        CANCELED: { text: 'Cancelado', icon: XCircle, color: 'text-red-700 bg-red-100' },
    }[status];
    const StatusIcon = statusInfo.icon;

    return (
        <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-200 p-4 flex flex-col sm:flex-row items-center gap-5">
            <img 
                src={`${API_BASE_URL}/${post.image}`} 
                alt={post.title} 
                className="w-full sm:w-28 h-28 object-cover rounded-lg" 
                onError={(e) => { e.currentTarget.src = `https://placehold.co/300x300/e2e8f0/4a5568?text=Img`; }}
            />
            <div className="flex-1 w-full">
                <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-bold text-gray-900">{post.title}</h3>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                        <StatusIcon size={14} /> {statusInfo.text}
                    </span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-2"><Calendar size={16} /><span>{formattedDate}</span></div>
                        <div className="flex items-center gap-2"><Clock size={16} /><span>{formattedTime}</span></div>
                    </div>
                    {status === 'CONFIRMED' && onCancel && (
                        <button onClick={() => onCancel(id)} className="bg-red-50 text-red-600 hover:bg-red-100 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors self-start sm:self-center">
                            Cancelar
                        </button>
                    )}
                    {status === 'CANCELED' && onRebook && (
                        <button onClick={() => onRebook(appointment)} className="bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors self-start sm:self-center flex items-center gap-1.5">
                            <RotateCw size={14} /> Reagendar
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

const FavoritePostCard: React.FC<{ post: FavoritePost; onRemove: (postId: number) => void; onSchedule: (post: FavoritePost) => void; }> = ({ post, onRemove, onSchedule }) => {
    
    const handleRemoveClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onRemove(post.id);
    };

    const handleScheduleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onSchedule(post);
    };

    return (
        <div className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-200 overflow-hidden group">
            <div className="relative">
                <img 
                    src={`${API_BASE_URL}/${post.image}`} 
                    alt={post.title} 
                    className="w-full h-48 object-cover"
                    onError={(e) => { e.currentTarget.src = `https://placehold.co/400x400/e2e8f0/4a5568?text=Img`; }}
                />
                <button onClick={handleRemoveClick} className="absolute top-3 right-3 bg-white/80 backdrop-blur-sm p-1.5 rounded-full shadow-md text-red-500 hover:bg-red-100 transition-colors">
                    <Heart className="w-5 h-5" fill="currentColor" />
                </button>
            </div>
            <div className="p-4 flex flex-col flex-1">
                <span className="text-xs font-semibold uppercase text-blue-600 flex items-center gap-1.5">
                    <Tag size={12}/> {post.category.name}
                </span>
                <h3 className="font-bold text-md mt-1 text-gray-900 truncate flex-1" title={post.title}>{post.title}</h3>
                <p className="text-lg font-semibold text-gray-700 mt-2">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(post.price)}
                </p>
                <button onClick={handleScheduleClick} className="w-full mt-4 bg-blue-600 text-white font-semibold py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
                    <ShoppingCart size={16} /> Agendar
                </button>
            </div>
        </div>
    );
};

const ScheduleModal: React.FC<{ post: FavoritePost; existingAppointments: Appointment[]; onClose: () => void; onSuccess: (appointment: Appointment) => void; }> = ({ post, existingAppointments, onClose, onSuccess }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const modalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [onClose]);

    const daysOfWeek = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
    
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    const startingDay = firstDayOfMonth.getDay();

    const availableDaysOfWeek = useMemo(() => {
        if (!post.availability) return [];
        const dayMap: { [key: string]: number } = { sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6 };
        return Object.entries(post.availability)
            .filter(([_, slots]) => Array.isArray(slots) && slots.length > 0)
            .map(([day]) => dayMap[day as keyof typeof dayMap]);
    }, [post.availability]);

    const handleDateClick = (day: number) => {
        const newSelectedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        if (newSelectedDate < new Date(new Date().toDateString())) return;
        if (!availableDaysOfWeek.includes(newSelectedDate.getDay())) return;
        setSelectedDate(newSelectedDate);
        setSelectedTime(null);
    };
    
    const timeSlots = useMemo(() => {
        if (!selectedDate || !post?.availability) return [];
        const dayKey = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][selectedDate.getDay()] as keyof Availability;
        const slots = (post.availability as any)[dayKey];
        if (!slots) return [];

        const allTimes: string[] = [];
        const now = new Date();
        const isToday = selectedDate.toDateString() === now.toDateString();

        slots.forEach((slot: {start: string, end: string}) => {
            let [startHour, startMinute] = slot.start.split(':').map(Number);
            let [endHour, endMinute] = slot.end.split(':').map(Number);

            let currentTime = new Date(selectedDate);
            currentTime.setHours(startHour, startMinute, 0, 0);

            let endTime = new Date(selectedDate);
            endTime.setHours(endHour, endMinute, 0, 0);

            while (currentTime < endTime) {
                if (!isToday || currentTime > now) {
                    allTimes.push(currentTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
                }
                currentTime.setHours(currentTime.getHours() + 1);
            }
        });
        return allTimes;
    }, [selectedDate, post.availability]);

    const bookedSlots = useMemo(() => {
        if (!selectedDate) return new Set<string>();
        const slots = new Set<string>();
        const formattedSelectedDate = selectedDate.toLocaleDateString('pt-BR');
        
        existingAppointments.forEach(app => {
            if (app.status === 'CONFIRMED') {
                const appDate = new Date(app.appointmentDate);
                const formattedAppDate = appDate.toLocaleDateString('pt-BR');
                if (formattedAppDate === formattedSelectedDate) {
                    const formattedTime = appDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                    slots.add(formattedTime);
                }
            }
        });
        return slots;
    }, [existingAppointments, selectedDate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedDate || !selectedTime) {
            Swal.fire('Atenção', 'Selecione um dia e horário.', 'warning');
            return;
        }
        setIsLoading(true);
        const [hour, minute] = selectedTime.split(':').map(Number);
        const finalBookingDate = new Date(selectedDate);
        finalBookingDate.setHours(hour, minute);

        try {
            const res = await fetch(`${API_BASE_URL}/user/appointments/create`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ postId: post.id, appointmentDate: finalBookingDate.toISOString() }),
            });

            if (res.status === 409) throw new Error("Este horário já não se encontra disponível.");
            if (!res.ok) throw new Error("Não foi possível realizar o agendamento.");

            const newAppointment = await res.json();
            onSuccess(newAppointment);
            Swal.fire('Agendado!', 'O seu horário foi confirmado com sucesso.', 'success');
        } catch (error: any) {
            Swal.fire('Oops!', error.message, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <form 
                ref={modalRef}
                onSubmit={handleSubmit} 
                className="bg-white rounded-2xl shadow-xl w-full max-w-lg flex flex-col max-h-[90vh]" 
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-4 border-b shrink-0 flex justify-between items-center">
                    <h3 className="text-xl font-semibold text-gray-800">Agendar: {post.title}</h3>
                    <button type="button" onClick={onClose} className="p-1 rounded-full hover:bg-gray-100">
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                <div className="p-6 flex-1 overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <button type="button" onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))} className="p-2 rounded-full hover:bg-gray-100"><ChevronLeft size={20} /></button>
                                <h4 className="font-semibold text-center">{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</h4>
                                <button type="button" onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))} className="p-2 rounded-full hover:bg-gray-100"><ChevronRight size={20} /></button>
                            </div>
                            <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-500">
                                {daysOfWeek.map(day => <div key={day} className="font-semibold">{day}</div>)}
                            </div>
                            <div className="grid grid-cols-7 gap-1 mt-2">
                                {Array.from({ length: startingDay }).map((_, i) => <div key={`empty-${i}`}></div>)}
                                {Array.from({ length: daysInMonth }).map((_, day) => {
                                    const dayNumber = day + 1;
                                    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), dayNumber);
                                    const isPast = date < new Date(new Date().toDateString());
                                    const isAvailable = availableDaysOfWeek.includes(date.getDay()) && !isPast;
                                    const isSelected = selectedDate?.toDateString() === date.toDateString();
                                    return (
                                        <button
                                            type="button"
                                            key={dayNumber}
                                            onClick={() => handleDateClick(dayNumber)}
                                            disabled={!isAvailable}
                                            className={`w-10 h-10 rounded-full text-sm transition-colors ${
                                                isSelected ? 'bg-blue-600 text-white' :
                                                isAvailable ? 'hover:bg-blue-100' : 'text-gray-400'
                                            }`}
                                        >{dayNumber}</button>
                                    );
                                })}
                            </div>
                        </div>
                        <div className="md:border-l md:border-gray-200 md:pl-6">
                            <h4 className="font-semibold mb-2">Horários Disponíveis</h4>
                            {selectedDate ? (
                                <div className="space-y-2">
                                    {timeSlots.length > 0 ? timeSlots.map(time => {
                                        const isBooked = bookedSlots.has(time);
                                        return (
                                            <button
                                                type="button"
                                                key={time}
                                                onClick={() => setSelectedTime(time)}
                                                disabled={isBooked}
                                                className={`w-full text-center p-2 rounded-lg border text-sm transition-colors ${
                                                    selectedTime === time ? 'bg-blue-600 text-white border-blue-600' : 
                                                    isBooked ? 'bg-gray-200 text-gray-400 border-gray-200 cursor-not-allowed' :
                                                    'border-gray-300 hover:bg-gray-100'
                                                }`}
                                            >{isBooked ? 'Agendado' : time}</button>
                                        )
                                    }) : <p className="text-sm text-gray-500">Nenhum horário disponível.</p>}
                                </div>
                            ) : <p className="text-sm text-gray-500">Selecione um dia no calendário.</p>}
                        </div>
                    </div>
                </div>

                <div className="p-4 border-t bg-gray-50 shrink-0 flex justify-end gap-3">
                    <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-sm font-semibold">
                        Fechar
                    </button>
                    <button 
                        type="submit" 
                        disabled={isLoading || !selectedTime} 
                        className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold disabled:bg-blue-400 disabled:cursor-not-allowed"
                    >
                        {isLoading ? 'A confirmar...' : 'Confirmar Agendamento'}
                    </button>
                </div>
            </form>
        </div>
    );
};


const EmptyState: React.FC<{ message: string }> = ({ message }) => (
    <div className="bg-white rounded-xl border-2 border-dashed border-gray-200 p-12 text-center text-gray-500">
        <p>{message}</p>
    </div>
);

const LoggedOutView = () => (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center p-12 bg-white rounded-2xl shadow-xl">
            <h2 className="text-2xl font-bold text-gray-800">Sessão Expirada</h2>
            <p className="mt-2 text-gray-500">Por favor, faça login para aceder à sua conta.</p>
            <a href={`${API_BASE_URL}/auth/google`} className="mt-8 inline-flex items-center gap-3 px-6 py-3 rounded-full bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors shadow-lg hover:shadow-blue-500/30">
                <User size={18} /><span>Fazer Login com Google</span>
            </a>
        </div>
    </div>
);

const SkeletonDashboard = () => (
    <div className="min-h-screen bg-gray-50 flex">
        <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-gray-200">
             <div className="h-16 border-b border-gray-200 p-4 flex items-center"><div className="h-8 w-32 bg-gray-200 rounded-md animate-pulse"></div></div>
             <div className="p-2 space-y-2 mt-4">
                <div className="h-10 w-full bg-gray-200 rounded-md animate-pulse"></div>
                <div className="h-10 w-full bg-gray-200 rounded-md animate-pulse"></div>
                <div className="h-10 w-full bg-gray-200 rounded-md animate-pulse"></div>
             </div>
        </aside>
        <div className="flex-1 flex flex-col">
            <header className="h-16 border-b border-gray-200 flex items-center justify-end px-8">
                <div className="h-9 w-32 bg-gray-200 rounded-full animate-pulse"></div>
            </header>
            <main className="flex-1 p-8">
                <div className="h-8 w-64 bg-gray-200 rounded-md animate-pulse mb-8"></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {[...Array(4)].map((_, i) => <div key={i} className="h-72 w-full bg-gray-200 rounded-xl animate-pulse"></div>)}
                </div>
                 <div className="h-8 w-64 bg-gray-200 rounded-md animate-pulse my-8"></div>
                  <div className="space-y-4">
                     {[...Array(2)].map((_, i) => <div key={i} className="h-28 w-full bg-gray-200 rounded-xl animate-pulse"></div>)}
                </div>
            </main>
        </div>
    </div>
);
