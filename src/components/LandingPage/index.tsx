import React, { useState, useEffect, useMemo, useRef, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { Gem, User, Menu, X, Sun, Moon, Search, List, Instagram, Facebook, Twitter, LogOut, ChevronLeft, ChevronRight, Heart, Calendar } from 'lucide-react';
import { UrlProducts, UrlCategories, UrlUser, API_BASE_URL } from '../admin/utils/scripts/url/index';

// --- TIPOS E INTERFACES ---
interface Category {
    id: number;
    name: string;
}
interface TimeSlot {
    start: string;
    end: string;
}
interface Availability {
    monday: TimeSlot[];
    tuesday: TimeSlot[];
    wednesday: TimeSlot[];
    thursday: TimeSlot[];
    friday: TimeSlot[];
    saturday: TimeSlot[];
    sunday: TimeSlot[];
}
interface Product {
    id: number;
    title: string;
    content: string;
    price: number;
    image: string;
    published: string | boolean;
    categoryId: number;
    availability: Availability | null;
    savedByUsers?: { userId: string }[];
}
interface CurrentUser {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    role: 'USER' | 'ADMIN';
}
interface Appointment {
    id: number;
    appointmentDate: string;
    status: 'CONFIRMED' | 'COMPLETED' | 'CANCELED';
    post: {
        id: number;
        title: string;
        image: string;
    };
}


// --- HELPERS DE COOKIE ---
const setCookie = (name: string, value: string, days: number) => {
    let expires = "";
    if (days) {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "") + expires + "; path=/";
};

const getCookie = (name: string): string | null => {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
};

// --- COMPONENTES AUXILIARES ---

const ProductCard: React.FC<{ product: Product; user: CurrentUser | null; onBook: () => void; onSaveToggle: (productId: number) => void; }> = ({ product, user, onBook, onSaveToggle }) => {
    const cardRef = useRef<HTMLDivElement>(null);
    const isSaved = user ? product.savedByUsers?.some(save => save.userId === user.id) : false;

    useEffect(() => {
        const card = cardRef.current;
        if (!card) return;

        const handleMouseMove = (e: MouseEvent) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            card.style.setProperty('--mouse-x', `${x}px`);
            card.style.setProperty('--mouse-y', `${y}px`);
        };

        card.addEventListener('mousemove', handleMouseMove);
        return () => card.removeEventListener('mousemove', handleMouseMove);
    }, []);

    return (
        <div ref={cardRef} className="card-interactive bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col fade-in-up transition-transform duration-300 hover:-translate-y-1 relative">
            <div className="w-full h-48 overflow-hidden relative">
                <img src={`${API_BASE_URL}/${product.image}`} alt={product.title} className="w-full h-full object-cover transition-transform duration-300 hover:scale-105" />
                {user && (
                    <button onClick={() => onSaveToggle(product.id)} className="absolute top-3 right-3 p-2 rounded-full bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition-colors">
                        <Heart size={20} className={isSaved ? 'fill-red-500 text-red-500' : 'fill-transparent'} />
                    </button>
                )}
            </div>
            <div className="p-6 flex flex-col flex-grow">
                <h3 className="text-xl font-bold mb-2 text-gray-800 dark:text-white">{product.title}</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4 flex-grow text-sm">{product.content.substring(0, 100)}...</p>
                <div className="flex justify-between items-center mt-auto">
                    <span className="text-2xl font-bold text-blue-600">R${parseFloat(String(product.price)).toFixed(2)}</span>
                    <button onClick={onBook} className="bg-blue-600 text-white font-semibold px-6 py-2 rounded-full hover:bg-blue-700 transition-colors z-10">
                        Agendar
                    </button>
                </div>
            </div>
        </div>
    );
};

const BookingModal: React.FC<{ product: Product | null; user: CurrentUser | null; isOpen: boolean; onClose: () => void; existingAppointments: Appointment[] }> = ({ product, user, isOpen, onClose, existingAppointments }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const modalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setSelectedDate(null);
        setSelectedTime(null);
    }, [product]);
    
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
        if (!product?.availability) return [];
        const dayMap: { [key: string]: number } = { sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6 };
        return Object.entries(product.availability)
            .filter(([_, slots]) => Array.isArray(slots) && slots.length > 0)
            .map(([day]) => dayMap[day as keyof typeof dayMap]);
    }, [product?.availability]);

    const timeSlots = useMemo(() => {
        if (!selectedDate || !product?.availability) return [];
        const dayKey = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][selectedDate.getDay()] as keyof Availability;
        const slots = (product.availability as any)[dayKey];
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
    }, [selectedDate, product?.availability]);

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
    
    // CORREÇÃO: A verificação agora acontece depois dos hooks
    if (!isOpen || !product) return null;

    const handleDateClick = (day: number) => {
        const newSelectedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        if (newSelectedDate < new Date(new Date().toDateString())) return;
        if (!availableDaysOfWeek.includes(newSelectedDate.getDay())) return;
        setSelectedDate(newSelectedDate);
        setSelectedTime(null);
    };

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
            const res = await fetch(UrlUser.createAppointment(), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ postId: product.id, appointmentDate: finalBookingDate.toISOString() }),
            });

            if (res.status === 409) throw new Error("Este horário já não se encontra disponível.");
            if (!res.ok) throw new Error("Não foi possível realizar o agendamento.");

            Swal.fire('Agendado!', 'O seu horário foi confirmado com sucesso.', 'success');
            onClose();
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
                    <h3 className="text-xl font-semibold text-gray-800">Agendar: {product.title}</h3>
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

const MobileDrawer: React.FC<{ isOpen: boolean; onClose: () => void; user: CurrentUser | null; onLogout: () => void; }> = ({ isOpen, onClose, user, onLogout }) => {
    return (
        <div className={`fixed inset-0 z-40 md:hidden transition-opacity duration-300 ${isOpen ? 'bg-black/40' : 'bg-transparent pointer-events-none'}`} onClick={onClose}>
            <div className={`fixed top-0 right-0 h-full w-4/5 max-w-xs bg-white dark:bg-gray-800 shadow-xl transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`} onClick={e => e.stopPropagation()}>
                <div className="p-4 flex justify-end">
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                        <X className="w-6 h-6" />
                    </button>
                </div>
                <nav className="flex flex-col p-4 space-y-4">
                    <a href="#" className="text-lg font-medium text-gray-800 dark:text-gray-200 hover:text-blue-600">Início</a>
                    <a href="#produtos" className="text-lg font-medium text-gray-800 dark:text-gray-200 hover:text-blue-600">Serviços</a>
                    {user ? (
                        <button onClick={onLogout} className="mt-4 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-red-500 text-white text-sm font-semibold hover:bg-red-600">
                            <LogOut className="w-4 h-4" /><span>Logout</span>
                        </button>
                    ) : (
                        <a href={`${API_BASE_URL}/auth/google`} className="mt-4 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700">
                            <User className="w-4 h-4" /><span>Login com Google</span>
                        </a>
                    )}
                </nav>
            </div>
        </div>
    );
};

const UserProfile: React.FC<{ user: CurrentUser; onLogout: () => void }> = ({ user, onLogout }) => {
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [ref]);

    return (
        <div className="relative" ref={ref}>
            <button onClick={() => setIsOpen(!isOpen)} className="flex items-center gap-2">
                <img src={user.image || `https://ui-avatars.com/api/?name=${user.name || 'U'}&background=random`} alt="Avatar" className="w-9 h-9 rounded-full object-cover" />
                <span className="hidden sm:inline font-semibold text-sm text-gray-700 dark:text-gray-300">{user.name}</span>
            </button>
            {isOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-lg z-50 border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                        <p className="font-semibold text-gray-800 dark:text-white truncate">{user.name}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                    </div>
                    <div className="p-2">
                        <button onClick={() => navigate('/meus-agendamentos')} className="w-full text-left flex items-center gap-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-lg">
                            <Calendar size={16} /> Meus Agendamentos
                        </button>
                        <button onClick={onLogout} className="w-full text-left flex items-center gap-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg">
                            <LogOut size={16} /> Sair
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

const Footer: React.FC = () => {
    return (
        <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
            <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                           <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center"><Gem className="text-white w-5 h-5" /></div>
                           <span className="font-bold text-xl">Sua Marca</span>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Transformando o visual e elevando a autoestima desde 2024.</p>
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-gray-800 dark:text-white tracking-wider uppercase">Navegação</h3>
                        <ul className="mt-4 space-y-2">
                            <li><a href="#" className="text-base text-gray-500 dark:text-gray-400 hover:text-blue-600">Início</a></li>
                            <li><a href="#produtos" className="text-base text-gray-500 dark:text-gray-400 hover:text-blue-600">Serviços</a></li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-gray-800 dark:text-white tracking-wider uppercase">Legal</h3>
                        <ul className="mt-4 space-y-2">
                            <li><a href="#" className="text-base text-gray-500 dark:text-gray-400 hover:text-blue-600">Política de Privacidade</a></li>
                            <li><a href="#" className="text-base text-gray-500 dark:text-gray-400 hover:text-blue-600">Termos de Uso</a></li>
                        </ul>
                    </div>
                     <div>
                        <h3 className="text-sm font-semibold text-gray-800 dark:text-white tracking-wider uppercase">Siga-nos</h3>
                        <div className="flex mt-4 space-x-4">
                            <a href="#" className="text-gray-400 hover:text-blue-600"><Instagram /></a>
                            <a href="#" className="text-gray-400 hover:text-blue-600"><Facebook /></a>
                            <a href="#" className="text-gray-400 hover:text-blue-600"><Twitter /></a>
                        </div>
                    </div>
                </div>
                <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-8 text-center text-sm text-gray-500 dark:text-gray-400">
                    <p>&copy; {new Date().getFullYear()} Sua Marca. Todos os direitos reservados.</p>
                </div>
            </div>
        </footer>
    );
};


// --- COMPONENTE PRINCIPAL ---

export default function LandingPage() {
    const [theme, setTheme] = useState(() => {
        const savedTheme = getCookie('theme');
        if (savedTheme) return savedTheme;
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    });
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [bookingProduct, setBookingProduct] = useState<Product | null>(null);
    const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const navigate = useNavigate();

    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        setCookie('theme', theme, 365);
    }, [theme]);

    useEffect(() => {
        const checkAuthStatus = async (isNewLogin: boolean = false) => {
            try {
                const res = await fetch(`${API_BASE_URL}/auth/me`, {
                    credentials: 'include',
                });
                if (!res.ok) {
                    setCurrentUser(null);
                    return;
                }
                const userData = await res.json();
                setCurrentUser(userData);

                const appointmentsRes = await fetch(UrlUser.getAppointments(), { credentials: 'include' });
                if(appointmentsRes.ok) {
                    const appointmentsData = await appointmentsRes.json();
                    setAppointments(Array.isArray(appointmentsData) ? appointmentsData : []);
                }
                
                if (isNewLogin) {
                    Swal.fire({
                        icon: 'success',
                        title: 'Login efetuado com sucesso!',
                        toast: true,
                        position: 'top-end',
                        showConfirmButton: false,
                        timer: 3000,
                        timerProgressBar: true,
                    });
                    navigate('/meus-agendamentos');
                }
            } catch (error) {
                setCurrentUser(null);
            }
        };

        const params = new URLSearchParams(window.location.search);
        const isNewLogin = params.has('login_success');

        checkAuthStatus(isNewLogin);

        if (isNewLogin) {
            window.history.replaceState({}, document.title, "/");
        }

        const fetchData = async () => {
            try {
                const [productsRes, categoriesRes] = await Promise.all([
                    fetch(UrlProducts.allProducts),
                    fetch(UrlCategories.allCategories),
                ]);
                const productsData = await productsRes.json();
                const categoriesData = await categoriesRes.json();

                const publishedProducts = Array.isArray(productsData) 
                    ? productsData.filter(p => p.published === 'true' || p.published === true) 
                    : [];

                setProducts(publishedProducts);
                setFilteredProducts(publishedProducts);
                setCategories(Array.isArray(categoriesData) ? categoriesData : []);
            } catch (error) {
                console.error("Falha ao buscar dados:", error);
            }
        };

        fetchData();
    }, [navigate]);

    useEffect(() => {
        let result = products;
        if (searchTerm) {
            result = result.filter(p => p.title.toLowerCase().includes(searchTerm.toLowerCase()));
        }
        if (selectedCategory !== 'all') {
            result = result.filter(p => p.categoryId === parseInt(selectedCategory));
        }
        setFilteredProducts(result);
    }, [searchTerm, selectedCategory, products]);
    
    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });

        const elements = document.querySelectorAll('.fade-in-up');
        elements.forEach(el => observer.observe(el));

        return () => elements.forEach(el => observer.unobserve(el));
    }, [filteredProducts]);

    const handleThemeToggle = () => setTheme(theme === 'light' ? 'dark' : 'light');
    
    const handleBookClick = (product: Product) => {
        if (currentUser) {
            setBookingProduct(product);
        } else {
            Swal.fire({
                title: 'Login Necessário',
                text: "Você precisa de fazer login para agendar um serviço.",
                icon: 'info',
                showCancelButton: true,
                confirmButtonText: 'Fazer Login',
                cancelButtonText: 'Cancelar',
            }).then((result) => {
                if (result.isConfirmed) {
                    window.location.href = `${API_BASE_URL}/auth/google`;
                }
            });
        }
    };

    const handleSaveToggle = async (productId: number) => {
        if (!currentUser) {
            Swal.fire('Login Necessário', 'Você precisa de fazer login para salvar um item.', 'info');
            return;
        }
    
        const originalProducts = [...products];
        const isCurrentlySaved = products.find(p => p.id === productId)?.savedByUsers?.some(s => s.userId === currentUser.id);
    
        const updatedProducts = products.map(p => {
            if (p.id === productId) {
                const savedByUsers = p.savedByUsers || [];
                if (isCurrentlySaved) {
                    return { ...p, savedByUsers: savedByUsers.filter(s => s.userId !== currentUser.id) };
                } else {
                    return { ...p, savedByUsers: [...savedByUsers, { userId: currentUser.id }] };
                }
            }
            return p;
        });
        setProducts(updatedProducts);
    
        try {
            const res = await fetch(UrlUser.toggleSavePost(productId), {
                method: 'POST',
                credentials: 'include',
            });
    
            if (!res.ok) {
                throw new Error('Falha ao salvar o item.');
            }
        } catch (error) {
            setProducts(originalProducts);
            Swal.fire('Erro', 'Não foi possível salvar o item. Tente novamente.', 'error');
        }
    };

    const handleLogout = async () => {
        await fetch(`${API_BASE_URL}/auth/logout`, { 
            method: 'POST',
            credentials: 'include'
        });
        setCurrentUser(null);
        navigate('/');
    };

    return (
        <div className="bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 transition-colors duration-300">
            <style>{`
                .fade-in-up { opacity: 0; transform: translateY(20px); transition: opacity 0.6s ease-out, transform 0.6s ease-out; }
                .fade-in-up.visible { opacity: 1; transform: translateY(0); }
                .card-interactive::before {
                    content: '';
                    position: absolute;
                    left: 0;
                    top: 0;
                    width: 100%;
                    height: 100%;
                    background: radial-gradient(circle at var(--mouse-x) var(--mouse-y), rgba(0, 123, 255, 0.15), transparent 20%);
                    opacity: 0;
                    transition: opacity 0.3s;
                    border-radius: 1rem; /* same as card */
                }
                .card-interactive:hover::before {
                    opacity: 1;
                }
                .dark .dark-mode-pattern {
                    background-image: radial-gradient(circle at 1px 1px, rgba(255,255,255,0.05) 1px, transparent 0);
                    background-size: 2rem 2rem;
                }
            `}</style>
            <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg sticky top-0 z-30 border-b border-gray-200 dark:border-gray-700">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex-shrink-0 flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
                            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center"><Gem className="text-white w-5 h-5" /></div>
                            <span className="font-bold text-xl">Sua Marca</span>
                        </div>
                        <nav className="hidden md:flex items-center space-x-8">
                            <a href="#" className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-blue-600">Início</a>
                            <a href="#produtos" className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-blue-600">Serviços</a>
                        </nav>
                        <div className="flex items-center gap-3">
                            <button onClick={handleThemeToggle} className="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700">
                                {theme === 'light' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                            </button>
                            {currentUser ? (
                                <UserProfile user={currentUser} onLogout={handleLogout} />
                            ) : (
                                <a href={`${API_BASE_URL}/auth/google`} className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700">
                                    <User className="w-4 h-4" /><span>Login com Google</span>
                                </a>
                            )}
                            <button onClick={() => setMobileMenuOpen(true)} className="md:hidden p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700">
                                <Menu className="w-6 h-6" />
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <MobileDrawer isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} user={currentUser} onLogout={handleLogout} />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <section className="mb-16">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 md:p-12 flex flex-col md:flex-row items-center gap-8">
                        <div className="md:w-1/2 text-center md:text-left">
                            <h1 className="text-4xl md:text-5xl font-bold text-gray-800 dark:text-white leading-tight fade-in-up">Agende seu Estilo, Transforme seu Visual</h1>
                            <p className="mt-4 text-lg text-gray-600 dark:text-gray-300 fade-in-up" style={{transitionDelay: '200ms'}}>Descubra nossos serviços exclusivos e agende seu horário com os melhores profissionais.</p>
                            <a href="#produtos" className="mt-8 inline-block bg-blue-600 text-white font-semibold px-8 py-3 rounded-full hover:bg-blue-700 transition-transform hover:scale-105 fade-in-up" style={{transitionDelay: '400ms'}}>Ver Serviços</a>
                        </div>
                        <div className="md:w-1/2 fade-in-up" style={{transitionDelay: '600ms'}}>
                            <img src="https://placehold.co/600x400/E2E8F0/4338CA?text=Destaque" alt="Imagem de Destaque" className="rounded-2xl w-full h-auto" />
                        </div>
                    </div>
                </section>

                <section id="produtos">
                    <h2 className="text-3xl font-bold text-center mb-4">Nossos Serviços</h2>
                    <p className="text-center text-gray-600 dark:text-gray-400 mb-12 max-w-2xl mx-auto">Explore nossa gama de serviços e encontre o ideal para você. Filtre por categoria para refinar sua busca.</p>
                    <div className="mb-8 flex flex-col sm:flex-row gap-4">
                        <div className="relative flex-grow">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input type="text" placeholder="Buscar serviço..." onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-12 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-full bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                        </div>
                        <div className="relative">
                            <List className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <select onChange={(e) => setSelectedCategory(e.target.value)} className="w-full sm:w-56 pl-12 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-full bg-white dark:bg-gray-800 appearance-none focus:ring-2 focus:ring-blue-500 focus:outline-none">
                                <option value="all">Todas as Categorias</option>
                                {categories.map(cat => <option key={cat.id} value={String(cat.id)}>{cat.name}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredProducts.map(product => (
                            <ProductCard key={product.id} product={product} user={currentUser} onBook={() => handleBookClick(product)} onSaveToggle={handleSaveToggle} />
                        ))}
                    </div>
                </section>
            </main>

            <BookingModal product={bookingProduct} user={currentUser} isOpen={!!bookingProduct} onClose={() => setBookingProduct(null)} existingAppointments={appointments} />
            <Footer />
        </div>
    );
}
