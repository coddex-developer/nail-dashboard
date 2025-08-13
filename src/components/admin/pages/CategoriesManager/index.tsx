import React, { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import { PlusCircle, Edit2, Trash2, Tag, Search, Filter, MoreVertical } from "lucide-react";
import { UrlCategories } from "../../utils/scripts/url/index";
import Navbar from "../../utils/Navbar";
import { useNavigate } from "react-router-dom";

// --- TIPOS ---
interface Category {
    id: number;
    name: string;
    createdAt: string;
    _count?: {
        posts: number;
    };
    posts?: any[];
}

type FilterType = "all" | "withProducts" | "withoutProducts";

// --- COMPONENTE PRINCIPAL ---
export default function CategoriesManager() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [q, setQ] = useState("");
    const [showFilter, setShowFilter] = useState<FilterType>("all");
    const navigate = useNavigate();

    const fetchCategories = async () => {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem('admin_token');
        if (!token) {
            Swal.fire("Erro", "Sessão inválida. Por favor, faça login novamente.", "error");
            navigate('/admin');
            return;
        }

        try {
            const res = await fetch(UrlCategories.allCategories, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.status === 401 || res.status === 403) throw new Error("Acesso não autorizado.");
            if (!res.ok) throw new Error(`Erro ao carregar categorias: ${res.statusText}`);
            const data = await res.json();
            setCategories(Array.isArray(data) ? data : []);
        } catch (err: any) {
            console.error("Erro ao buscar categorias:", err);
            setError(err.message || "Não foi possível carregar as categorias.");
            if (err.message.includes("Acesso não autorizado")) navigate('/admin');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    const filteredCategories = useMemo(() => {
        const qLower = q.trim().toLowerCase();
        return categories.filter((c) => {
            const name = String(c.name ?? "").toLowerCase();
            if (qLower && !name.includes(qLower)) return false;

            const productsCount = c._count?.posts ?? c.posts?.length ?? 0;
            if (showFilter === "withProducts" && productsCount === 0) return false;
            if (showFilter === "withoutProducts" && productsCount > 0) return false;

            return true;
        });
    }, [categories, q, showFilter]);

    const handleCreate = async () => {
        const { value: name } = await Swal.fire({
            title: "Criar Nova Categoria",
            input: "text",
            inputPlaceholder: "Ex: Cabelo",
            showCancelButton: true,
            confirmButtonText: "Criar",
            cancelButtonText: "Cancelar",
            inputValidator: (v) => (!v || !v.trim() ? "O nome é obrigatório." : null),
        });

        if (!name) return;

        const token = localStorage.getItem('admin_token');
        if (!token) {
            Swal.fire("Erro", "Sessão expirada.", "error");
            navigate('/admin');
            return;
        }

        try {
            const res = await fetch(UrlCategories.createCategory, {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ name: name.trim() }),
            });
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || `Erro ${res.status}`);
            }
            Swal.fire({ icon: "success", title: "Criada!", text: "A nova categoria foi adicionada." });
            fetchCategories();
        } catch (err: any) {
            Swal.fire({ icon: "error", title: "Erro", text: err.message });
        }
    };

    const handleEdit = async (cat: Category) => {
        const { value: newName } = await Swal.fire({
            title: "Editar Categoria",
            input: "text",
            inputValue: cat.name,
            showCancelButton: true,
            confirmButtonText: "Salvar",
            cancelButtonText: "Cancelar",
            inputValidator: (v) => (!v || !v.trim() ? "O nome é obrigatório." : null),
        });

        if (!newName || newName.trim() === cat.name) return;

        const token = localStorage.getItem('admin_token');
        if (!token) {
            Swal.fire("Erro", "Sessão expirada.", "error");
            navigate('/admin');
            return;
        }

        try {
            const res = await fetch(UrlCategories.updateCategory(cat.id), {
                method: "PUT",
                headers: { 
                    "Content-Type": "application/json",
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ name: newName.trim() }),
            });
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || `Erro ${res.status}`);
            }
            Swal.fire({ icon: "success", title: "Atualizada!", text: "A categoria foi salva com sucesso." });
            fetchCategories();
        } catch (err: any) {
            Swal.fire({ icon: "error", title: "Erro", text: err.message });
        }
    };

    const handleDelete = async (cat: Category) => {
        const result = await Swal.fire({
            title: `Excluir "${cat.name}"?`,
            html: `Todos os produtos vinculados também serão removidos.<br/><strong>Esta ação é irreversível.</strong>`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d33",
            cancelButtonColor: "#3085d6",
            confirmButtonText: "Sim, excluir",
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
            const res = await fetch(UrlCategories.deleteCategory(cat.id), { 
                method: "DELETE",
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || `Erro ${res.status}`);
            }
            Swal.fire({ icon: "success", title: "Excluída!", text: "A categoria e seus produtos foram removidos." });
            fetchCategories();
        } catch (err: any) {
            Swal.fire({ icon: "error", title: "Erro", text: err.message });
        }
    };

    return (
        <>
            <Navbar />
            <div className="min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-8">
                <div className="max-w-5xl mx-auto">
                    <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                        <div>
                            <h1 className="text-2xl font-semibold text-gray-800">Gerenciar Categorias</h1>
                            <p className="text-sm text-gray-500 mt-1">Crie, edite e organize as categorias dos seus produtos.</p>
                        </div>
                        <button onClick={handleCreate} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium shadow-sm transition">
                            <PlusCircle size={18} /> Nova Categoria
                        </button>
                    </header>

                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6 mb-8">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="relative">
                                <Search className="absolute top-1/2 -translate-y-1/2 left-3 text-gray-400" size={20}/>
                                <input placeholder="Buscar por nome..." value={q} onChange={(e) => setQ(e.target.value)} className="block w-full pl-10 pr-3 py-2.5 text-sm text-gray-900 bg-transparent rounded-lg border border-gray-300 focus:outline-none focus:ring-0 focus:border-blue-600" />
                            </div>
                             <div className="relative">
                                <Filter className="absolute top-1/2 -translate-y-1/2 left-3 text-gray-400" size={20}/>
                                <select value={showFilter} onChange={(e) => setShowFilter(e.target.value as FilterType)} className="block w-full pl-10 pr-3 py-2.5 text-sm text-gray-900 bg-transparent rounded-lg border border-gray-300 appearance-none focus:outline-none focus:ring-0 focus:border-blue-600">
                                    <option value="all">Mostrar todas</option>
                                    <option value="withProducts">Com produtos</option>
                                    <option value="withoutProducts">Sem produtos</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {loading ? (
                        <div className="text-center p-10 text-gray-500">Carregando categorias...</div>
                    ) : error ? (
                        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md" role="alert">
                            <p className="font-bold">Erro</p><p>{error}</p>
                        </div>
                    ) : (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                            {filteredCategories.length === 0 ? (
                                <div className="text-center p-10 text-gray-500">Nenhuma categoria encontrada.</div>
                            ) : (
                                <>
                                    <table className="w-full text-sm hidden md:table">
                                        <thead className="bg-gray-50">
                                            <tr className="text-left text-gray-600">
                                                <th className="p-4 font-semibold">Categoria</th>
                                                <th className="p-4 font-semibold">Produtos</th>
                                                <th className="p-4 font-semibold">Criada em</th>
                                                <th className="p-4 font-semibold text-right">Ações</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {filteredCategories.map((cat) => (
                                                <CategoryRow key={cat.id} category={cat} onEdit={handleEdit} onDelete={handleDelete} />
                                            ))}
                                        </tbody>
                                    </table>
                                    <div className="divide-y divide-gray-200 md:hidden">
                                        {filteredCategories.map((cat) => (
                                            <CategoryCard key={cat.id} category={cat} onEdit={handleEdit} onDelete={handleDelete} />
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

// --- COMPONENTES DE ITEM ---

interface CategoryItemProps {
    category: Category;
    onEdit: (cat: Category) => void;
    onDelete: (cat: Category) => void;
}

function CategoryRow({ category, onEdit, onDelete }: CategoryItemProps) {
    const productsCount = category._count?.posts ?? category.posts?.length ?? 0;
    const creationDate = category.createdAt ? new Date(category.createdAt).toLocaleDateString('pt-BR') : "—";
    
    return (
        <tr className="hover:bg-gray-50">
            <td className="p-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <Tag size={20} className="text-gray-500" />
                    </div>
                    <span className="font-medium text-gray-800">{category.name}</span>
                </div>
            </td>
            <td className="p-4 text-gray-600">{productsCount}</td>
            <td className="p-4 text-gray-600">{creationDate}</td>
            <td className="p-4 text-right">
                <div className="inline-flex items-center gap-2">
                    <button onClick={() => onEdit(category)} className="p-2 text-gray-500 hover:text-blue-600 hover:bg-gray-100 rounded-full"><Edit2 size={16} /></button>
                    <button onClick={() => onDelete(category)} className="p-2 text-gray-500 hover:text-red-600 hover:bg-gray-100 rounded-full"><Trash2 size={16} /></button>
                </div>
            </td>
        </tr>
    );
}

function CategoryCard({ category, onEdit, onDelete }: CategoryItemProps) {
    const productsCount = category._count?.posts ?? category.posts?.length ?? 0;
    return (
        <div className="p-4">
            <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <Tag size={20} className="text-gray-500" />
                    </div>
                    <span className="font-medium text-gray-800">{category.name}</span>
                </div>
                <details className="relative">
                    <summary className="list-none cursor-pointer p-2 rounded-full hover:bg-gray-100"><MoreVertical size={20} /></summary>
                    <div className="absolute right-0 mt-2 w-32 bg-white rounded-xl shadow-lg z-10 border">
                        <button onClick={() => onEdit(category)} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm hover:bg-gray-100">
                            <Edit2 size={14} /> Editar
                        </button>
                        <button onClick={() => onDelete(category)} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                            <Trash2 size={14} /> Excluir
                        </button>
                    </div>
                </details>
            </div>
            <div className="mt-2 flex justify-between items-center text-sm text-gray-500">
                <span>Produtos: <strong>{productsCount}</strong></span>
                <span>Criada em: <strong>{new Date(category.createdAt).toLocaleDateString('pt-BR')}</strong></span>
            </div>
        </div>
    );
}
