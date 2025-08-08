import React, { useEffect, useState, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Package, CheckCircle, Clock, Users, ImageIcon, MoreHorizontal, ArrowRight, Calendar, Tag } from "lucide-react";
// Ajuste os paths de importação conforme a estrutura do seu projeto
import { UrlProducts, UrlCategories, UrlAppointments } from "../../utils/scripts/url";
import Navbar from "../../utils/Navbar";

// --- TIPOS ---
interface Category {
    id: number;
    name: string;
}

interface Product {
    id: number;
    title: string;
    content?: string;
    price: number;
    published: boolean | string;
    image: string;
    createdAt: string;
    categoryId: number;
}

interface Appointment {
    id: number;
    appointmentDate: string;
    status: 'CONFIRMED' | 'COMPLETED' | 'CANCELED';
    user: {
        name: string;
        image: string | null;
    };
    post: {
        title: string;
    };
}

// --- CONSTANTES ---
const API_BASE_URL = "http://localhost:3000";

// --- FUNÇÃO HELPER PARA DATA ---
const formatDate = () => {
    return new Date().toLocaleDateString('pt-BR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
};

export default function Dashboard() {
    const [items, setItems] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentDate] = useState(formatDate());

    useEffect(() => {
        async function fetchData() {
            try {
                const [productsRes, categoriesRes, appointmentsRes] = await Promise.all([
                    fetch(UrlProducts.allProducts),
                    fetch(UrlCategories.allCategories),
                    fetch(UrlAppointments.all)
                ]);

                if (!productsRes.ok) throw new Error(`Erro ao buscar produtos`);
                if (!categoriesRes.ok) throw new Error(`Erro ao buscar categorias`);
                if (!appointmentsRes.ok) throw new Error(`Erro ao buscar agendamentos`);

                const productsData = await productsRes.json();
                const categoriesData = await categoriesRes.json();
                const appointmentsData = await appointmentsRes.json();

                setItems(Array.isArray(productsData) ? productsData : []);
                setCategories(Array.isArray(categoriesData) ? categoriesData : []);
                setAppointments(Array.isArray(appointmentsData) ? appointmentsData : []);
            } catch (err: any) {
                console.error("Erro ao carregar dados:", err);
                setError("Não foi possível carregar os dados. Verifique a conexão.");
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    const stats = useMemo(() => ({
        totalProducts: items.length,
        publishedProducts: items.filter(item => String(item.published) === 'true').length,
        totalAppointments: appointments.length,
        upcomingAppointments: appointments.filter(app => app.status === 'CONFIRMED' && new Date(app.appointmentDate) > new Date()).length,
    }), [items, appointments]);

    const getCategoryNameById = (id: number) => {
        const found = categories.find(cat => cat.id === id);
        return found?.name ?? "Sem categoria";
    };

    const latestProducts = useMemo(() => {
        return [...items]
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 3); // Mostrar apenas os 3 mais recentes
    }, [items]);
    
    const upcomingAppointments = useMemo(() => {
        return [...appointments]
            .filter(app => app.status === 'CONFIRMED' && new Date(app.appointmentDate) > new Date())
            .sort((a, b) => new Date(a.appointmentDate).getTime() - new Date(b.appointmentDate).getTime())
            .slice(0, 5); // Mostrar os 5 próximos
    }, [appointments]);

    if (loading) {
        return <><Navbar /><div className="flex items-center justify-center min-h-screen bg-gray-100 text-gray-600">Carregando...</div></>;
    }

    if (error) {
        return <><Navbar /><div className="min-h-screen bg-gray-100 p-8"><div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md"><strong>Erro:</strong> {error}</div></div></>;
    }

    return (
        <>
            <Navbar />
            <main className="min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-8">
                <div className="max-w-7xl mx-auto">
                    <header className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-800">Bem-vindo de volta, Admin!</h1>
                        <p className="text-md text-gray-500 capitalize">{currentDate}</p>
                    </header>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Coluna Principal */}
                        <div className="lg:col-span-2 space-y-8">
                            <section className="bg-white rounded-2xl shadow-sm border border-gray-200">
                                <header className="p-6 border-b border-gray-200 flex justify-between items-center">
                                    <h2 className="text-lg font-semibold text-gray-900">Próximos Agendamentos</h2>
                                    <Link to="/appointments" className="text-sm font-semibold text-blue-600 hover:underline flex items-center gap-1">
                                        Ver todos <ArrowRight size={14} />
                                    </Link>
                                </header>
                                <div className="p-4">
                                    {upcomingAppointments.length === 0 ? (
                                        <div className="text-center py-12 text-gray-500">Nenhum agendamento próximo.</div>
                                    ) : (
                                        <div className="divide-y divide-gray-100">
                                            {upcomingAppointments.map((app) => (
                                                <AppointmentPreviewCard key={app.id} appointment={app} />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </section>
                             <section className="bg-white rounded-2xl shadow-sm border border-gray-200">
                                <header className="p-6 border-b border-gray-200 flex justify-between items-center">
                                    <h2 className="text-lg font-semibold text-gray-900">Produtos Recentes</h2>
                                    <Link to="/view-itens" className="text-sm font-semibold text-blue-600 hover:underline flex items-center gap-1">
                                        Ver todos <ArrowRight size={14} />
                                    </Link>
                                </header>
                                <div className="p-4">
                                    {latestProducts.length === 0 ? (
                                        <div className="text-center py-12 text-gray-500">Nenhum produto adicionado recentemente.</div>
                                    ) : (
                                        <div className="divide-y divide-gray-100">
                                            {latestProducts.map((item) => (
                                                <ProductListItem key={item.id} item={item} categoryName={getCategoryNameById(item.categoryId)} />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </section>
                        </div>

                        {/* Coluna Lateral */}
                        <aside className="space-y-8">
                           <StatCard icon={Calendar} color="orange" title="Próximos Agendamentos" value={stats.upcomingAppointments} total={stats.totalAppointments} link="/appointments" />
                           <StatCard icon={Package} color="blue" title="Produtos Publicados" value={stats.publishedProducts} total={stats.totalProducts} link="/view-itens" />
                           <StatCard icon={Users} color="purple" title="Novos Clientes (30d)" value="0" link="#" />
                        </aside>
                    </div>
                </div>
            </main>
        </>
    );
}

// --- COMPONENTES AUXILIARES ---

interface StatCardProps {
    icon: React.ElementType;
    color: string;
    title: string;
    value: string | number;
    total?: string | number;
    link: string;
}

function StatCard({ icon: Icon, color, title, value, total, link }: StatCardProps) {
    const colors: { [key: string]: { bg: string; text: string; progress: string } } = {
        green: { bg: "bg-green-100", text: "text-green-600", progress: "bg-green-500" },
        yellow: { bg: "bg-yellow-100", text: "text-yellow-600", progress: "bg-yellow-500" },
        blue: { bg: "bg-blue-100", text: "text-blue-600", progress: "bg-blue-500" },
        purple: { bg: "bg-purple-100", text: "text-purple-600", progress: "bg-purple-500" },
        orange: { bg: "bg-orange-100", text: "text-orange-600", progress: "bg-orange-500" },
    };
    const navigate = useNavigate();
    const percentage = total && Number(total) > 0 ? (Number(value) / Number(total)) * 100 : 0;

    return (
        <div onClick={() => navigate(link)} className={`bg-white rounded-2xl shadow-sm border border-gray-200 p-6 transition-all duration-300 hover:shadow-md hover:-translate-y-1 cursor-pointer`}>
            <div className="flex items-center justify-between">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colors[color].bg} ${colors[color].text}`}>
                    <Icon size={24} />
                </div>
                <span className="text-xs font-semibold text-gray-500">{title}</span>
            </div>
            <div className="mt-4">
                <p className="text-3xl font-bold text-gray-800">{value}</p>
                {total !== undefined && <p className="text-sm text-gray-500">de {total}</p>}
            </div>
            {total !== undefined && (
                <div className="mt-4">
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div className={`${colors[color].progress} h-1.5 rounded-full`} style={{ width: `${percentage}%` }}></div>
                    </div>
                </div>
            )}
        </div>
    );
}

function ProductListItem({ item, categoryName }: { item: Product, categoryName: string }) {
    const imageUrl = item.image ? `${API_BASE_URL}/${item.image}` : null;
    return (
        <div className="flex items-center gap-4 p-4">
            <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                {imageUrl ? (
                    <img src={imageUrl} alt={item.title} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400"><ImageIcon size={24} /></div>
                )}
            </div>
            <div className="flex-1">
                <p className="font-semibold text-gray-800">{item.title}</p>
                <p className="text-xs text-gray-500">{categoryName}</p>
            </div>
            <button className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full">
                <MoreHorizontal size={18} />
            </button>
        </div>
    );
}

function AppointmentPreviewCard({ appointment }: { appointment: Appointment }) {
    const date = new Date(appointment.appointmentDate);
    return (
        <div className="flex items-center gap-4 p-4">
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex flex-col items-center justify-center flex-shrink-0 font-bold">
                <span className="text-xs text-blue-600">{date.toLocaleDateString('pt-BR', { month: 'short' })}</span>
                <span className="text-xl text-gray-800">{date.getDate()}</span>
            </div>
            <div className="flex-1">
                <p className="font-semibold text-gray-800">{appointment.user.name}</p>
                <p className="text-xs text-gray-500 flex items-center gap-1.5"><Tag size={12}/> {appointment.post.title}</p>
            </div>
            <div className="text-right">
                <p className="font-semibold text-gray-700">{date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                <span className="text-xs text-blue-600">Confirmado</span>
            </div>
        </div>
    );
}
