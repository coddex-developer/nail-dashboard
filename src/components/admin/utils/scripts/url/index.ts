// base para todas as rotas
const PORT = "1000"
export const BASE_URL: string = import.meta.env.VITE_API_URL || `http://localhost:${PORT}/admin`;
export const API_BASE_URL = import.meta.env.VITE_API_URL || `http://localhost:${PORT}`;

export const UrlCategories = {
    allCategories: `${BASE_URL}/dashboard/all-category`,
    createCategory: `${BASE_URL}/dashboard/create-category`,
    updateCategory: (id: number | string) => `${BASE_URL}/dashboard/update-category/${id}`,
    deleteCategory: (id: number | string) => `${BASE_URL}/dashboard/delete-category/${id}`,
};

export const UrlProducts = {
    allProducts: `${BASE_URL}/all-products`,
    createProduct: `${BASE_URL}/create-product`,
    updateProduct: (id: number | string) => `${BASE_URL}/update-product/${id}`,
    deleteProduct: (id: number | string) => `${BASE_URL}/delete-product/${id}`,
};

export const UrlContacts = {
    allContacts: `${BASE_URL}/dashboard/all-contacts`,
    createContact: `${BASE_URL}/dashboard/create-contact`,
    updateContact: (id: number | string) => `${BASE_URL}/dashboard/update-contact/${id}`,
    deleteContact: (id: number | string) => `${BASE_URL}/dashboard/delete-contact/${id}`,
};

export const UrlAppointments = {
    all: `${BASE_URL}/dashboard/all-appointments`,
    updateStatus: (id: number | string) => `${BASE_URL}/dashboard/appointments/${id}/status`,
};

// Constante adicionada para as notificações
export const UrlNotifications = {
    all: `${BASE_URL}/notifications`,
    markRead: `${BASE_URL}/notifications/mark-read`,
};

// Exportação atualizada para incluir UrlNotifications
//export { UrlCategories, UrlProducts, UrlContacts, UrlAppointments, UrlNotifications };
