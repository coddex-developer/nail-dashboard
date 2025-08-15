// --- CONFIGURAÇÃO BASE ---
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ;

// URL base para o painel de administração
const ADMIN_BASE_URL = `${API_BASE_URL}/admin`;
// URL base para as rotas do cliente
const USER_BASE_URL = `${API_BASE_URL}/user`;

/**
 * Rotas de autenticação e perfil do Admin.
 */
export const UrlAdmin = {
    login: `${ADMIN_BASE_URL}/login`,
    updateProfile: `${ADMIN_BASE_URL}/profile`,
};

/**
 * Rotas para o CRUD de Categorias.
 */
export const UrlCategories = {
    allCategories: `${ADMIN_BASE_URL}/categories`,
    createCategory: `${ADMIN_BASE_URL}/categories`,
    updateCategory: (id: number) => `${ADMIN_BASE_URL}/categories/${id}`,
    deleteCategory: (id: number) => `${ADMIN_BASE_URL}/categories/${id}`,
};

/**
 * Rotas para o CRUD de Produtos.
 */
export const UrlProducts = {
    allProducts: `${ADMIN_BASE_URL}/products`,
    createProduct: `${ADMIN_BASE_URL}/products`,
    updateProduct: (id: number | string) => `${ADMIN_BASE_URL}/products/${id}`,
    deleteProduct: (id: number | string) => `${ADMIN_BASE_URL}/products/${id}`,
};

/**
 * Rotas para o CRUD de Contatos.
 */
export const UrlContacts = {
    allContacts: `${ADMIN_BASE_URL}/contacts`,
    createContact: `${ADMIN_BASE_URL}/contacts`,
    updateContact: (id: number | string) => `${ADMIN_BASE_URL}/contacts/${id}`,
    deleteContact: (id: number | string) => `${ADMIN_BASE_URL}/contacts/${id}`,
};

/**
 * Rotas para a gestão de Agendamentos pelo Admin.
 */
export const UrlAppointments = {
    all: `${ADMIN_BASE_URL}/appointments`,
    updateStatus: (id: number | string) => `${ADMIN_BASE_URL}/appointments/${id}/status`,
};

/**
 * Rotas para a gestão de Notificações.
 */
export const UrlNotifications = {
    all: `${ADMIN_BASE_URL}/notifications`,
    markRead: `${ADMIN_BASE_URL}/notifications/read`,
};

/**
 * Rota para o admin buscar todos os utilizadores (clientes).
 */
export const UrlUsers = {
    all: `${ADMIN_BASE_URL}/users`,
};

/**
 * Rotas para o cliente autenticado.
 */
export const UrlUser = {
    getAppointments: () => `${USER_BASE_URL}/appointments`,
    createAppointment: () => `${USER_BASE_URL}/appointments/create`, // ADICIONADO
    cancelAppointment: (appointmentId: number) => `${USER_BASE_URL}/appointments/${appointmentId}/cancel`,
    toggleSavePost: (postId: number | string) => `${USER_BASE_URL}/posts/${postId}/save`,
};
