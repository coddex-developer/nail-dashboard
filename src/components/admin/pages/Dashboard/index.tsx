import { CalendarClock, ClipboardCheck, ClipboardClock, User, ImageIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { UrlProducts } from "../../utils/scripts/url";
import Navbar from "../../utils/Navbar";

function normalizePublished(value) {
  // aceita boolean, string "true"/"false", number 1/0
  return value === true || value === "true" || value === 1 || value === "1";
}

function parseDate(value) {
  if (!value) return null;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

export default function Dashboard() {
  const [dataDb, setDataDb] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  async function databaseInfo() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(UrlProducts.allProducts);
      if (!response.ok) throw new Error(`Erro ${response.status}`);
      const data = await response.json();

      // normaliza os itens recebido do backend
      const normalized = Array.isArray(data)
        ? data.map((it) => ({
            ...it,
            published: normalizePublished(it.published),
            createdAt: parseDate(it.createdAt ?? it.created_at ?? it.date ?? it.created),
          }))
        : [];

      setDataDb(normalized);
    } catch (err) {
      console.error("Erro ao buscar dados:", err);
      setError("Não foi possível carregar os dados. Verifique o backend.");
      setDataDb([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    databaseInfo();
    // opcional: retornar uma função para limpar previews / URLs se necessário
  }, []);

  const publishedCount = dataDb.filter((i) => i.published).length;
  const unpublishedCount = dataDb.filter((i) => !i.published).length;
  const totalCount = dataDb.length;

  // mostra os últimos 6 produtos (ordenando por createdAt se disponível)
  const latestProducts = [...dataDb]
    .sort((a, b) => {
      const da = a.createdAt ? a.createdAt.getTime() : 0;
      const dbt = b.createdAt ? b.createdAt.getTime() : 0;
      return dbt - da;
    })
    .slice(0, 6);

  return (
    <>
    <Navbar />
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-gray-900">Dashboard</h1>
            <p className="text-sm text-gray-500 mt-1">Visão geral dos produtos e publicações</p>
          </div>

          <div className="text-right">
            <p className="text-sm text-gray-600">Total de produtos</p>
            <div className="mt-1 text-2xl font-bold text-gray-900">{totalCount}</div>
          </div>
        </header>

        {/* loading / error */}
        {loading ? (
          <div className="rounded-xl bg-white p-6 shadow-sm flex items-center justify-center">
            <div className="text-gray-600">Carregando dados...</div>
          </div>
        ) : error ? (
          <div className="rounded-xl bg-red-50 p-4 text-red-700">{error}</div>
        ) : (
          <>
            {/* Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-2xl p-5 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <CalendarClock className="text-blue-700" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-500">Horários marcados</p>
                  <div className="text-lg font-semibold text-gray-900">0</div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-5 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                  <User className="text-green-700" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-500">Novos clientes</p>
                  <div className="text-lg font-semibold text-gray-900">0</div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-5 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                  <ClipboardCheck className="text-purple-700" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-500">Itens publicados</p>
                  <div className="text-lg font-semibold text-gray-900">{publishedCount}</div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-5 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-cyan-100 flex items-center justify-center">
                  <ClipboardClock className="text-cyan-700" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-500">Itens não publicados</p>
                  <div className="text-lg font-semibold text-gray-900">{unpublishedCount}</div>
                </div>
              </div>
            </div>

            {/* Últimos produtos */}
            <section className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-gray-900">Últimos produtos</h2>
                <div className="text-sm text-gray-500">{latestProducts.length} exibidos</div>
              </div>

              {latestProducts.length === 0 ? (
                <div className="text-gray-500">Nenhum produto disponível.</div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {latestProducts.map((item) => {
                    const id = item.id ?? item._id ?? Math.random();
                    return (
                      <div key={id} className="flex items-center gap-4 rounded-lg border border-gray-100 p-3">
                        <div className="w-14 h-14 rounded-md overflow-hidden bg-gray-100 flex items-center justify-center">
                          {item.imageUrl || item.image ? (
                            <img src={item.imageUrl ?? item.image} alt={item.name ?? item.title} className="w-full h-full object-cover" />
                          ) : (
                            <ImageIcon className="text-gray-400" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium text-gray-900 truncate">{item.name ?? item.title ?? "Sem nome"}</div>
                              <div className="text-xs text-gray-500 truncate">{item.categoryName ?? item.category ?? "Sem categoria"}</div>
                            </div>
                            <div className="text-sm text-gray-500">{item.price ?? "—"}</div>
                          </div>

                          <div className="flex items-center gap-3 mt-2 text-xs">
                            <span className={`px-2 py-1 rounded-full text-xs ${item.published ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}>
                              {item.published ? "Publicado" : "Não publicado"}
                            </span>
                            <span className="text-gray-400">{item.createdAt ? item.createdAt.toLocaleString() : "—"}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
    </>
  );
}
