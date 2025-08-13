import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Package, CheckCircle, Clock, Users, ArrowRight, CalendarCheck2, Tag } from "lucide-react";
// Ajuste os caminhos de importação conforme a estrutura do seu projeto
import { UrlProducts, UrlCategories, UrlAppointments, UrlUsers, API_BASE_URL } from "../../utils/scripts/url";
import Navbar from "../../utils/Navbar";

// --- TIPOS ---
interface Appointment {
    id: number;
    appointmentDate: string;
    user: {
        name: string | null;
        image: string | null;
    };
    post: {
        title: string;
    };
}

interface Product { id: number; published: boolean; }
interface Category { id: number; }
interface User { id: string; }

// --- COMPONENTE PRINCIPAL ---
export default function Dashboard() {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            const token = localStorage.getItem('admin_token');
            if (!token) {
                navigate('/admin'); // Redireciona se não houver token
                return;
            }

            setLoading(true);
            setError(null);

            try {
                const headers = { 'Authorization': `Bearer ${token}` };

                const [appointmentsRes, productsRes, categoriesRes, usersRes] = await Promise.all([
                    fetch(UrlAppointments.all, { headers }),
                    fetch(UrlProducts.allProducts, { headers }),
                    fetch(UrlCategories.allCategories, { headers }),
                    fetch(UrlUsers.all, { headers })
                ]);

                // Verifica se algum token foi invalidado
                if ([appointmentsRes, productsRes, categoriesRes, usersRes].some(res => res.status === 401 || res.status === 403)) {
                    localStorage.removeItem('admin_token');
                    navigate('/admin');
                    return;
                }

                // Verifica se todas as respostas foram bem-sucedidas antes de tentar o .json()
                for (const res of [appointmentsRes, productsRes, categoriesRes, usersRes]) {
                    if (!res.ok) {
                        throw new Error(`Falha ao buscar um dos recursos: ${res.statusText}`);
                    }
                }

                const appointmentsData = await appointmentsRes.json();
                const productsData = await productsRes.json();
                const categoriesData = await categoriesRes.json();
                const usersData = await usersRes.json();

                setAppointments(Array.isArray(appointmentsData) ? appointmentsData : []);
                setProducts(Array.isArray(productsData) ? productsData : []);
                setCategories(Array.isArray(categoriesData) ? categoriesData : []);
                setUsers(Array.isArray(usersData) ? usersData : []);

            } catch (err: any) {
                console.error("Erro ao carregar dados do dashboard:", err);
                setError(err.message || "Não foi possível carregar os dados. Verifique a conexão com o backend.");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [navigate]);

    const stats = useMemo(() => {
        const publishedCount = products.filter(item => item.published).length;
        return {
            totalProducts: products.length,
            publishedProducts: publishedCount,
            draftProducts: products.length - publishedCount,
            totalCategories: categories.length,
            totalUsers: users.length,
            totalAppointments: appointments.length,
        };
    }, [products, categories, users, appointments]);
    
    const upcomingAppointments = useMemo(() => {
        return appointments
            .filter(app => new Date(app.appointmentDate) >= new Date())
            .sort((a, b) => new Date(a.appointmentDate).getTime() - new Date(b.appointmentDate).getTime())
            .slice(0, 5);
    }, [appointments]);


    if (loading) {
        return (
            <>
                <Navbar />
                <div className="flex items-center justify-center min-h-screen bg-gray-50 text-gray-600">
                    Carregando dados...
                </div>
            </>
        );
    }

    if (error) {
        return (
            <>
                <Navbar />
                <div className="min-h-screen bg-gray-50 p-6">
                    <div className="max-w-7xl mx-auto">
                        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md" role="alert">
                            <p className="font-bold">Ocorreu um erro</p>
                            <p>{error}</p>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    return (
        <div className="bg-gray-50 min-h-screen">
            <Navbar />
            <main className="p-4 sm:p-6 lg:p-8">
                <div className="max-w-7xl mx-auto">
                    <header className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
                        <p className="text-md text-gray-500">Visão geral do seu negócio.</p>
                    </header>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                        {/* Coluna Principal */}
                        <div className="lg:col-span-2 space-y-8">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                <StatCard icon={Package} title="Total de Produtos" value={stats.totalProducts} link="/admin/dashboard/produtos" />
                                <StatCard icon={CheckCircle} title="Publicados" value={stats.publishedProducts} link="/admin/dashboard/produtos" />
                                <StatCard icon={Clock} title="Rascunhos" value={stats.draftProducts} link="/admin/dashboard/produtos" />
                                <StatCard icon={Tag} title="Categorias" value={stats.totalCategories} link="/admin/dashboard/categorias" />
                                <StatCard icon={Users} title="Total de Clientes" value={stats.totalUsers} />
                                <StatCard icon={CalendarCheck2} title="Agendamentos" value={stats.totalAppointments} link="/admin/dashboard/agendamentos" />
                            </div>
                        </div>

                        {/* Coluna Lateral (Sidebar) */}
                        <div className="lg:col-span-1">
                             <section className="bg-white rounded-2xl shadow-sm border border-gray-200">
                                <header className="p-6 border-b border-gray-200 flex justify-between items-center">
                                    <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                        <CalendarCheck2 size={20} /> Próximos Agendamentos
                                    </h2>
                                    <button onClick={() => navigate('/admin/dashboard/agendamentos')} className="text-sm font-semibold text-blue-600 hover:underline flex items-center gap-1">
                                        Ver todos <ArrowRight size={14} />
                                    </button>
                                </header>
                                <div className="p-4">
                                    {upcomingAppointments.length === 0 ? (
                                        <div className="text-center py-12 text-gray-500">Nenhum agendamento futuro.</div>
                                    ) : (
                                        <div className="divide-y divide-gray-100">
                                            {upcomingAppointments.map((app) => (
                                                <AppointmentListItem key={app.id} appointment={app} />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </section>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

// --- COMPONENTES AUXILIARES ---

const StatCard: React.FC<{ icon: React.ElementType; title: string; value: string | number; link?: string }> = ({ icon: Icon, title, value, link }) => {
    const navigate = useNavigate();
    const isClickable = !!link;

    return (
        <div onClick={() => isClickable && navigate(link!)} className={`bg-white rounded-2xl shadow-sm border border-gray-200 p-6 transition-all duration-300 ${isClickable && 'hover:shadow-md hover:-translate-y-1 cursor-pointer'}`}>
            <div className="flex items-start justify-between">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-blue-100 text-blue-600">
                    <Icon size={24} />
                </div>
            </div>
            <div className="mt-4">
                <p className="text-3xl font-bold text-gray-800">{value}</p>
                <p className="text-sm text-gray-500">{title}</p>
            </div>
        </div>
    );
};

const AppointmentListItem: React.FC<{ appointment: Appointment }> = ({ appointment }) => {
    const appointmentDate = new Date(appointment.appointmentDate);
    return (
        <div className="flex items-center gap-4 p-3 transition-colors hover:bg-gray-50 rounded-lg">
            <img 
                src={appointment.user.image ? `${API_BASE_URL}/${appointment.user.image}` : `https://placehold.co/100x100/E2E8F0/4A5568?text=${appointment.user.name?.[0] || 'U'}`} 
                alt="Avatar do cliente" 
                className="w-10 h-10 rounded-full object-cover" 
            />
            <div className="flex-1">
                <p className="font-semibold text-gray-800">{appointment.user.name || "Cliente"}</p>
                <p className="text-xs text-gray-500">{appointment.post.title}</p>
            </div>
            <div className="text-right text-sm">
                <p className="font-medium text-gray-700">{appointmentDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</p>
                <p className="text-gray-500">{appointmentDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
        </div>
    );
};
