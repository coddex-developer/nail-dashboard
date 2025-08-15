import React, { useEffect, useState, FormEvent } from "react";
import Swal from "sweetalert2";
import { User, Lock, Phone, Link as LinkIcon, PlusCircle, Edit2, Trash2, Share2, AtSign } from "lucide-react";
import Navbar from "../../utils/Navbar";

// --- DEFINIÇÕES DE TIPO (TypeScript) ---
interface Contact {
    id: number;
    name: string;
    icon: string;
    urlContact: string;
}

interface TabButtonProps {
    id: string;
    activeTab: string;
    setActiveTab: (id: string) => void;
    label: string;
}

interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
    icon: React.ElementType;
    id: string;
    label: string;
}

interface ContactItemProps {
    contact: Contact;
    onEdit: () => void;
}


export default function AdminSettings() {
    const [activeTab, setActiveTab] = useState('account');

    return (
        <>
            <Navbar />
            <main className="min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-8">
                <div className="max-w-4xl mx-auto">
                    <header className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-800">Ajustes</h1>
                        <p className="text-md text-gray-500">Gerencie suas informações de conta e configurações do site.</p>
                    </header>

                    {/* Abas de Navegação */}
                    <div className="mb-6 border-b border-gray-200">
                        <nav className="-mb-px flex space-x-6">
                            <TabButton id="account" activeTab={activeTab} setActiveTab={setActiveTab} label="Minha Conta" />
                            <TabButton id="contacts" activeTab={activeTab} setActiveTab={setActiveTab} label="Contatos do Site" />
                        </nav>
                    </div>

                    {/* Conteúdo das Abas */}
                    <div>
                        {activeTab === 'account' && <AccountSettings />}
                        {activeTab === 'contacts' && <ContactsManager />}
                    </div>
                </div>
            </main>
        </>
    );
}

// --- COMPONENTES DAS ABAS ---

function TabButton({ id, activeTab, setActiveTab, label }: TabButtonProps) {
    const isActive = activeTab === id;
    return (
        <button
            onClick={() => setActiveTab(id)}
            className={`py-3 px-1 border-b-2 font-semibold text-sm transition-colors
                ${isActive
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
        >
            {label}
        </button>
    );
}

function AccountSettings() {
    // Lógica para buscar e atualizar dados do admin iria aqui
    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
            <header className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Informações Pessoais</h2>
            </header>
            <form className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InputField icon={User} id="admin-name" label="Nome de Usuário" defaultValue="Admin" />
                    <InputField icon={Phone} id="admin-phone" label="Telefone" placeholder="(XX) XXXXX-XXXX" />
                </div>
                <div className="pt-6 border-t">
                    <h3 className="text-md font-medium text-gray-900 mb-4">Alterar Senha</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <InputField icon={Lock} id="current-password" label="Senha Atual" type="password" />
                        <InputField icon={Lock} id="new-password" label="Nova Senha" type="password" />
                    </div>
                </div>
                <div className="flex justify-end pt-6 border-t">
                    <button type="submit" className="px-5 py-2.5 rounded-full bg-blue-600 text-sm font-semibold text-white shadow-sm hover:bg-blue-700">
                        Salvar Alterações
                    </button>
                </div>
            </form>
        </div>
    );
}

function ContactsManager() {
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [editingContact, setEditingContact] = useState<Partial<Contact> | null>(null); // null para novo, objeto para editar

    const fetchContacts = async () => {
        setLoading(true);
        try {
            // const res = await fetch(UrlContacts.allContacts);
            // if (!res.ok) throw new Error("Erro ao buscar contatos");
            // const data = await res.json();
            const mockData: Contact[] = [
                { id: 1, name: "WhatsApp", icon: "WhatsApp", urlContact: "https://wa.me/5511999999999" },
                { id: 2, name: "Instagram", icon: "Instagram", urlContact: "https://instagram.com/seuuser" }
            ];
            setContacts(mockData);
        } catch (err) {
            console.error(err);
            Swal.fire("Erro", "Não foi possível carregar os contatos.", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchContacts();
    }, []);

    const handleSave = (e: FormEvent) => {
        e.preventDefault();
        // Lógica de salvar (criar ou atualizar) iria aqui
        Swal.fire("Salvo!", "O contato foi salvo com sucesso.", "success");
        setEditingContact(null); // Fecha o formulário
    };

    return (
        <div className="space-y-8">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
                <header className="p-6 border-b border-gray-200 flex justify-between items-center">
                    <h2 className="text-lg font-medium text-gray-900">Contatos do Site</h2>
                    <button onClick={() => setEditingContact({})} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium shadow-sm">
                        <PlusCircle size={18} /> Novo Contato
                    </button>
                </header>
                <div className="p-4">
                    {loading ? <p className="text-center p-8">Carregando...</p> : (
                        <div className="divide-y divide-gray-100">
                            {contacts.map(contact => (
                                <ContactItem key={contact.id} contact={contact} onEdit={() => setEditingContact(contact)} />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {editingContact && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
                    <header className="p-6 border-b border-gray-200">
                        <h2 className="text-lg font-medium text-gray-900">{editingContact.id ? 'Editar Contato' : 'Novo Contato'}</h2>
                    </header>
                    <form onSubmit={handleSave} className="p-6 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <InputField icon={Share2} id="contact-name" label="Nome" defaultValue={editingContact.name} placeholder="Ex: WhatsApp" />
                            <InputField icon={AtSign} id="contact-icon" label="Ícone" defaultValue={editingContact.icon} placeholder="Nome do Ícone (Lucide)" />
                        </div>
                        <InputField icon={LinkIcon} id="contact-url" label="URL do Contato" defaultValue={editingContact.urlContact} placeholder="https://..." />
                        <div className="flex justify-end gap-3 pt-6 border-t">
                            <button type="button" onClick={() => setEditingContact(null)} className="px-5 py-2.5 rounded-full border bg-white text-sm font-semibold text-gray-800 hover:bg-gray-100">
                                Cancelar
                            </button>
                            <button type="submit" className="px-5 py-2.5 rounded-full bg-blue-600 text-sm font-semibold text-white shadow-sm hover:bg-blue-700">
                                Salvar Contato
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}

// --- COMPONENTES AUXILIARES ---

function InputField({ icon: Icon, id, label, ...props }: InputFieldProps) {
    return (
        <div className="relative">
            <Icon className="absolute top-1/2 -translate-y-1/2 left-3.5 text-gray-400" size={20} />
            <input id={id} {...props} className="block pl-11 pr-3 pb-2.5 pt-4 w-full text-sm text-gray-900 bg-transparent rounded-lg border border-gray-300 appearance-none focus:outline-none focus:ring-0 focus:border-blue-600 peer" placeholder=" " />
            <label htmlFor={id} className="absolute text-sm text-gray-500 duration-300 transform -translate-y-4 scale-75 top-2 z-10 origin-[0] bg-white px-2 peer-focus:px-2 peer-focus:text-blue-600 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-2 peer-focus:scale-75 peer-focus:-translate-y-4 start-1">{label}</label>
        </div>
    );
}

function ContactItem({ contact, onEdit }: ContactItemProps) {
    return (
        <div className="flex items-center gap-4 p-4">
            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                <Share2 size={20} className="text-gray-500" />
            </div>
            <div className="flex-1">
                <p className="font-semibold text-gray-800">{contact.name}</p>
                <p className="text-xs text-blue-600 truncate">{contact.urlContact}</p>
            </div>
            <div className="flex items-center gap-2">
                <button onClick={onEdit} className="p-2 text-gray-500 hover:text-blue-600 hover:bg-gray-100 rounded-full"><Edit2 size={16} /></button>
                <button className="p-2 text-gray-500 hover:text-red-600 hover:bg-gray-100 rounded-full"><Trash2 size={16} /></button>
            </div>
        </div>
    );
}
