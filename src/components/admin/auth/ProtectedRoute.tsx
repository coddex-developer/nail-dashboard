import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute: React.FC = () => {
    const token = localStorage.getItem('admin_token');

    // Se não houver token, redireciona para a página de login do admin
    if (!token) {
        return <Navigate to="/admin" replace />;
    }

    // Se houver token, permite o acesso à rota solicitada
    return <Outlet />;
};

export default ProtectedRoute;
