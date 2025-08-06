// CategoriesManager.jsx
import React, { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import { PlusCircle, Edit2, Trash2, Tag, Search, Calendar, Filter } from "lucide-react";
import { UrlCategories } from "../../utils/scripts/url/index"; // ajuste o path conforme seu projeto
import Navbar from "../../utils/Navbar";

export default function CategoriesManager() {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // filtros / pesquisa (igual ao ViewItens)
    const [q, setQ] = useState("");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [showFilter, setShowFilter] = useState("all"); // all | withProducts | withoutProducts

    // fetch inicial
    async function fetchCategories() {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(UrlCategories.allCategories);
            if (!res.ok) throw new Error(`Erro ${res.status}`);
            const data = await res.json();
            // normaliza createdAt (aceita createdAt / created_at / date)
            const normalized = Array.isArray(data)
                ? data.map((c) => ({
                    ...c,
                    createdAt: parseDate(c.createdAt ?? c.created_at ?? c.date ?? c.created),
                    productsCount: c.count ?? c.productsCount ?? c._count?.products ?? c.productsCount ?? null,
                }))
                : [];
            setCategories(normalized);
        } catch (err) {
            console.error("Erro ao buscar categorias:", err);
            setError("Não foi possível carregar categorias.");
            setCategories([]);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchCategories();
    }, []);

    // util parse date
    function parseDate(value) {
        if (!value) return null;
        const d = new Date(value);
        return isNaN(d.getTime()) ? null : d;
    }

    // filtros aplicados no frontend (memoizado)
    const filtered = useMemo(() => {
        const qLower = q.trim().toLowerCase();

        return categories.filter((c) => {
            // busca por nome
            const name = String(c.name ?? c.title ?? "").toLowerCase();
            if (qLower && !name.includes(qLower)) return false;

            // filtro por data
            const d = c.createdAt;
            if (dateFrom) {
                const from = new Date(dateFrom);
                if (!d || d < from) return false;
            }
            if (dateTo) {
                const to = new Date(dateTo);
                to.setHours(23, 59, 59, 999);
                if (!d || d > to) return false;
            }

            // filtro por produtos vinculados
            if (showFilter === "withProducts") {
                // se productsCount existir e >0, passa; se não existir, tenta interpretar lista vazia (não confiável)
                if (!(Number(c.productsCount) > 0)) return false;
            } else if (showFilter === "withoutProducts") {
                if (Number(c.productsCount) > 0) return false;
            }

            return true;
        });
    }, [categories, q, dateFrom, dateTo, showFilter]);

    // criar categoria (Swal)
    async function handleCreateCategory() {
        const { value: name } = await Swal.fire({
            title: "Criar nova categoria",
            input: "text",
            inputLabel: "Nome da categoria",
            inputPlaceholder: "Ex: Climatizadores",
            showCancelButton: true,
            confirmButtonText: "Criar",
            cancelButtonText: "Cancelar",
            inputValidator: (v) => (!v || !v.trim() ? "Digite um nome válido" : null),
            customClass: { popup: "rounded-md" },
        });

        if (!name) return;
        try {
            Swal.fire({ title: "Criando...", didOpen: () => Swal.showLoading() });
            const res = await fetch(UrlCategories.createCategory, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: name.trim() }),
            });
            if (!res.ok) {
                const text = await res.text();
                throw new Error(text || `Erro ${res.status}`);
            }
            await res.json();
            Swal.fire({ icon: "success", title: "Criada", text: `Categoria "${name}" criada.` });
            await fetchCategories();
        } catch (err) {
            console.error(err);
            Swal.fire({ icon: "error", title: "Erro", text: "Não foi possível criar a categoria." });
        }
    }

    // editar categoria
    async function handleEditCategory(cat) {
        const currentName = cat.name ?? cat.title ?? "";
        const { value: newName } = await Swal.fire({
            title: "Editar categoria",
            input: "text",
            inputLabel: "Nome da categoria",
            inputValue: currentName,
            showCancelButton: true,
            confirmButtonText: "Salvar",
            cancelButtonText: "Cancelar",
            inputValidator: (v) => (!v || !v.trim() ? "Digite um nome válido" : null),
            customClass: { popup: "rounded-md" },
        });

        if (!newName || newName.trim() === currentName) return;

        try {
            Swal.fire({ title: "Salvando...", didOpen: () => Swal.showLoading() });
            const id = cat.id ?? cat._id ?? cat.value;
            const res = await fetch((UrlCategories.updateCategory || UrlCategories.updateCategory + "") + id, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: newName.trim() }),
            });
            if (!res.ok) {
                const text = await res.text();
                throw new Error(text || `Erro ${res.status}`);
            }
            await res.json();
            Swal.fire({ icon: "success", title: "Atualizada", text: `Categoria atualizada para "${newName}".` });
            await fetchCategories();
        } catch (err) {
            console.error(err);
            Swal.fire({ icon: "error", title: "Erro", text: "Não foi possível atualizar a categoria." });
        }
    }

    // excluir categoria com aviso de exclusão em cascata
    async function handleDeleteCategory(cat) {
        const name = cat.name ?? cat.title ?? "esta categoria";
        const id = cat.id ?? cat._id ?? cat.value;

        const confirmed = await Swal.fire({
            title: `Excluir "${name}"?`,
            html: `<p>Ao excluir esta categoria, <strong>todos os produtos vinculados a ela serão excluídos também</strong>. Esta ação <strong>não pode ser desfeita</strong>.</p><p class="mt-2 text-sm text-gray-600">Deseja continuar?</p>`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Excluir e remover produtos",
            cancelButtonText: "Cancelar",
            focusCancel: true,
            customClass: { popup: "rounded-md" },
        });

        if (!confirmed.isConfirmed) return;

        try {
            Swal.fire({ title: "Excluindo...", didOpen: () => Swal.showLoading() });
            const res = await fetch((UrlCategories.deleteCategory || UrlCategories.deleteCategory + "") + id, {
                method: "DELETE",
            });
            if (!res.ok) {
                const text = await res.text();
                throw new Error(text || `Erro ${res.status}`);
            }
            await res.json();
            Swal.fire({ icon: "success", title: "Excluída", text: `Categoria "${name}" excluída.` });
            await fetchCategories();
        } catch (err) {
            console.error(err);
            Swal.fire({ icon: "error", title: "Erro", text: "Não foi possível excluir a categoria." });
        }
    }

    // layout responsivo: pesquisa + botões
    return (
        <>
        <Navbar />
        <div className="min-h-screen p-6 bg-gray-50">
            <div className="max-w-5xl mx-auto space-y-6">
                <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Tag className="text-gray-700" />
                        <div>
                            <h1 className="text-2xl font-semibold text-gray-900">Categorias</h1>
                            <p className="text-sm text-gray-500">Gerencie suas categorias — criar, editar e excluir</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleCreateCategory}
                            className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                        >
                            <PlusCircle size={16} /> Nova categoria
                        </button>
                    </div>
                </header>

                {/* filtros / pesquisa (responsivo) */}
                <div className="bg-white rounded-lg p-4 shadow-sm">
                    <div className="flex flex-col md:flex-row md:items-center md:gap-3 gap-3">
                        {/* busca por nome */}
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                            <div className="inline-flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 w-full">
                                <Search size={16} className="text-gray-500" />
                                <input
                                    placeholder="Buscar por nome..."
                                    value={q}
                                    onChange={(e) => setQ(e.target.value)}
                                    className="outline-none text-sm w-full"
                                />
                            </div>
                        </div>

                        {/* intervalo de datas */}
                        <div className="flex items-center gap-2">
                            <div className="inline-flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-2 py-2">
                                <Calendar size={16} className="text-gray-500" />
                                <input
                                    type="date"
                                    value={dateFrom}
                                    onChange={(e) => setDateFrom(e.target.value)}
                                    className="text-sm outline-none"
                                    aria-label="Data desde"
                                />
                                <span className="px-1 text-gray-400">—</span>
                                <input
                                    type="date"
                                    value={dateTo}
                                    onChange={(e) => setDateTo(e.target.value)}
                                    className="text-sm outline-none"
                                    aria-label="Data até"
                                />
                            </div>
                        </div>

                        {/* filtro mostrar */}
                        <div className="inline-flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2">
                            <Filter size={16} />
                            <select
                                value={showFilter}
                                onChange={(e) => setShowFilter(e.target.value)}
                                className="text-sm outline-none bg-transparent"
                            >
                                <option value="all">Todos</option>
                                <option value="withProducts">Com produtos</option>
                                <option value="withoutProducts">Sem produtos</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* conteúdo */}
                {loading ? (
                    <div className="rounded-xl bg-white p-6 shadow-sm text-center">Carregando categorias...</div>
                ) : error ? (
                    <div className="rounded-xl bg-red-50 p-4 text-red-700">{error}</div>
                ) : (
                    <div className="bg-white rounded-2xl p-4 shadow-sm">
                        {filtered.length === 0 ? (
                            <div className="text-gray-500 p-6 text-center">Nenhuma categoria encontrada.</div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm table-auto">
                                    <thead>
                                        <tr className="text-left text-gray-600 border-b">
                                            <th className="p-3">Categoria</th>
                                            <th className="p-3">Produtos vinculados</th>
                                            <th className="p-3">Criada em</th>
                                            <th className="p-3 text-right">Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filtered.map((c) => {
                                            const count = c.productsCount ?? "—";
                                            return (
                                                <tr key={c.id ?? c._id ?? c.value} className="border-b last:border-none">
                                                    <td className="p-3">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-9 h-9 rounded-md bg-gray-100 flex items-center justify-center">
                                                                <Tag size={16} className="text-gray-500" />
                                                            </div>
                                                            <div>
                                                                <div className="font-medium text-gray-900">{c.name ?? c.title ?? "Sem nome"}</div>
                                                                <div className="text-xs text-gray-500">{String(c.id ?? c._id ?? "")}</div>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    <td className="p-3">{count}</td>
                                                    <td className="p-3">{c.createdAt ? c.createdAt.toLocaleDateString() : "—"}</td>

                                                    <td className="p-3 text-right">
                                                        <div className="inline-flex gap-2 justify-end w-full">
                                                            <button
                                                                onClick={() => handleEditCategory(c)}
                                                                className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100 text-sm"
                                                            >
                                                                <Edit2 size={14} /> Editar
                                                            </button>

                                                            <button
                                                                onClick={() => handleDeleteCategory(c)}
                                                                className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-red-50 text-red-700 hover:bg-red-100 text-sm"
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
                        )}
                    </div>
                )}
            </div>
        </div>
        </>
    );
}
