import React, { useState, useEffect, useMemo } from 'react';
import Swal from 'sweetalert2';
import { Calendar, Clock, XCircle, CheckCircle, Tag } from 'lucide-react';
//import Navbar from '../../../admin/utils/Navbar'; // Ajuste o caminho conforme necessário

// --- TIPOS E CONFIGURAÇÕES ---
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:1000";

// Assumindo que você criará endpoints para os agendamentos do usuário
const UrlUserAppointments = {
    get: (userId: string) => `${API_BASE_URL}/api/user/${userId}/appointments`,
    cancel: (appointmentId: number) => `${API__URL}/api/appointments/${appointmentId}/cancel`,
};

type AppointmentStatus = 'CONFIRMED' | 'COMPLETED' | 'CANCELED';

interface Appointment {
    id: number;
    appointmentDate: string;
    status: AppointmentStatus;
    post: {
        title: string;
        image: string;
    };
}

interface CurrentUser {
    id: string;
    name: string | null;
    image: string | null;
}

// --- COMPONENTE PRINCIPAL ---
export default function MyAppointments() {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    // Mock do usuário logado. Isto será substituído pela autenticação real.
    const [currentUser, setCurrentUser] = useState<CurrentUser | null>({
        id: "user_mock_id_123",
        name: "Gabriel Rodrigues",
        image: "https://placehold.co/100x100/E2E8F0/4A5568?text=G"
    });

    useEffect(() => {
        if (!currentUser) {
            // Em um app real, você redirecionaria para a página de login
            setLoading(false);
            setError("Utilizador não autenticado.");
            return;
        }

        const fetchAppointments = async () => {
            setLoading(true);
            setError(null);
            try {
                // const res = await fetch(UrlUserAppointments.get(currentUser.id));
                // if (!res.ok) throw new Error("Não foi possível carregar seus agendamentos.");
                // const data = await res.json();
                
                // Dados Mock para demonstração
                const mockData: Appointment[] = [
                    { id: 1, appointmentDate: new Date(Date.now() + 86400000 * 2).toISOString(), status: 'CONFIRMED', post: { title: 'Corte Masculino Moderno', image: 'uploads/images-item/image-1.jpg' } },
                    { id: 2, appointmentDate: new Date(Date.now() + 86400000 * 5).toISOString(), status: 'CONFIRMED', post: { title: 'Barba Terapia Completa', image: 'uploads/images-item/image-2.jpg' } },
                    { id: 3, appointmentDate: new Date(Date.now() - 86400000 * 3).toISOString(), status: 'COMPLETED', post: { title: 'Limpeza de Pele Profunda', image: 'uploads/images-item/image-3.jpg' } },
                    { id: 4, appointmentDate: new Date(Date.now() - 86400000 * 10).toISOString(), status: 'CANCELED', post: { title: 'Coloração e Mechas', image: 'uploads/images-item/image-4.jpg' } },
                ];
                setAppointments(mockData);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchAppointments();
    }, [currentUser]);

    const { upcomingAppointments, pastAppointments } = useMemo(() => {
        const now = new Date();
        const upcoming = appointments
            .filter(app => new Date(app.appointmentDate) >= now && app.status === 'CONFIRMED')
            .sort((a, b) => new Date(a.appointmentDate).getTime() - new Date(b.appointmentDate).getTime());
        
        const past = appointments
            .filter(app => new Date(app.appointmentDate) < now || app.status !== 'CONFIRMED')
            .sort((a, b) => new Date(b.appointmentDate).getTime() - new Date(a.appointmentDate).getTime());

        return { upcomingAppointments: upcoming, pastAppointments: past };
    }, [appointments]);
    
    const handleCancel = async (appointmentId: number) => {
        const result = await Swal.fire({
            title: 'Tem a certeza?',
            text: "Deseja mesmo cancelar este agendamento?",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sim, cancelar',
            cancelButtonText: 'Não',
        });

        if (result.isConfirmed) {
            // Lógica para chamar a API de cancelamento
            setAppointments(prev => prev.map(app => 
                app.id === appointmentId ? { ...app, status: 'CANCELED' } : app
            ));
            Swal.fire('Cancelado!', 'O seu agendamento foi cancelado.', 'success');
        }
    };

    if (loading) {
        return <><Navbar /><div className="text-center p-12">A carregar agendamentos...</div></>;
    }

    return (
        <>
           { /*<Navbar />*/}
            <main className="min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-8">
                <div className="max-w-4xl mx-auto">
                    <header className="flex items-center gap-4 mb-8">
                        {currentUser?.image && <img src={currentUser.image} alt="Avatar" className="w-16 h-16 rounded-full border-2 border-white shadow-md" />}
                        <div>
                            <h1 className="text-2xl font-semibold text-gray-800">Meus Agendamentos</h1>
                            <p className="text-sm text-gray-500 mt-1">Olá, {currentUser?.name || 'Cliente'}! Aqui pode ver e gerir os seus horários.</p>
                        </div>
                    </header>

                    {error && <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-8">{error}</div>}

                    {/* Próximos Agendamentos */}
                    <section className="mb-12">
                        <h2 className="text-xl font-semibold text-gray-700 mb-4">Próximos Agendamentos</h2>
                        {upcomingAppointments.length > 0 ? (
                            <div className="space-y-4">
                                {upcomingAppointments.map(app => (
                                    <AppointmentCard key={app.id} appointment={app} onCancel={handleCancel} />
                                ))}
                            </div>
                        ) : (
                            <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center text-gray-500">
                                Você não tem agendamentos futuros.
                            </div>
                        )}
                    </section>

                    {/* Histórico de Agendamentos */}
                    <section>
                        <h2 className="text-xl font-semibold text-gray-700 mb-4">Histórico</h2>
                        {pastAppointments.length > 0 ? (
                            <div className="space-y-4">
                                {pastAppointments.map(app => (
                                    <AppointmentCard key={app.id} appointment={app} />
                                ))}
                            </div>
                        ) : (
                            <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center text-gray-500">
                                O seu histórico de agendamentos está vazio.
                            </div>
                        )}
                    </section>
                </div>
            </main>
        </>
    );
}

// --- COMPONENTE DE ITEM DE AGENDAMENTO ---

const AppointmentCard: React.FC<{ appointment: Appointment; onCancel?: (id: number) => void }> = ({ appointment, onCancel }) => {
    const { id, appointmentDate, status, post } = appointment;
    const date = new Date(appointmentDate);
    const formattedDate = date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
    const formattedTime = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    const statusInfo = {
        CONFIRMED: { text: 'Confirmado', icon: Clock, color: 'text-blue-600 bg-blue-100' },
        COMPLETED: { text: 'Concluído', icon: CheckCircle, color: 'text-green-600 bg-green-100' },
        CANCELED: { text: 'Cancelado', icon: XCircle, color: 'text-red-600 bg-red-100' },
    }[status];
    const StatusIcon = statusInfo.icon;

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 flex flex-col sm:flex-row items-start gap-4">
            <img src={`${API_BASE_URL}/${post.image}`} alt={post.title} className="w-full sm:w-32 h-32 object-cover rounded-lg" />
            <div className="flex-1">
                <div className="flex justify-between items-start">
                    <div>
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                            <StatusIcon size={14} /> {statusInfo.text}
                        </span>
                        <h3 className="text-lg font-semibold text-gray-800 mt-2">{post.title}</h3>
                    </div>
                    {onCancel && status === 'CONFIRMED' && (
                        <button onClick={() => onCancel(id)} className="text-sm text-red-500 hover:underline font-semibold">
                            Cancelar
                        </button>
                    )}
                </div>
                <div className="mt-2 pt-2 border-t flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                        <Calendar size={16} className="text-gray-400" />
                        <span>{formattedDate}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Clock size={16} className="text-gray-400" />
                        <span>{formattedTime}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
