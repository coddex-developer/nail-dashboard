import React, { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import {
  Menu,
  X,
  Bell,
  Store,
  Settings,
  Home,
  List,
  PlusCircle,
  Tags,
  User,
  ChevronDown,
  AlertCircle,
} from "lucide-react";

/**
 * Navbar responsivo com:
 * - Dropdown "Loja" (Dashboard, Ver Itens, Criar Produto, Categorias)
 * - Dropdown "Ajustes" (Ajuste Admin, Ajuste API de pagamento -> mostra "Em breve")
 * - Ícone de notificações com popup (Swal)
 * - Drawer mobile com mesmo conteúdo
 *
 * Ajuste rotas (paths) conforme seu router.
 */
export default function Navbar() {
  const navigate = useNavigate();

  // estados de UI
  const [mobileOpen, setMobileOpen] = useState(false);
  const [storeOpen, setStoreOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [hasUnread, setHasUnread] = useState(false);

  // mock de notificações — substitua por fetch real se quiser
  useEffect(() => {
    // Exemplo: carregar notificações do backend (aqui com mock)
    async function load() {
      try {
        // const res = await fetch("/api/notifications");
        // const data = await res.json();
        const data = [
          // exemplo
          // { id: 1, title: "Novo pedido", message: "Pedido #123 recebido", date: "2025-08-01T12:00:00Z", read: false }
        ];
        setNotifications(data);
        setHasUnread(data.some((n) => !n.read));
      } catch (err) {
        console.error("Erro notificações:", err);
        setNotifications([]);
        setHasUnread(false);
      }
    }
    load();
  }, []);

  // abrir popup de notificações
  function openNotifications() {
    if (!notifications || notifications.length === 0) {
      Swal.fire({
        title: "Notificações",
        icon: "info",
        text: "Não há novas notificações.",
        confirmButtonText: "Fechar",
        customClass: { popup: "rounded-md" },
      });
      return;
    }

    // criar um HTML simples com últimas notificações
    const html = notifications
      .slice(0, 6)
      .map(
        (n) =>
          `<div style="margin-bottom:8px; padding-bottom:8px; border-bottom:1px solid #eee">
            <strong style="display:block">${escapeHtml(n.title ?? "Sem título")}</strong>
            <small style="color:#666">${escapeHtml(n.message ?? "")}</small>
          </div>`
      )
      .join("");

    Swal.fire({
      title: "Notificações",
      html: `<div style="max-height:300px; overflow:auto; text-align:left">${html}</div>`,
      confirmButtonText: "Fechar",
      customClass: { popup: "rounded-md" },
    }).then(() => {
      // opcional: marcar como lidas (se implementado no backend)
      setHasUnread(false);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    });
  }

  // função util para escapar HTML em strings de notificação
  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  // handlers de navegação
  function go(path) {
    setMobileOpen(false);
    navigate(path);
  }

  // handler "em breve"
  function showComingSoon(featureName = "Recurso") {
    Swal.fire({
      title: "Em breve",
      text: `${featureName} será adicionado em breve.`,
      icon: "info",
      confirmButtonText: "OK",
      customClass: { popup: "rounded-md" },
    });
  }

  return (
    <nav className="bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* esquerda: logo + desktop menu */}
          <div className="flex items-center">
            {/* Mobile menu button */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="inline-flex items-center p-2 rounded-md text-gray-600 md:hidden"
              aria-label="Abrir menu"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            <div className="flex items-center gap-3 ml-2">
              <div
                className="cursor-pointer flex items-center gap-2"
                onClick={() => go("/dashboard")}
                title="Home"
              >
                <div className="w-8 h-8 rounded-md bg-blue-600 text-white flex items-center justify-center">
                  <Home size={16} />
                </div>
                <span className="hidden sm:inline-block font-semibold text-gray-900">Meu App</span>
              </div>

              {/* Desktop menu */}
              <div className="hidden md:flex items-center gap-1 ml-6">
                {/* Loja dropdown */}
                <div className="relative">
                  <button
                    onClick={() => {
                      setStoreOpen((s) => !s);
                      setSettingsOpen(false);
                    }}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-50 text-gray-700"
                  >
                    <Store size={16} />
                    <span className="text-sm">Loja</span>
                    <ChevronDown size={14} />
                  </button>

                  {storeOpen && (
                    <div className="absolute left-0 mt-2 w-48 bg-white border border-gray-100 rounded-md shadow-lg z-40">
                      <ul className="py-1">
                        <li>
                          <button onClick={() => go("/dashboard")} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2">
                            <Home size={14} /> Dashboard
                          </button>
                        </li>
                        <li>
                          <button onClick={() => go("/view-itens")} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2">
                            <List size={14} /> Ver Itens
                          </button>
                        </li>
                        <li>
                          <button onClick={() => go("/create-product")} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2">
                            <PlusCircle size={14} /> Criar Produto
                          </button>
                        </li>
                        <li>
                          <button onClick={() => go("/categories")} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2">
                            <Tags size={14} /> Categorias
                          </button>
                        </li>
                      </ul>
                    </div>
                  )}
                </div>

                {/* Ajustes dropdown */}
                <div className="relative">
                  <button
                    onClick={() => {
                      setSettingsOpen((s) => !s);
                      setStoreOpen(false);
                    }}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-50 text-gray-700"
                  >
                    <Settings size={16} />
                    <span className="text-sm">Ajustes</span>
                    <ChevronDown size={14} />
                  </button>

                  {settingsOpen && (
                    <div className="absolute left-0 mt-2 w-56 bg-white border border-gray-100 rounded-md shadow-lg z-40">
                      <ul className="py-1">
                        <li>
                          <button onClick={() => go("/admin/settings")} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2">
                            <User size={14} /> Ajuste Admin
                          </button>
                        </li>
                        <li>
                          <button onClick={() => showComingSoon("Ajuste API de pagamento")} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2">
                            <AlertCircle size={14} /> Ajuste API de pagamento
                          </button>
                        </li>
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* direita: ações */}
          <div className="flex items-center gap-3">
            {/* notificações */}
            <div className="relative">
              <button
                onClick={openNotifications}
                className="relative inline-flex items-center p-2 rounded-md hover:bg-gray-50 text-gray-600"
                aria-label="Notificações"
              >
                <Bell size={18} />
                {hasUnread && (
                  <span className="absolute -top-0.5 -right-0.5 inline-flex items-center justify-center px-1.5 py-0.5 text-xs rounded-full bg-red-600 text-white">
                    {/* simples marcador */}
                    {/* pode usar quantidade: notifications.length */}
                    !
                  </span>
                )}
              </button>
            </div>

            {/* avatar / perfil */}
            <div className="hidden sm:flex items-center gap-2">
              <div className="flex flex-col text-right mr-2">
                <span className="text-sm font-medium text-gray-900">Admin</span>
                <span className="text-xs text-gray-500">Super Admin</span>
              </div>
              <div
                className="h-9 w-9 rounded-full bg-gray-200 flex items-center justify-center cursor-pointer"
                title="Perfil"
                onClick={() => go("/admin/profile")}
              >
                <User size={16} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden">
          <div className="pt-2 pb-4 space-y-1 px-2">
            <NavMobileItem onClick={() => go("/dashboard")} icon={<Home size={16} />} label="Dashboard" />
            <NavMobileItem onClick={() => go("/view-itens")} icon={<List size={16} />} label="Ver Itens" />
            <NavMobileItem onClick={() => go("/create-product")} icon={<PlusCircle size={16} />} label="Criar Produto" />
            <NavMobileItem onClick={() => go("/categories")} icon={<Tags size={16} />} label="Categorias" />

            <div className="border-t border-gray-100 mt-2 pt-2">
              <div className="px-2 text-sm text-gray-500 mb-1">Ajustes</div>
              <NavMobileItem onClick={() => go("/admin/settings")} icon={<User size={16} />} label="Ajuste Admin" />
              <NavMobileItem onClick={() => showComingSoon("Ajuste API de pagamento")} icon={<AlertCircle size={16} />} label="Ajuste API de pagamento" />
            </div>

            <div className="mt-3 px-2">
              <button
                onClick={openNotifications}
                className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-md border border-gray-200"
              >
                <Bell size={16} /> Ver notificações
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

/* componente pequeno para item mobile - evita repetição */
function NavMobileItem({ icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-50 text-left text-gray-700"
    >
      <span className="w-6 h-6 flex items-center justify-center">{icon}</span>
      <span className="flex-1">{label}</span>
    </button>
  );
}
