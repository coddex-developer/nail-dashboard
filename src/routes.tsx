import { createBrowserRouter } from "react-router-dom";
import Login from "./components/admin/pages/Login";
import Dashboard from "./components/admin/pages/Dashboard";

const routes = createBrowserRouter([
    {
        path: "/admin",
        element: <Login />
    },
    {
        path: "/dashboard",
        element: <Dashboard />
    }
]);
export default routes;