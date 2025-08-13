import { createBrowserRouter } from "react-router-dom";

// --- Páginas Públicas e de Cliente ---
import LandingPage from "./components/LandingPage";
import MyAppointments from "./components/client/pages/MyAppointments";

// --- Páginas do Painel de Administração ---
import Login from "./components/admin/pages/Login";
import Dashboard from "./components/admin/pages/Dashboard";
import CreateProduct from "./components/admin/pages/CreateProduct";
import ViewItens from "./components/admin/pages/ViewItens";
import CategoriesManager from "./components/admin/pages/CategoriesManager";
import AppointmentsManager from "./components/admin/pages/AppointmentsManager";
import AdminSettings from "./components/admin/pages/AdminSettings";
import ClientsManager from "./components/admin/pages/ClientsManager"; // NOVO: Importado
import ProtectedRoute from "./components/admin/auth/ProtectedRoute";

const routes = createBrowserRouter([
    // ===============================================
    // ROTAS PÚBLICAS E DE CLIENTES
    // ===============================================
    {
        path: "/",
        element: <LandingPage />,
    },
    {
        path: "/meus-agendamentos",
        element: <MyAppointments />,
    },

    // ===============================================
    // ROTAS DO PAINEL DE ADMINISTRAÇÃO
    // ===============================================
    {
        path: "/admin",
        element: <Login />,
    },
    {
        element: <ProtectedRoute />,
        children: [
            {
                path: "/admin/dashboard",
                element: <Dashboard />,
            },
            {
                path: "/admin/dashboard/produtos",
                element: <ViewItens />,
            },
            {
                path: "/admin/dashboard/produtos/novo",
                element: <CreateProduct />,
            },
            {
                path: "/admin/dashboard/categorias",
                element: <CategoriesManager />,
            },
            {
                path: "/admin/dashboard/agendamentos",
                element: <AppointmentsManager />,
            },
            // NOVO: Rota para gerenciar clientes
            {
                path: "/admin/dashboard/clientes",
                element: <ClientsManager />,
            },
            {
                path: "/admin/dashboard/configuracoes",
                element: <AdminSettings />,
            },
        ]
    }
]);

export default routes;
