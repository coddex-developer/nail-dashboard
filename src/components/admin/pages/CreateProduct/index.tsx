import React, { useState, useRef, useEffect, FormEvent } from "react";
import Swal from "sweetalert2";
import { UploadCloud, PlusCircle, Check, X, Text, CircleDollarSign, LayoutGrid, Eye, Clock, Trash2 } from "lucide-react";
import { UrlProducts, UrlCategories } from "../../utils/scripts/url/index";
import Navbar from "../../utils/Navbar";
import { useNavigate } from "react-router-dom";
import { AvailabilityManager } from "../../utils/AvailabilityManager";

// --- DEFINIÇÕES DE TIPO ---
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

// --- COMPONENTE PRINCIPAL ---
export default function CreateProduct() {
    const [title, setTitle] = useState("");
    const [price, setPrice] = useState("");
    const [content, setContent] = useState("");
    const [published, setPublished] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [dragOver, setDragOver] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);
    const [categoriesLoading, setCategoriesLoading] = useState(true);
    const [availability, setAvailability] = useState<Availability>({
        monday: [], tuesday: [], wednesday: [], thursday: [], friday: [], saturday: [], sunday: [],
    });
    const navigate = useNavigate();

    useEffect(() => {
        const fetchCategoriesData = async () => {
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
                if (!res.ok) throw new Error("Erro ao buscar categorias");
                const data = await res.json();
                setCategories(Array.isArray(data) ? data : []);
            } catch (err) {
                console.error(err);
            } finally {
                setCategoriesLoading(false);
            }
        };

        fetchCategoriesData();
    }, [navigate]);

    const handleFileSelect = (selectedFile: File | null) => {
        if (!selectedFile) {
            setFile(null);
            if (preview) URL.revokeObjectURL(preview);
            setPreview(null);
            if (fileRef.current) fileRef.current.value = "";
            return;
        }
        setFile(selectedFile);
        setPreview(URL.createObjectURL(selectedFile));
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setDragOver(false);
        const droppedFile = e.dataTransfer?.files?.[0];
        if (droppedFile && droppedFile.type.startsWith('image/')) {
            handleFileSelect(droppedFile);
        }
    };

    const handleCreateCategory = async () => {
        const { value: name } = await Swal.fire({
            title: "Criar Nova Categoria",
            input: "text",
            inputPlaceholder: "Ex: Eletrônicos",
            showCancelButton: true,
            confirmButtonText: "Criar",
            cancelButtonText: "Cancelar",
            inputValidator: (v) => (!v || !v.trim() ? "O nome é obrigatório." : null),
        });

        if (!name) return;

        const token = localStorage.getItem('admin_token');
        if (!token) {
            Swal.fire("Erro", "Sessão expirada. Por favor, faça login novamente.", "error");
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
            const newCategory = await res.json();
            if (!res.ok) throw new Error(newCategory.message || `Erro ${res.status}`);
            
            Swal.fire({ icon: "success", title: "Criada!", text: "A nova categoria foi adicionada." });
            
            setCategories(prev => [...prev, newCategory]);
            setSelectedCategory(String(newCategory.id));
        } catch (err: any) {
            Swal.fire({ icon: "error", title: "Erro", text: err.message });
        }
    };

    const clearForm = () => {
        setTitle("");
        setPrice("");
        setContent("");
        setPublished(true);
        handleFileSelect(null);
        setSelectedCategory("");
        setAvailability({ monday: [], tuesday: [], wednesday: [], thursday: [], friday: [], saturday: [], sunday: [] });
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !price.trim() || !selectedCategory || !file) {
            Swal.fire("Atenção", "Título, preço, categoria e imagem são obrigatórios.", "warning");
            return;
        }
        
        const token = localStorage.getItem('admin_token');
        if (!token) {
            Swal.fire("Erro", "Sessão expirada. Por favor, faça login novamente.", "error");
            navigate('/admin');
            return;
        }

        setIsLoading(true);

        const formData = new FormData();
        formData.append("title", title);
        formData.append("price", price);
        formData.append("content", content);
        formData.append("published", String(published));
        formData.append("categoryId", selectedCategory);
        formData.append("availability", JSON.stringify(availability));
        formData.append("image", file);

        try {
            const res = await fetch(UrlProducts.createProduct, {
                method: "POST",
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData,
            });
            if (res.status === 401 || res.status === 403) {
                throw new Error("Sessão inválida. Faça login novamente.");
            }
            const responseData = await res.json();
            if (!res.ok) throw new Error(responseData.message || "Erro ao criar produto");
            
            Swal.fire("Sucesso!", "Produto criado com sucesso.", "success");
            clearForm();
        } catch (err: any) {
            Swal.fire("Erro", err.message, "error");
            if(err.message.includes("Sessão inválida")) {
                navigate('/admin');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <Navbar />
            <form onSubmit={handleSubmit} className="min-h-screen bg-gray-100">
                <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 pb-28 lg:pb-8">
                    <header className="mb-8">
                        <h1 className="text-2xl font-semibold text-gray-800">Criar novo produto</h1>
                        <p className="text-sm text-gray-500 mt-1">Adicione os detalhes do produto, imagem e horários.</p>
                    </header>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-200">
                            <div className="p-6 border-b border-gray-200">
                                <h2 className="text-lg font-medium text-gray-900">Detalhes do Produto</h2>
                            </div>
                            <div className="p-6 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="relative">
                                        <input id="title" value={title} onChange={(e) => setTitle(e.target.value)} className="block px-3.5 pb-2.5 pt-4 w-full text-sm text-gray-900 bg-transparent rounded-lg border border-gray-300 appearance-none focus:outline-none focus:ring-0 focus:border-blue-600 peer" placeholder=" " required />
                                        <label htmlFor="title" className="absolute text-sm text-gray-500 duration-300 transform -translate-y-4 scale-75 top-2 z-10 origin-[0] bg-white px-2 peer-focus:px-2 peer-focus:text-blue-600 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-2 peer-focus:scale-75 peer-focus:-translate-y-4 start-1">Nome do Produto</label>
                                    </div>
                                    <div className="relative">
                                        <CircleDollarSign className="absolute top-1/2 -translate-y-1/2 left-3 text-gray-400" size={20} />
                                        <input id="price" type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} className="block pl-10 pr-3 pb-2.5 pt-4 w-full text-sm text-gray-900 bg-transparent rounded-lg border border-gray-300 appearance-none focus:outline-none focus:ring-0 focus:border-blue-600 peer" placeholder=" " required />
                                        <label htmlFor="price" className="absolute text-sm text-gray-500 duration-300 transform -translate-y-4 scale-75 top-2 z-10 origin-[0] bg-white px-2 peer-focus:px-2 peer-focus:text-blue-600 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-2 peer-focus:scale-75 peer-focus:-translate-y-4 start-1">Preço</label>
                                    </div>
                                </div>
                                <div>
                                    <label htmlFor="content" className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                        <Text size={16} /> Descrição
                                    </label>
                                    <textarea id="content" value={content} onChange={(e) => setContent(e.target.value)} rows={8} className="block p-2.5 w-full text-sm text-gray-900 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500" placeholder="Descreva os detalhes..."></textarea>
                                </div>
                                <div className="flex items-center pt-4 border-t border-gray-200">
                                    <Eye size={16} className="text-gray-600 mr-3" />
                                    <label htmlFor="published" className="text-sm font-medium text-gray-900">Visibilidade</label>
                                    <div className="ml-auto">
                                        <label htmlFor="published-toggle" className="inline-flex relative items-center cursor-pointer">
                                            <input type="checkbox" id="published-toggle" className="sr-only peer" checked={published} onChange={(e) => setPublished(e.target.checked)} />
                                            <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-8">
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
                                <div className="p-6 border-b border-gray-200"><h2 className="text-lg font-medium text-gray-900">Mídia</h2></div>
                                <div className="p-6">
                                    <div onDragOver={(e) => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onDrop={handleDrop} className={`relative border-2 border-dashed ${dragOver ? "border-blue-500 bg-blue-50" : "border-gray-300"} rounded-xl p-6 flex flex-col items-center justify-center text-center h-56 transition`}>
                                        {preview ? (<> <img src={preview} alt="Preview" className="w-full h-full object-contain rounded-md" /> <button type="button" onClick={() => handleFileSelect(null)} className="absolute top-2 right-2 p-1.5 bg-white/80 rounded-full text-gray-700 hover:bg-white shadow-md"><X size={18} /></button> </>
                                        ) : (<div className="text-center"> <UploadCloud size={40} className="text-gray-400 mx-auto mb-3" /> <label htmlFor="file-upload" className="font-semibold text-blue-600 hover:underline cursor-pointer">Adicionar imagem</label> <p className="text-xs text-gray-500 mt-1">ou arraste e solte</p> </div>)}
                                        <input id="file-upload" ref={fileRef} type="file" accept="image/*" onChange={(e) => handleFileSelect(e.target.files?.[0] ?? null)} className="hidden" />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
                                <div className="p-6 border-b border-gray-200"><h2 className="text-lg font-medium text-gray-900">Organização</h2></div>
                                <div className="p-6 space-y-6">
                                    <div>
                                        <label htmlFor="category" className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2"><LayoutGrid size={16}/> Categoria</label>
                                        <div className="flex items-center gap-2">
                                            <select id="category" value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="block w-full p-2.5 text-sm text-gray-900 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500" required>
                                                <option value="" disabled>Selecione...</option>
                                                {categoriesLoading ? <option disabled>Carregando...</option> : categories.map(cat => (<option key={cat.id} value={cat.id}>{cat.name}</option>))}
                                            </select>
                                            <button type="button" onClick={handleCreateCategory} className="p-2.5 bg-gray-100 rounded-lg hover:bg-gray-200 text-gray-600">
                                                <PlusCircle size={20} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
                                <div className="p-6 border-b border-gray-200"><h2 className="text-lg font-medium text-gray-900 flex items-center gap-2"><Clock size={18}/> Disponibilidade</h2></div>
                                <div className="p-6">
                                    <AvailabilityManager availability={availability} setAvailability={setAvailability} />
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="hidden lg:flex items-center justify-end gap-3 pt-8 mt-8 border-t border-gray-200">
                        <button type="button" onClick={clearForm} className="px-5 py-2.5 rounded-full border bg-white text-sm font-semibold text-gray-800 hover:bg-gray-100">Limpar</button>
                        <button type="submit" disabled={isLoading} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-transparent bg-blue-600 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:bg-blue-400">
                            {isLoading ? "A publicar..." : <><Check size={18} /> Publicar produto</>}
                        </button>
                    </div>
                </div>

                <footer className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-sm border-t border-gray-200">
                    <div className="max-w-6xl mx-auto p-4 flex items-center justify-end gap-3">
                        <button type="button" onClick={clearForm} className="px-5 py-2.5 rounded-full border bg-white text-sm font-semibold text-gray-800 hover:bg-gray-100">Limpar</button>
                        <button type="submit" disabled={isLoading} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-transparent bg-blue-600 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:bg-blue-400">
                            {isLoading ? "A publicar..." : <><Check size={18} /> Publicar</>}
                        </button>
                    </div>
                </footer>
            </form>
        </>
    );
}
