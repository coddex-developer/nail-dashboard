import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { User, Calendar, Mail, Search, Trash2, MoreVertical } from 'lucide-react';
import Navbar from '../../utils/Navbar';
import { API_BASE_URL } from '../../utils/scripts/url';

// --- TIPOS ---
interface Client {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    createdAt: string;
}

// --- COMPONENTE PRINCIPAL ---
export default function ClientsManager() {
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchClients = async () => {
            setLoading(true);
            setError(null);
            const token = localStorage.getItem('admin_token');

            if (!token) {
                Swal.fire("Erro", "Sessão inválida. Por favor, faça login novamente.", "error");
                navigate('/admin');
                return;
            }

            try {
                const url = `${API_BASE_URL}/admin/users`;
                
                const res = await fetch(url, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (res.status === 401 || res.status === 403) {
                    throw new Error("Acesso não autorizado. Faça login novamente.");
                }
                if (!res.ok) {
                    throw new Error("Não foi possível carregar a lista de clientes.");
                }

                const data = await res.json();
                setClients(Array.isArray(data) ? data : []);
            } catch (err: any) {
                setError(err.message);
                if (err.message.includes("Acesso não autorizado")) {
                    navigate('/admin');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchClients();
    }, [navigate]);

    const filteredClients = useMemo(() => {
        return clients.filter(client =>
            client.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            client.email.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [clients, searchTerm]);

    const handleDelete = async (clientId: string, clientName: string | null) => {
        const result = await Swal.fire({
            title: `Excluir "${clientName || 'cliente'}"?`,
            text: "Esta ação é irreversível e todos os dados associados (como agendamentos) serão perdidos.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d33",
            cancelButtonText: "Cancelar",
            confirmButtonText: "Sim, excluir",
        });

        if (!result.isConfirmed) return;

        const token = localStorage.getItem('admin_token');
        if (!token) {
            Swal.fire("Erro", "Sessão expirada. Faça login novamente.", "error");
            navigate('/admin');
            return;
        }

        try {
            const res = await fetch(`${API_BASE_URL}/admin/users/${clientId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || "Não foi possível excluir o cliente.");
            }

            setClients(prevClients => prevClients.filter(c => c.id !== clientId));
            Swal.fire('Excluído!', 'O cliente foi removido com sucesso.', 'success');

        } catch (err: any) {
            Swal.fire('Erro!', err.message, 'error');
        }
    };

    return (
        <>
            <Navbar />
            <main className="min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-8">
                <div className="max-w-7xl mx-auto">
                    <header className="mb-8">
                        <h1 className="text-2xl font-semibold text-gray-800">Gerenciar Clientes</h1>
                        <p className="text-sm text-gray-500 mt-1">
                            {loading ? 'A carregar...' : `${filteredClients.length} de ${clients.length} clientes encontrados.`}
                        </p>
                    </header>

                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6 mb-8">
                        <div className="relative">
                            <Search className="absolute top-1/2 -translate-y-1/2 left-3 text-gray-400" size={20}/>
                            <input 
                                placeholder="Buscar por nome ou e-mail do cliente..." 
                                value={searchTerm} 
                                onChange={e => setSearchTerm(e.target.value)} 
                                className="block w-full pl-10 pr-3 py-2.5 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                            />
                        </div>
                    </div>

                    {loading ? (
                        <SkeletonLoader />
                    ) : error ? (
                        <p className="text-center p-8 text-red-500">{error}</p>
                    ) : (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                            {filteredClients.length === 0 ? (
                                <p className="text-center p-12 text-gray-500">Nenhum cliente encontrado.</p>
                            ) : (
                                <>
                                    <table className="w-full text-sm hidden md:table">
                                        <thead className="bg-gray-50">
                                            <tr className="text-left text-gray-600">
                                                <th className="p-4 font-semibold">Cliente</th>
                                                <th className="p-4 font-semibold">E-mail</th>
                                                <th className="p-4 font-semibold">Data de Cadastro</th>
                                                <th className="p-4 font-semibold text-right">Ações</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {filteredClients.map(client => (
                                                <ClientRow key={client.id} client={client} onDelete={handleDelete} />
                                            ))}
                                        </tbody>
                                    </table>
                                    <div className="divide-y divide-gray-200 md:hidden">
                                        {filteredClients.map(client => (
                                            <ClientCard key={client.id} client={client} onDelete={handleDelete} />
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

// --- COMPONENTES DE ITEM E SKELETON ---

interface ClientItemProps {
    client: Client;
    onDelete: (clientId: string, clientName: string | null) => void;
}

const ClientRow: React.FC<ClientItemProps> = ({ client, onDelete }) => {
    const registrationDate = new Date(client.createdAt).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    });

    return (
        <tr className="hover:bg-gray-50">
            <td className="p-4">
                <div className="flex items-center gap-3">
                    <img 
                        src={client.image || `https://ui-avatars.com/api/?name=${client.name || 'C'}&background=random`} 
                        alt={client.name || 'Cliente'} 
                        className="w-10 h-10 rounded-full object-cover" 
                    />
                    <span className="font-semibold text-gray-800">{client.name || 'Nome não informado'}</span>
                </div>
            </td>
            <td className="p-4 text-gray-600">{client.email}</td>
            <td className="p-4 text-gray-600">{registrationDate}</td>
            <td className="p-4 text-right">
                <button onClick={() => onDelete(client.id, client.name)} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors">
                    <Trash2 size={16} />
                </button>
            </td>
        </tr>
    );
};

const ClientCard: React.FC<ClientItemProps> = ({ client, onDelete }) => {
    const registrationDate = new Date(client.createdAt).toLocaleDateString('pt-BR');

    return (
        <div className="p-4">
            <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                    <img 
                        src={client.image || `https://ui-avatars.com/api/?name=${client.name || 'C'}&background=random`} 
                        alt={client.name || 'Cliente'} 
                        className="w-12 h-12 rounded-full object-cover" 
                    />
                    <div>
                        <p className="font-semibold text-gray-800">{client.name || 'Nome não informado'}</p>
                        <p className="text-sm text-gray-600 flex items-center gap-1.5"><Mail size={14} /> {client.email}</p>
                    </div>
                </div>
                <details className="relative">
                    <summary className="list-none cursor-pointer p-2 rounded-full hover:bg-gray-100">
                        <MoreVertical size={20} />
                    </summary>
                    <div className="absolute right-0 mt-2 w-32 bg-white rounded-xl shadow-lg z-10 border">
                        <button onClick={() => onDelete(client.id, client.name)} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                            <Trash2 size={14} /> Excluir
                        </button>
                    </div>
                </details>
            </div>
            <div className="flex items-center justify-end text-xs text-gray-500 pt-2 border-t">
                <div className="flex items-center gap-1.5">
                    <Calendar size={14} />
                    <span>Cadastrado em: {registrationDate}</span>
                </div>
            </div>
        </div>
    );
};

const SkeletonLoader = () => (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="divide-y divide-gray-200">
            {[...Array(5)].map((_, i) => (
                <div key={i} className="p-4 flex items-center gap-4 animate-pulse">
                    <div className="w-10 h-10 rounded-full bg-gray-200"></div>
                    <div className="flex-1 space-y-2">
                        <div className="h-4 w-1/3 bg-gray-200 rounded"></div>
                        <div className="h-3 w-1/2 bg-gray-200 rounded"></div>
                    </div>
                    <div className="h-4 w-1/4 bg-gray-200 rounded hidden md:block"></div>
                </div>
            ))}
        </div>
    </div>
);
