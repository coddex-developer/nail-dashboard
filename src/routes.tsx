import { createBrowserRouter } from "react-router-dom";
import Login from "./components/admin/pages/Login";
import Dashboard from "./components/admin/pages/Dashboard";
import CreateItem from "./components/admin/pages/CreateItem";
import ViewItens from "./components/admin/pages/ViewItens";
import CategoriesManager from "./components/admin/pages/CategoriesManager";

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
        element: < CreateItem />
    },
    {
        path: "/view-itens",
        element: < ViewItens />
    },
    {
        path: "/categories",
        element: <CategoriesManager />
    }
]);
export default routes;