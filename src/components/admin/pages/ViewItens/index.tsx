import React, { useEffect, useMemo, useState, FormEvent, useRef } from "react";
import Swal from "sweetalert2";
import {
    Edit2,
    Trash2,
    Search,
    Filter,
    ImageIcon,
    Check,
    X,
    MoreVertical,
    CircleDollarSign,
    Clock
} from "lucide-react";
import { UrlProducts, UrlCategories } from "../../utils/scripts/url/index";
import Navbar from "../../utils/Navbar";
import { useNavigate } from "react-router-dom";
import { AvailabilityManager } from "../../utils/AvailabilityManager";

// --- TIPOS E CONFIGURAÇÕES ---
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

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
    content?: string;
    price: number;
    published: boolean | string;
    image: string;
    createdAt: string;
    categoryId: number;
    availability: Availability | null;
    newImageFile?: File;
}

const initialAvailability: Availability = {
    monday: [], tuesday: [], wednesday: [], thursday: [], friday: [], saturday: [], sunday: [],
};

export default function ViewItens() {
    const [items, setItems] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [q, setQ] = useState("");
    const [publishedFilter, setPublishedFilter] = useState("all");
    const [editOpen, setEditOpen] = useState(false);
    const [editItem, setEditItem] = useState<Product | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const navigate = useNavigate();

    const fetchItems = async () => {
        const token = localStorage.getItem('admin_token');
        if (!token) {
            Swal.fire("Erro", "Sessão inválida. Por favor, faça login novamente.", "error");
            navigate('/admin');
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(UrlProducts.allProducts, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.status === 401 || res.status === 403) throw new Error("Acesso não autorizado.");
            if (!res.ok) throw new Error(`Erro ao carregar produtos: ${res.statusText}`);
            const data = await res.json();
            setItems(Array.isArray(data) ? data : []);
        } catch (err: any) {
            console.error(err);
            setError("Não foi possível carregar os produtos.");
            if (err.message.includes("Acesso não autorizado")) navigate('/admin');
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        const token = localStorage.getItem('admin_token');
        if (!token) return;
        try {
            const res = await fetch(UrlCategories.allCategories, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error(`Erro ao carregar categorias: ${res.statusText}`);
            const data = await res.json();
            setCategories(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        Promise.all([fetchItems(), fetchCategories()]);
    }, []);

    const filteredItems = useMemo(() => {
        const qLower = q.trim().toLowerCase();
        return items.filter((item) => {
            const title = (item.title ?? "").toLowerCase();
            if (qLower && !title.includes(qLower)) return false;
            if (publishedFilter !== "all" && String(item.published) !== publishedFilter) return false;
            return true;
        });
    }, [items, q, publishedFilter]);

    const getCategoryNameById = (id: number) => {
        if (!id) return "Sem categoria";
        const found = categories.find((c) => c.id === id);
        return found?.name ?? "Categoria desconhecida";
    };

    const openEditModal = (item: Product) => {
        setEditItem({ ...item });
        setEditOpen(true);
    };

    const handleDelete = async (item: Product) => {
        const result = await Swal.fire({
            title: `Excluir "${item.title}"?`,
            text: "Essa ação não poderá ser desfeita.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d33",
            cancelButtonColor: "#3085d6",
            confirmButtonText: "Sim, excluir!",
            cancelButtonText: "Cancelar",
        });

        if (!result.isConfirmed) return;

        const token = localStorage.getItem('admin_token');
        if (!token) {
            Swal.fire("Erro", "Sessão expirada.", "error");
            navigate('/admin');
            return;
        }

        try {
            const res = await fetch(UrlProducts.deleteProduct(item.id), { 
                method: "DELETE",
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || `Erro ${res.status}`);
            }
            Swal.fire({ icon: "success", title: "Excluído!", text: "O item foi removido." });
            fetchItems();
        } catch (err: any) {
            Swal.fire({ icon: "error", title: "Erro ao excluir", text: err.message });
        }
    };

    const handleSave = async (updatedItem: Product) => {
        const token = localStorage.getItem('admin_token');
        if (!token) {
            Swal.fire("Erro", "Sessão expirada.", "error");
            navigate('/admin');
            return;
        }
        setIsSaving(true);
        try {
            const formData = new FormData();
            formData.append("title", updatedItem.title ?? "");
            formData.append("content", updatedItem.content ?? "");
            formData.append("price", String(updatedItem.price ?? "0"));
            formData.append("published", String(updatedItem.published));
            formData.append("availability", JSON.stringify(updatedItem.availability || initialAvailability));

            if (updatedItem.categoryId) {
                formData.append("categoryId", String(updatedItem.categoryId));
            }
            if (updatedItem.newImageFile) {
                formData.append("image", updatedItem.newImageFile);
            }

            const res = await fetch(UrlProducts.updateProduct(updatedItem.id), {
                method: "PUT",
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData,
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || `Erro ${res.status}`);
            }

            Swal.fire({ icon: "success", title: "Salvo!", text: "Item atualizado com sucesso." });
            setEditOpen(false);
            fetchItems();
        } catch (err: any) {
            Swal.fire({ icon: "error", title: "Erro ao salvar", text: err.message });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <>
            <Navbar />
            <div className="min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-8">
                <div className="max-w-7xl mx-auto">
                    <header className="mb-8">
                        <h1 className="text-2xl font-semibold text-gray-800">Meus Produtos</h1>
                        <p className="text-sm text-gray-500 mt-1">Visualize, edite e gerencie todos os seus itens cadastrados.</p>
                    </header>

                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6 mb-8">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="relative">
                                <Search className="absolute top-1/2 -translate-y-1/2 left-3 text-gray-400" size={20}/>
                                <input
                                    placeholder="Buscar por título..."
                                    value={q}
                                    onChange={(e) => setQ(e.target.value)}
                                    className="block w-full pl-10 pr-3 py-2.5 text-sm text-gray-900 bg-transparent rounded-lg border border-gray-300 focus:outline-none focus:ring-0 focus:border-blue-600"
                                />
                            </div>
                             <div className="relative">
                                <Filter className="absolute top-1/2 -translate-y-1/2 left-3 text-gray-400" size={20}/>
                                <select
                                    value={publishedFilter}
                                    onChange={(e) => setPublishedFilter(e.target.value)}
                                    className="block w-full pl-10 pr-3 py-2.5 text-sm text-gray-900 bg-transparent rounded-lg border border-gray-300 appearance-none focus:outline-none focus:ring-0 focus:border-blue-600"
                                >
                                    <option value="all">Todos os status</option>
                                    <option value="true">Publicados</option>
                                    <option value="false">Rascunhos</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {loading ? (
                        <div className="text-center p-10 text-gray-500">Carregando produtos...</div>
                    ) : error ? (
                        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md" role="alert">
                            <p className="font-bold">Erro</p>
                            <p>{error}</p>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            {filteredItems.length === 0 ? (
                                <div className="text-center p-10 bg-white rounded-2xl shadow-sm border border-gray-200">Nenhum item encontrado.</div>
                            ) : (
                                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                                     <div className="hidden md:block">
                                        <table className="w-full text-sm">
                                            <thead className="bg-gray-50">
                                                <tr className="text-left text-gray-600">
                                                    <th className="p-4 font-semibold">Produto</th>
                                                    <th className="p-4 font-semibold">Preço</th>
                                                    <th className="p-4 font-semibold">Status</th>
                                                    <th className="p-4 font-semibold">Categoria</th>
                                                    <th className="p-4 font-semibold text-right">Ações</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200">
                                                {filteredItems.map((item) => (
                                                    <ItemTableRow key={item.id} item={item} categoryName={getCategoryNameById(item.categoryId)} onEdit={openEditModal} onDelete={handleDelete} />
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="block md:hidden divide-y divide-gray-200">
                                        {filteredItems.map((item) => (
                                            <ItemCard key={item.id} item={item} categoryName={getCategoryNameById(item.categoryId)} onEdit={openEditModal} onDelete={handleDelete} />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {editOpen && editItem && (
                    <EditModal
                        item={editItem}
                        categories={categories}
                        isOpen={editOpen}
                        isSaving={isSaving}
                        onClose={() => setEditOpen(false)}
                        onSave={handleSave}
                    />
                )}
            </div>
        </>
    );
}

// --- COMPONENTES AUXILIARES ---

interface ItemProps {
    item: Product;
    categoryName: string;
    onEdit: (item: Product) => void;
    onDelete: (item: Product) => void;
}

function ItemTableRow({ item, categoryName, onEdit, onDelete }: ItemProps) {
    const imageUrl = `${API_BASE_URL}/${item.image}`;
    return (
        <tr className="hover:bg-gray-50">
            <td className="p-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                        {imageUrl ? <img src={imageUrl} alt={item.title} className="w-full h-full object-cover" /> : <ImageIcon size={24} className="m-auto text-gray-400" />}
                    </div>
                    <span className="font-medium text-gray-800">{item.title}</span>
                </div>
            </td>
            <td className="p-4 text-gray-700">R$ {parseFloat(String(item.price || 0)).toFixed(2)}</td>
            <td className="p-4">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${String(item.published) === 'true' ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}>
                    <span className={`h-2 w-2 rounded-full ${String(item.published) === 'true' ? "bg-green-500" : "bg-yellow-500"}`}></span>
                    {String(item.published) === 'true' ? "Publicado" : "Rascunho"}
                </span>
            </td>
            <td className="p-4 text-gray-700">{categoryName}</td>
            <td className="p-4 text-right">
                <div className="inline-flex items-center gap-2">
                    <button onClick={() => onEdit(item)} className="p-2 text-gray-500 hover:text-blue-600 hover:bg-gray-100 rounded-full"><Edit2 size={16} /></button>
                    <button onClick={() => onDelete(item)} className="p-2 text-gray-500 hover:text-red-600 hover:bg-gray-100 rounded-full"><Trash2 size={16} /></button>
                </div>
            </td>
        </tr>
    );
}

function ItemCard({ item, categoryName, onEdit, onDelete }: ItemProps) {
    const imageUrl = item.image ? `${API_BASE_URL}/${item.image}` : null;
    return (
        <div className="p-4">
            <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                         {imageUrl ? <img src={imageUrl} alt={item.title} className="w-full h-full object-cover" /> : <ImageIcon size={32} className="m-auto text-gray-400" />}
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-800">{item.title}</h3>
                        <p className="text-gray-600 font-semibold">R$ {parseFloat(String(item.price || 0)).toFixed(2)}</p>
                        <p className="text-xs text-gray-500 mt-1">{categoryName}</p>
                    </div>
                </div>
                <details className="relative">
                    <summary className="list-none cursor-pointer p-2 rounded-full hover:bg-gray-100"><MoreVertical size={20} className="text-gray-600" /></summary>
                    <div className="absolute right-0 mt-2 w-32 bg-white rounded-xl shadow-lg z-100 border border-gray-100">
                        <button onClick={() => onEdit(item)} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"><Edit2 size={14} /> Editar</button>
                        <button onClick={() => onDelete(item)} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50"><Trash2 size={14} /> Excluir</button>
                    </div>
                </details>
            </div>
            <div className="flex items-center justify-end text-sm mt-2">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${String(item.published) === 'true' ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}>
                    <span className={`h-2 w-2 rounded-full ${String(item.published) === 'true' ? "bg-green-500" : "bg-yellow-500"}`}></span>
                    {String(item.published) === 'true' ? "Publicado" : "Rascunho"}
                </span>
            </div>
        </div>
    );
}

interface EditModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (item: Product) => void;
    isSaving: boolean;
    item: Product;
    categories: Category[];
}

function EditModal({ isOpen, onClose, onSave, isSaving, item, categories }: EditModalProps) {
    const [localItem, setLocalItem] = useState<Product>({ ...item });
    const [previewUrl, setPreviewUrl] = useState<string | null>(item?.image ? `${API_BASE_URL}/${item.image}` : null);

    useEffect(() => {
        if (isOpen) {
            setLocalItem({ ...item, availability: item.availability || initialAvailability });
            setPreviewUrl(item?.image ? `${API_BASE_URL}/${item.image}` : null);
        }
    }, [item, isOpen]);

    const handleFieldChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const isCheckbox = type === 'checkbox';
        const checkedValue = (e.target as HTMLInputElement).checked;
        setLocalItem(prev => ({ ...prev, [name]: isCheckbox ? checkedValue : value }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setLocalItem(prev => ({ ...prev, newImageFile: file }));
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-150 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
            <div className="w-full max-w-4xl bg-gray-100 rounded-2xl shadow-xl transform transition-all" onClick={e => e.stopPropagation()}>
                 <header className="flex items-center justify-between p-4 sm:p-6 border-b bg-white rounded-t-2xl">
                    <h2 className="text-lg font-semibold text-gray-800">Editar Produto</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100"><X size={20} /></button>
                </header>

                <div className="p-4 sm:p-6 max-h-[75vh] overflow-y-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="relative">
                                    <input name="title" value={localItem.title ?? ''} onChange={handleFieldChange} className="block px-3.5 pb-2.5 pt-4 w-full text-sm text-gray-900 bg-transparent rounded-lg border border-gray-300 appearance-none focus:outline-none focus:ring-0 focus:border-blue-600 peer" placeholder=" " />
                                    <label className="absolute text-sm text-gray-500 duration-300 transform -translate-y-4 scale-75 top-2 z-10 origin-[0] bg-white px-2 peer-focus:px-2 peer-focus:text-blue-600 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-2 peer-focus:scale-75 peer-focus:-translate-y-4 start-1">Nome do Produto</label>
                                </div>
                                <div className="relative">
                                    <CircleDollarSign className="absolute top-1/2 -translate-y-1/2 left-3 text-gray-400" size={20}/>
                                    <input name="price" type="number" value={localItem.price ?? ''} onChange={handleFieldChange} className="block pl-10 pr-3 pb-2.5 pt-4 w-full text-sm text-gray-900 bg-transparent rounded-lg border border-gray-300 appearance-none focus:outline-none focus:ring-0 focus:border-blue-600 peer" placeholder=" " />
                                    <label className="absolute text-sm text-gray-500 duration-300 transform -translate-y-4 scale-75 top-2 z-10 origin-[0] bg-white px-2 peer-focus:px-2 peer-focus:text-blue-600 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-2 peer-focus:scale-75 peer-focus:-translate-y-4 start-1">Preço</label>
                                </div>
                            </div>
                            <textarea name="content" value={localItem.content ?? ''} onChange={handleFieldChange} rows={6} className="block p-2.5 w-full text-sm text-gray-900 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500" placeholder="Descrição do produto..."></textarea>
                        </div>
                        <div className="space-y-8">
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-4">
                                <h3 className="font-medium text-gray-900">Mídia</h3>
                                <div className="relative border-2 border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center justify-center text-center h-48">
                                    {previewUrl ? <img src={previewUrl} alt="Preview" className="w-full h-full object-contain rounded-md" /> : <ImageIcon size={40} className="text-gray-300" />}
                                </div>
                                <label htmlFor="image-upload-modal" className="w-full text-center cursor-pointer bg-gray-100 border border-gray-200 text-gray-700 rounded-lg px-4 py-2 text-sm hover:bg-gray-200 block">Trocar Imagem</label>
                                <input type="file" id="image-upload-modal" accept="image/*" onChange={handleFileChange} className="hidden" />
                            </div>
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-4">
                                <h3 className="font-medium text-gray-900">Organização</h3>
                                <select name="categoryId" value={localItem.categoryId ?? ''} onChange={handleFieldChange} className="block w-full p-2.5 text-sm text-gray-900 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500">
                                    <option value="">Sem Categoria</option>
                                    {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                                </select>
                                <div className="flex items-center justify-between pt-4 border-t">
                                    <label className="text-sm font-medium text-gray-900">Visibilidade</label>
                                    <input type="checkbox" name="published" checked={!!localItem.published} onChange={handleFieldChange} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                                </div>
                            </div>
                             <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
                                <div className="p-6 border-b border-gray-200"><h2 className="text-lg font-medium text-gray-900 flex items-center gap-2"><Clock size={18}/> Disponibilidade</h2></div>
                                <div className="p-6">
                                    <AvailabilityManager 
                                        availability={localItem.availability || initialAvailability} 
                                        setAvailability={(newAvailability) => setLocalItem(prev => ({...prev, availability: newAvailability}))} 
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <footer className="flex justify-end gap-3 p-4 bg-white/80 backdrop-blur-sm border-t rounded-b-2xl">
                    <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-full border bg-white text-sm font-semibold text-gray-800 hover:bg-gray-100">Cancelar</button>
                    <button onClick={() => onSave(localItem)} disabled={isSaving} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-transparent bg-blue-600 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:bg-blue-400">
                        {isSaving ? "Salvando..." : <><Check size={18} /> Salvar Alterações</>}
                    </button>
                </footer>
            </div>
        </div>
    );
}
