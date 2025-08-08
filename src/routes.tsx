import { createBrowserRouter } from "react-router-dom";
import Login from "./components/admin/pages/Login";
import Dashboard from "./components/admin/pages/Dashboard";
import ViewItens from "./components/admin/pages/ViewItens";
import CategoriesManager from "./components/admin/pages/CategoriesManager";
import AdminSettings from "./components/admin/pages/AdminSettings";
import LandingPage from "./components/LandingPage";
import CreateProduct from "./components/admin/pages/CreateProduct";
import AppointmentsManager from "./components/admin/pages/AppointmentsManager";
import MyAppointments from "./components/client/pages/MyAppointments";

const routes = createBrowserRouter([
    {
        path: "/admin",
        element: <Login />
    },
    {
        path: "/dashboard",
        element: <Dashboard />
    },
    {
        path: "/create-product",
        element: < CreateProduct />
    },
    {
        path: "/view-itens",
        element: < ViewItens />
    },
    {
        path: "/categories",
        element: <CategoriesManager />
    },
    {
        path: "/admin/settings",
        element: < AdminSettings />
    },
    {
        path: "/appointments",
        element: <AppointmentsManager />
    },
    {
        path: "/",
        element: < LandingPage />
    },
    {
        path: "/auth/google",
        element: < MyAppointments/>
    }
]);

export default routes;