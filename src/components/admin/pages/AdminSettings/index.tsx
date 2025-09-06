import { CheckCircle, Lock, Phone, UserCircle } from "lucide-react";
import Navbar from "../../utils/Navbar";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";

function AdminSettings() {

    const navigate = useNavigate();

    const token = localStorage.getItem('admin_token');
    if (!token) {
        Swal.fire("Erro", "Sessão inválida. Por favor, faça login novamente.", "error");
        navigate('/admin');
        return;
    }


    return (
        <>
            <Navbar />

            <header className="pb-6 pt-6 px-6 lg:px-36 bg-gray-100">
                <h1 className="text-2xl font-semibold text-gray-800">Configurações Admin</h1>
                <p className="text-sm text-gray-500 mt-1">Atualize as infoprmações de acesso super usuário.</p>
            </header>

            <form className="min-h-screen bg-gray-100" action="">
                <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 pb-28 lg:pb-8">
                    <div className="relative mt-3">
                        <UserCircle className="absolute top-1/2 -translate-y-1/2 left-3 text-gray-400" size={20} />
                        <input id="userAdmin" type="text" step="0.01" className="block pl-10 pr-3 pb-2.5 pt-4 w-full text-sm text-grgray-100 rounded-lg border border-gray-300 appearance-none focus:outline-none focus:ring-0 focus:border-blue-600 peer" placeholder=" " required />
                        <label htmlFor="userAdmin" className="absolute text-sm text-gray-500 duration-300 transform -translate-y-4 scale-75 top-2 z-10 origin-[0] bg-gray-100 px-2 peer-focus:px-2 peer-focus:text-blue-600 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-2 peer-focus:scale-75 peer-focus:-translate-y-4 start-1">Usuário</label>
                    </div>

                    <div className="relative mt-3">
                        <Lock className="absolute top-1/2 -translate-y-1/2 left-3 text-gray-400" size={20} />
                        <input id="passwordAdmin" type="password" step="0.01" className="block pl-10 pr-3 pb-2.5 pt-4 w-full text-sm text-gray-900 bg-gray-100 rounded-lg border border-gray-300 appearance-none focus:outline-none focus:ring-0 focus:border-blue-600 peer" placeholder=" " required />
                        <label htmlFor="passwordAdmin" className="absolute text-sm text-gray-500 duration-300 transform -translate-y-4 scale-75 top-2 z-10 origin-[0] bg-gray-100 px-2 peer-focus:px-2 peer-focus:text-blue-600 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-2 peer-focus:scale-75 peer-focus:-translate-y-4 start-1">Senha</label>
                    </div>

                    <div className="relative mt-3">
                        <Lock className="absolute top-1/2 -translate-y-1/2 left-3 text-gray-400" size={20} />
                        <input id="confirmPasswordAdmin" type="password" step="0.01" className="block pl-10 pr-3 pb-2.5 pt-4 w-full text-sm text-gray-900 bg-gray-100 rounded-lg border border-gray-300 appearance-none focus:outline-none focus:ring-0 focus:border-blue-600 peer" placeholder=" " required />
                        <label htmlFor="confirmPasswordAdmin" className="absolute text-sm text-gray-500 duration-300 transform -translate-y-4 scale-75 top-2 z-10 origin-[0] bg-gray-100 px-2 peer-focus:px-2 peer-focus:text-blue-600 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-2 peer-focus:scale-75 peer-focus:-translate-y-4 start-1">Confirmar Senha</label>
                    </div>

                    <div className="relative mt-3">
                        <Phone className="absolute top-1/2 -translate-y-1/2 left-3 text-gray-400" size={20} />
                        <input id="contactAdmin" type="text" step="0.01" className="block pl-10 pr-3 pb-2.5 pt-4 w-full text-sm text-gray-900 bg-gray-100 rounded-lg border border-gray-300 appearance-none focus:outline-none focus:ring-0 focus:border-blue-600 peer" placeholder=" " />
                        <label htmlFor="contactAdmin" className="absolute text-sm text-gray-500 duration-300 transform -translate-y-4 scale-75 top-2 z-10 origin-[0] bg-gray-100 px-2 peer-focus:px-2 peer-focus:text-blue-600 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-2 peer-focus:scale-75 peer-focus:-translate-y-4 start-1">Contato</label>
                    </div>

                    <div className="lg:flex items-center justify-end gap-3 pt-6 mt-6 border-t border-gray-200">
                        <button type="submit" className="cursor-pointer inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-transparent bg-pink-600 text-sm font-semibold text-white shadow-sm hover:bg-pink-700">
                            <CheckCircle></CheckCircle> Atualizar Informações
                        </button>
                    </div>
                </div>
            </form>
        </>
    );
}

export default AdminSettings;