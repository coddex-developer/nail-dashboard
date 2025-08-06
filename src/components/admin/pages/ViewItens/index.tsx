// ViewItens.jsx
import { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import {
    Edit2,
    Trash2,
    Search,
    Calendar,
    Filter,
    ImageIcon,
    Check,
    X
} from "lucide-react";
import { UrlProducts, UrlCategories } from "../../utils/scripts/url/index"; // ajuste o path se precisar
import Navbar from "../../utils/Navbar";

export default function ViewItens() {
    const [items, setItems] = useState([]); // produtos
    const [categories, setCategories] = useState([]); // categorias
    const [loading, setLoading] = useState(false);
    const [catLoading, setCatLoading] = useState(false);
    const [error, setError] = useState(null);

    // filtros
    const [q, setQ] = useState("");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [publishedFilter, setPublishedFilter] = useState("all"); // all | published | unpublished

    // modal edição
    const [editOpen, setEditOpen] = useState(false);
    const [editItem, setEditItem] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    // fetch inicial
    async function fetchItems() {
        setLoading(true);
        try {
            const res = await fetch(UrlProducts.allProducts);
            if (!res.ok) throw new Error(`Erro ${res.status}`);
            const data = await res.json();
            setItems(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error(err);
            setError("Não foi possível carregar produtos.");
            Swal.fire({ icon: "error", title: "Erro", text: "Não foi possível carregar produtos." });
        } finally {
            setLoading(false);
        }
    }

    async function fetchCategories() {
        setCatLoading(true);
        try {
            const res = await fetch(UrlCategories.allCategories);
            if (!res.ok) throw new Error(`Erro ${res.status}`);
            const data = await res.json();
            setCategories(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error(err);
            Swal.fire({ icon: "error", title: "Erro", text: "Não foi possível carregar categorias." });
        } finally {
            setCatLoading(false);
        }
    }

    useEffect(() => {
        fetchItems();
        fetchCategories();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // helper: extrair data de um item (várias convenções possíveis)
    function getItemDate(item) {
        if (!item) return null;
        const possible = item.createdAt ?? item.created_at ?? item.date ?? item.created ?? null;
        if (!possible) return null;
        const d = new Date(possible);
        if (isNaN(d.getTime())) return null;
        return d;
    }

    // filtro e pesquisa (memoizado)
    const filtered = useMemo(() => {
        const qLower = q.trim().toLowerCase();

        return items.filter((it) => {
            // search by name/title
            const name = (it.name ?? it.title ?? "").toString().toLowerCase();
            if (qLower && !name.includes(qLower)) return false;

            // date filter
            const d = getItemDate(it);
            if (dateFrom) {
                const from = new Date(dateFrom);
                if (!d || d < from) return false;
            }
            if (dateTo) {
                // include the to-date entire day
                const to = new Date(dateTo);
                to.setHours(23, 59, 59, 999);
                if (!d || d > to) return false;
            }

            // published filter
            if (publishedFilter === "published" && !(it.published === true || it.published === "true" || it.published === 1)) return false;
            if (publishedFilter === "unpublished" && (it.published === true || it.published === "true" || it.published === 1)) return false;

            return true;
        });
    }, [items, q, dateFrom, dateTo, publishedFilter]);

    // agrupa por categoriaId (categoria vazia => 'uncategorized')
    const grouped = useMemo(() => {
        const map = new Map();
        filtered.forEach((it) => {
            const catId = it.categoryId ?? it.category ?? it.category_id ?? "uncategorized";
            if (!map.has(catId)) map.set(catId, []);
            map.get(catId).push(it);
        });
        return map; // Map<catId, items[]>
    }, [filtered]);

    // obter nome da categoria por id
    function getCategoryNameById(id) {
        if (!id || id === "uncategorized") return "Sem categoria";
        const found = categories.find((c) => String(c.id ?? c._id ?? c.value) === String(id));
        return found ? (found.name ?? found.title ?? "Sem nome") : "Sem categoria";
    }

    // abrir modal edição
    function openEdit(item) {
        setEditItem({
            // clone to avoid mutating original until save
            ...item,
            // normalize published boolean
            published: item.published === true || item.published === "true" || item.published === 1,
            // previewUrl if exists
            previewUrl: item.imageUrl ?? item.image ?? item.thumbnail ?? null
        });
        setEditOpen(true);
    }

    // excluir item
    async function handleDelete(item) {
        const id = item.id ?? item._id ?? item._ID ?? item.ID;
        if (!id) {
            Swal.fire({ icon: "error", title: "Erro", text: "Item sem ID" });
            return;
        }

        const result = await Swal.fire({
            title: `Excluir "${item.name ?? item.title ?? 'item'}"?`,
            text: "Essa ação não poderá ser desfeita.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Excluir",
            cancelButtonText: "Cancelar"
        });

        if (!result.isConfirmed) return;

        try {
            Swal.fire({ title: "Excluindo...", didOpen: () => Swal.showLoading() });
            const res = await fetch((UrlProducts.deleteProduct ?? (UrlProducts.deleteProduct + "")) + id, {
                method: "DELETE"
            });

            if (!res.ok) {
                const txt = await res.text();
                throw new Error(txt || `Erro ${res.status}`);
            }

            Swal.fire({ icon: "success", title: "Excluído", text: "Item excluído com sucesso." });
            // recarregar lista
            await fetchItems();
        } catch (err) {
            console.error(err);
            Swal.fire({ icon: "error", title: "Erro", text: "Não foi possível excluir o item." });
        }
    }

    // salvar edição (envia FormData)
    async function handleSaveEdit(updated) {
        const id = updated.id ?? updated._id ?? updated.ID;
        if (!id) {
            Swal.fire({ icon: "error", title: "Erro", text: "ID ausente" });
            return;
        }

        setIsSaving(true);
        try {
            const form = new FormData();
            form.append("title", updated.title ?? "");
            form.append("price", updated.price ?? "");
            form.append("content", updated.content ?? "");
            form.append("published", updated.published ? "true" : "false");
            // category id if exists
            if (updated.categoryId) form.append("categoryId", String(updated.categoryId));
            // image file
            if (updated.newImageFile) form.append("image", updated.newImageFile);

            const url = (UrlProducts.updateProduct ?? (UrlProducts.updateProduct + "")) + id;
            const res = await fetch(url, {
                method: "PUT",
                body: form
            });

            if (!res.ok) {
                const text = await res.text();
                throw new Error(text || `Erro ${res.status}`);
            }

            await res.json();
            Swal.fire({ icon: "success", title: "Atualizado", text: "Item atualizado com sucesso." });
            setEditOpen(false);
            setEditItem(null);
            fetchItems();
        } catch (err) {
            console.error(err);
            Swal.fire({ icon: "error", title: "Erro", text: "Falha ao atualizar item." });
        } finally {
            setIsSaving(false);
        }
    }

    // --- Renderização ---
    return (
        <>
        <Navbar />
        <div className="min-h-screen p-6 bg-gray-50">
            <div className="max-w-6xl mx-auto space-y-4">
                <header className="flex items-center justify-between">
                    <h1 className="text-2xl font-semibold text-gray-900">Ver itens</h1>

                    {/* barra de busca e filtros */}
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-1 shadow-sm">
                            <Search size={16} className="text-gray-500" />
                            <input
                                placeholder="Buscar por nome..."
                                value={q}
                                onChange={(e) => setQ(e.target.value)}
                                className="outline-none text-sm"
                                aria-label="Buscar por nome"
                            />
                        </div>

                        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-2 py-1 shadow-sm">
                            <Calendar size={16} />
                            <input
                                type="date"
                                value={dateFrom}
                                onChange={(e) => setDateFrom(e.target.value)}
                                className="text-sm outline-none"
                                aria-label="Data de"
                                title="Data inicial"
                            />
                            <span className="text-sm text-gray-400 px-1">—</span>
                            <input
                                type="date"
                                value={dateTo}
                                onChange={(e) => setDateTo(e.target.value)}
                                className="text-sm outline-none"
                                aria-label="Data até"
                                title="Data final"
                            />
                        </div>

                        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-2 py-1 shadow-sm">
                            <Filter size={16} />
                            <select
                                value={publishedFilter}
                                onChange={(e) => setPublishedFilter(e.target.value)}
                                className="text-sm outline-none bg-transparent"
                                aria-label="Filtrar por publicado"
                            >
                                <option value="all">Todos</option>
                                <option value="published">Publicado</option>
                                <option value="unpublished">Não publicado</option>
                            </select>
                        </div>
                    </div>
                </header>

                {/* loading / error */}
                {loading ? (
                    <div className="p-6 bg-white rounded-lg shadow text-center">Carregando...</div>
                ) : error ? (
                    <div className="p-6 bg-red-50 rounded-lg text-red-600">{error}</div>
                ) : (
                    <>
                        {/* tabela agrupada por categoria */}
                        {[...grouped.keys()].length === 0 ? (
                            <div className="p-6 bg-white rounded-lg shadow text-center">Nenhum item encontrado.</div>
                        ) : (
                            <div className="space-y-6">
                                {[...grouped.keys()].map((catId) => {
                                    const groupItems = grouped.get(catId) ?? [];
                                    const catName = getCategoryNameById(catId);
                                    return (
                                        <section key={catId} className="bg-white rounded-lg shadow p-4">
                                            <div className="flex items-center justify-between border-b pb-2 mb-3">
                                                <h3 className="font-semibold text-gray-800">{catName} <span className="text-sm text-gray-500">({groupItems.length})</span></h3>
                                                <div className="text-sm text-gray-500">{/* opcional ações de grupo */}</div>
                                            </div>

                                            <div className="overflow-x-auto">
                                                <table className="w-full text-sm table-auto">
                                                    <thead>
                                                        <tr className="text-left text-gray-600 border-b">
                                                            <th className="p-2">Produto</th>
                                                            <th className="p-2">Preço</th>
                                                            <th className="p-2">Publicado</th>
                                                            <th className="p-2">Data</th>
                                                            <th className="p-2 text-right">Ações</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {groupItems.map((it) => {
                                                            const id = it.id ?? it._id ?? it.ID;
                                                            const date = getItemDate(it);
                                                            return (
                                                                <tr key={id ?? Math.random()} className="border-b last:border-none">
                                                                    <td className="p-2">
                                                                        <div className="flex items-center gap-3">
                                                                            <div className="w-12 h-12 bg-gray-100 rounded overflow-hidden flex items-center justify-center">
                                                                                {it.imageUrl || it.image ? (
                                                                                    <img src={it.imageUrl ?? it.image} alt={it.name ?? it.title} className="w-full h-full object-cover" />
                                                                                ) : (
                                                                                    <ImageIcon size={18} className="text-gray-400" />
                                                                                )}
                                                                            </div>
                                                                            <div>
                                                                                <div className="font-medium text-gray-800">{it.name ?? it.title ?? "Sem nome"}</div>
                                                                                <div className="text-xs text-gray-500">{it.sku ? `SKU: ${it.sku}` : ""}</div>
                                                                            </div>
                                                                        </div>
                                                                    </td>

                                                                    <td className="p-2">{it.price ?? "—"}</td>
                                                                    <td className="p-2">
                                                                        {it.published === true || it.published === "true" || it.published === 1 ? (
                                                                            <span className="inline-flex items-center gap-1 text-green-700 bg-green-50 px-2 py-1 rounded text-xs">
                                                                                <Check size={12} /> Publicado
                                                                            </span>
                                                                        ) : (
                                                                            <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 px-2 py-1 rounded text-xs">
                                                                                Não publicado
                                                                            </span>
                                                                        )}
                                                                    </td>
                                                                    <td className="p-2">{date ? date.toLocaleString() : "—"}</td>
                                                                    <td className="p-2 text-right">
                                                                        <div className="inline-flex items-center gap-2">
                                                                            <button
                                                                                title="Editar"
                                                                                onClick={() => openEdit(it)}
                                                                                className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100"
                                                                            >
                                                                                <Edit2 size={14} /> Editar
                                                                            </button>

                                                                            <button
                                                                                title="Excluir"
                                                                                onClick={() => handleDelete(it)}
                                                                                className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-red-50 text-red-700 hover:bg-red-100"
                                                                            >
                                                                                <Trash2 size={14} /> Excluir
                                                                            </button>
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </section>
                                    );
                                })}
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* --- Modal de edição (react modal simples) --- */}
            {editOpen && editItem && (
                <EditModal
                    item={editItem}
                    setItem={setEditItem}
                    categories={categories}
                    loading={isSaving}
                    onClose={() => { setEditOpen(false); setEditItem(null); }}
                    onSave={(updated) => handleSaveEdit(updated)}
                />
            )}
        </div>
        </>
    );
}

/* -----------------------------
   Componente EditModal (interno)
   ----------------------------- */
function EditModal({ item, setItem, categories, loading, onClose, onSave }) {
    // item: objeto clonável
    const [local, setLocal] = useState({ ...item });
    const [preview, setPreview] = useState(local.previewUrl ?? null);

    useEffect(() => {
        setLocal({ ...item });
        setPreview(item.previewUrl ?? item.imageUrl ?? item.image ?? null);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [item]);

    function handleFileChange(e) {
        const f = e.target.files?.[0] ?? null;
        if (f) {
            setLocal((s) => ({ ...s, newImageFile: f }));
            setPreview(URL.createObjectURL(f));
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="w-full max-w-2xl bg-white rounded-2xl shadow-lg p-6 space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Editar item</h3>
                    <div className="flex gap-2">
                        <button onClick={onClose} className="rounded-full p-2 hover:bg-gray-100"><X size={16} /></button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2 space-y-3">
                        <label className="block">
                            <span className="text-sm text-gray-600">Título</span>
                            <input value={local.title ?? local.name ?? ""} onChange={(e) => setLocal({ ...local, title: e.target.value, name: e.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2" />
                        </label>

                        <label className="block">
                            <span className="text-sm text-gray-600">Preço</span>
                            <input value={local.price ?? ""} onChange={(e) => setLocal({ ...local, price: e.target.value })} className="mt-1 w-48 rounded-lg border px-3 py-2" />
                        </label>

                        <label className="block">
                            <span className="text-sm text-gray-600">Descrição</span>
                            <textarea value={local.content ?? ""} onChange={(e) => setLocal({ ...local, content: e.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2 min-h-[100px]"></textarea>
                        </label>

                        <label className="block">
                            <span className="text-sm text-gray-600">Categoria</span>
                            <select value={local.categoryId ?? local.category ?? ""} onChange={(e) => setLocal({ ...local, categoryId: e.target.value })} className="mt-1 rounded-lg border px-3 py-2 w-full">
                                <option value="">— Sem categoria —</option>
                                {categories.map((c) => (
                                    <option key={c.id ?? c._id ?? c.value} value={c.id ?? c._id ?? c.value}>
                                        {c.name ?? c.title ?? "Sem nome"}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <label className="inline-flex items-center gap-2 mt-2">
                            <input type="checkbox" checked={local.published === true || local.published === "true" || local.published === 1} onChange={(e) => setLocal({ ...local, published: e.target.checked })} />
                            <span className="text-sm text-gray-700">Publicar</span>
                        </label>
                    </div>

                    <div className="space-y-3">
                        <div className="rounded-lg border p-3 bg-gray-50 flex flex-col items-center gap-3">
                            {preview ? (
                                <img src={preview} alt="preview" className="w-full h-36 object-cover rounded" />
                            ) : (
                                <div className="w-full h-36 flex items-center justify-center text-gray-400">
                                    <ImageIcon size={36} />
                                </div>
                            )}

                            <div className="w-full flex gap-2">
                                <label className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 bg-white border rounded cursor-pointer">
                                    <ImageIcon size={16} /> Trocar imagem
                                    <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                                </label>

                                <button type="button" onClick={() => { setLocal({ ...local, newImageFile: null }); setPreview(null); }} className="px-3 py-2 border rounded">Remover</button>
                            </div>
                        </div>

                        <div className="text-sm text-gray-500">
                            ID: <span className="text-xs text-gray-400">{local.id ?? local._id ?? "—"}</span>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-2">
                    <button onClick={onClose} className="px-4 py-2 rounded border">Cancelar</button>
                    <button
                        onClick={() => onSave(local)}
                        disabled={loading}
                        className="px-4 py-2 rounded bg-blue-600 text-white inline-flex items-center gap-2"
                    >
                        {loading ? "Salvando..." : (<><Check size={14} /> Salvar</>)}
                    </button>
                </div>
            </div>
        </div>
    );
}
