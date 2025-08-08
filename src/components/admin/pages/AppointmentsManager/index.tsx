import React, { useState, useEffect, useMemo, useRef } from 'react';
import Swal from 'sweetalert2';
import { Calendar, User, Tag, Clock, Search, Filter, CheckCircle, XCircle, ChevronDown, MoreVertical } from 'lucide-react';
import Navbar from '../../utils/Navbar'; // Ajuste o caminho conforme necessário
import { UrlAppointments } from '../../utils/scripts/url'; // Importa as URLs corretas

// --- TIPOS ---
type AppointmentStatus = 'CONFIRMED' | 'COMPLETED' | 'CANCELED';

interface Appointment {
    id: number;
    appointmentDate: string;
    status: AppointmentStatus;
    user: {
        name: string;
        image: string | null;
    };
    post: {
        title: string;
    };
}

// --- COMPONENTE PRINCIPAL ---

export default function AppointmentsManager() {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // --- Estados de Filtro ---
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | AppointmentStatus>('all');
    const [dateFilter, setDateFilter] = useState('');

    useEffect(() => {
        const fetchAppointments = async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await fetch(UrlAppointments.all);
                if (!res.ok) {
                    throw new Error("Não foi possível carregar os agendamentos do servidor.");
                }
                const data = await res.json();
                setAppointments(Array.isArray(data) ? data : []);
            } catch (err: any) {
                setError(err.message || "Ocorreu um erro desconhecido.");
                setAppointments([]); // Limpa os dados em caso de erro
            } finally {
                setLoading(false);
            }
        };
        fetchAppointments();
    }, []);

    const filteredAppointments = useMemo(() => {
        return appointments.filter(app => {
            const appointmentDate = new Date(app.appointmentDate);
            // Corrige a comparação de datas para ignorar a hora e o fuso horário
            const filterDate = dateFilter ? new Date(dateFilter + 'T00:00:00') : null;

            const matchesSearch = searchTerm === '' ||
                app.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                app.post.title.toLowerCase().includes(searchTerm.toLowerCase());
            
            const matchesStatus = statusFilter === 'all' || app.status === statusFilter;

            const matchesDate = !filterDate ||
                (appointmentDate.getFullYear() === filterDate.getFullYear() &&
                appointmentDate.getMonth() === filterDate.getMonth() &&
                appointmentDate.getDate() === filterDate.getDate());

            return matchesSearch && matchesStatus && matchesDate;
        });
    }, [appointments, searchTerm, statusFilter, dateFilter]);

    const handleUpdateStatus = async (id: number, status: AppointmentStatus) => {
        const originalAppointments = [...appointments];
        // Atualização otimista na UI para feedback instantâneo
        setAppointments(prev => prev.map(app => app.id === id ? { ...app, status } : app));
        
        try {
            const res = await fetch(UrlAppointments.updateStatus(id), {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status }),
            });
            if (!res.ok) {
                throw new Error("Falha ao atualizar status no servidor.");
            }
        } catch (error) {
            // Reverte a alteração na UI em caso de erro na API
            setAppointments(originalAppointments);
            Swal.fire('Erro', 'Não foi possível atualizar o status.', 'error');
        }
    };

    return (
        <>
            <Navbar />
            <main className="min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-8">
                <div className="max-w-7xl mx-auto">
                    <header className="mb-8">
                        <h1 className="text-2xl font-semibold text-gray-800">Gerir Agendamentos</h1>
                        <p className="text-sm text-gray-500 mt-1">Visualize e administre os horários marcados pelos seus clientes.</p>
                    </header>

                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6 mb-8">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="relative md:col-span-1">
                                <Search className="absolute top-1/2 -translate-y-1/2 left-3 text-gray-400" size={20}/>
                                <input placeholder="Buscar por cliente ou serviço..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="block w-full pl-10 pr-3 py-2.5 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                            </div>
                            <div className="relative">
                                <Filter className="absolute top-1/2 -translate-y-1/2 left-3 text-gray-400" size={20}/>
                                <select 
                                    value={statusFilter} 
                                    onChange={e => setStatusFilter(e.target.value as 'all' | AppointmentStatus)} 
                                    className="block w-full pl-10 pr-3 py-2.5 text-sm rounded-lg border border-gray-300 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="all">Todos os Status</option>
                                    <option value="CONFIRMED">Confirmados</option>
                                    <option value="COMPLETED">Concluídos</option>
                                    <option value="CANCELED">Cancelados</option>
                                </select>
                            </div>
                            <div className="relative">
                                <Calendar className="absolute top-1/2 -translate-y-1/2 left-3 text-gray-400" size={20}/>
                                <input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)} className="block w-full pl-10 pr-3 py-2.5 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                            </div>
                        </div>
                    </div>

                    {loading ? <p className="text-center p-8">A carregar agendamentos...</p> : 
                     error ? <p className="text-center p-8 text-red-500">{error}</p> :
                     (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
                            {filteredAppointments.length === 0 ? (
                                <p className="text-center p-12 text-gray-500">Nenhum agendamento encontrado.</p>
                            ) : (
                                <>
                                    {/* Tabela para Desktop */}
                                    <table className="w-full text-sm hidden md:table">
                                        <thead className="bg-gray-50">
                                            <tr className="text-left text-gray-600">
                                                <th className="p-4 font-semibold">Cliente</th>
                                                <th className="p-4 font-semibold">Serviço</th>
                                                <th className="p-4 font-semibold">Data & Hora</th>
                                                <th className="p-4 font-semibold text-center">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {filteredAppointments.map(app => (
                                                <AppointmentRow key={app.id} appointment={app} onUpdateStatus={handleUpdateStatus} />
                                            ))}
                                        </tbody>
                                    </table>
                                    {/* Cards para Mobile */}
                                    <div className="divide-y divide-gray-200 md:hidden">
                                        {filteredAppointments.map(app => (
                                            <AppointmentCard key={app.id} appointment={app} onUpdateStatus={handleUpdateStatus} />
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                     )}
                </div>
            </main>
        </>
    );
}

// --- COMPONENTES DE ITEM ---

interface AppointmentItemProps {
    appointment: Appointment;
    onUpdateStatus: (id: number, status: AppointmentStatus) => void;
}

const AppointmentRow: React.FC<AppointmentItemProps> = ({ appointment, onUpdateStatus }) => {
    const { id, appointmentDate, status, user, post } = appointment;
    const date = new Date(appointmentDate);
    const formattedDate = date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
    const formattedTime = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    return (
        <tr className="hover:bg-gray-50">
            <td className="p-4">
                <div className="flex items-center gap-3">
                    <img src={user.image || `https://placehold.co/100x100/E2E8F0/4A5568?text=${user.name?.[0] || 'U'}`} alt={user.name} className="w-10 h-10 rounded-full object-cover" />
                    <span className="font-semibold text-gray-800">{user.name}</span>
                </div>
            </td>
            <td className="p-4 text-gray-600">{post.title}</td>
            <td className="p-4 text-gray-600">{formattedDate} às {formattedTime}</td>
            <td className="p-4 text-center">
                <StatusDropdown currentStatus={status} onUpdateStatus={(newStatus) => onUpdateStatus(id, newStatus)} />
            </td>
        </tr>
    );
};

const AppointmentCard: React.FC<AppointmentItemProps> = ({ appointment, onUpdateStatus }) => {
    const { id, appointmentDate, status, user, post } = appointment;
    const date = new Date(appointmentDate);
    const formattedDate = date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' });
    const formattedTime = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    return (
        <div className="p-4 space-y-3">
            <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                    <img src={user.image || `https://placehold.co/100x100/E2E8F0/4A5568?text=${user.name?.[0] || 'U'}`} alt={user.name} className="w-12 h-12 rounded-full object-cover" />
                    <div>
                        <p className="font-semibold text-gray-800">{user.name}</p>
                        <p className="text-sm text-gray-600 flex items-center gap-1.5"><Tag size={14} /> {post.title}</p>
                    </div>
                </div>
                 <StatusDropdown currentStatus={status} onUpdateStatus={(newStatus) => onUpdateStatus(id, newStatus)} />
            </div>
            <div className="flex items-center justify-between text-sm text-gray-700 pt-3 border-t">
                <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-gray-500" />
                    <span>{formattedDate}</span>
                </div>
                <div className="flex items-center gap-2">
                    <Clock size={16} className="text-gray-500" />
                    <span>{formattedTime}</span>
                </div>
            </div>
        </div>
    );
};

const StatusDropdown: React.FC<{ currentStatus: AppointmentStatus; onUpdateStatus: (status: AppointmentStatus) => void; }> = ({ currentStatus, onUpdateStatus }) => {
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    const statuses: { id: AppointmentStatus; text: string; icon: React.ElementType }[] = [
        { id: 'CONFIRMED', text: 'Confirmado', icon: Clock },
        { id: 'COMPLETED', text: 'Concluído', icon: CheckCircle },
        { id: 'CANCELED', text: 'Cancelado', icon: XCircle },
    ];

    const currentStatusInfo = statuses.find(s => s.id === currentStatus)!;
    const StatusIcon = currentStatusInfo.icon;

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) setIsOpen(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="relative w-full md:w-40" ref={ref}>
            <button onClick={() => setIsOpen(!isOpen)} className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg ${
                currentStatus === 'CONFIRMED' ? 'bg-blue-100 text-blue-800' :
                currentStatus === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                'bg-red-100 text-red-800'
            }`}>
                <div className="flex items-center gap-2">
                    <StatusIcon size={16} />
                    <span>{currentStatusInfo.text}</span>
                </div>
                <ChevronDown size={16} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <div className="absolute top-full mt-2 w-full bg-white rounded-lg shadow-lg z-10 border">
                    {statuses.map(status => (
                        <button
                            key={status.id}
                            onClick={() => {
                                onUpdateStatus(status.id);
                                setIsOpen(false);
                            }}
                            className="w-full text-left flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100"
                        >
                            <status.icon size={16} />
                            {status.text}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};
