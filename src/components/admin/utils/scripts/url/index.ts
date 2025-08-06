// base para todas as rotas
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:1000/admin";

const UrlCategories = {
    allCategories: `${BASE_URL}/dashboard/all-category`,
    createCategory: `${BASE_URL}/dashboard/create-category`,
    updateCategory: `${BASE_URL}/dashboard/update-category/`,
    deleteCategory: `${BASE_URL}/dashboard/delete-category/`,
};

const UrlProducts = {
    allProducts: `${BASE_URL}/all-products`,
    createProduct: `${BASE_URL}/create-product`,
    updateProduct: `${BASE_URL}/update-product/`,
    deleteProduct: `${BASE_URL}/delete-product/`,
};

export { UrlCategories, UrlProducts };
