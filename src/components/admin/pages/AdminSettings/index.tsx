import { Lock, Phone, UserCircle } from "lucide-react";
import Navbar from "../../utils/Navbar";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import { AdminPanelSettings } from "@mui/icons-material";
import axios from "axios";
import { useEffect, useState } from "react";
import { ADMIN_BASE_URL } from "../../utils/scripts/url";

function AdminSettings() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [phone, setPhone] = useState("");
    const navigate = useNavigate();

    const token = localStorage.getItem("admin_token");

    useEffect(() => {
        if (!token) {
            Swal.fire("Erro", "Sessão inválida. Por favor, faça login novamente.", "error");
            navigate("/admin");
            return;
        }

        async function fetchAdminData() {
            try {
                const response = await axios.get(`${ADMIN_BASE_URL}/secret`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                setUsername(response.data[0].name);
                setPhone(response.data[0].phone);
            } catch (error) {
                console.log(error);
                if (error.response && error.response.status === 401) {
                    Swal.fire("Sessão Expirada", "Por favor, faça login novamente.", "warning");
                    localStorage.removeItem("admin_token");
                    navigate("/admin");
                }
            }
        }

        fetchAdminData();
    }, [token, navigate]);

    if (!token) return null;

    async function handleUpdate(e) {
        e.preventDefault();

        if (password !== confirmPassword) {
            Swal.fire("Erro", "As senhas não coincidem!", "error");
            return;
        }

        try {
            await axios.patch(
                `${ADMIN_BASE_URL}/profile`,
                { username, password, phone },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            Swal.fire("Sucesso", "Informações atualizadas com sucesso!", "success");
        } catch (error) {
            console.log(error);
            Swal.fire("Erro", "Não foi possível atualizar as informações.", "error");
        }
    }

    return (
        <>
            <Navbar />

            <header className="lg:w-[700px] lg:px-9 lg:mx-auto pb-6 pt-6 px-6 bg-gray-100">
                <h1 className="text-2xl font-semibold text-gray-800">Configurações Admin</h1>
                <p className="text-sm text-gray-500 mt-1">Atualize as informações de acesso Super Usuário.</p>
            </header>

            <form className="lg:w-[700px] lg:mx-auto bg-gray-100" onSubmit={handleUpdate}>
                <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 pb-28 lg:pb-8">
                    {/* Usuário */}
                    <div className="relative mt-3">
                        <UserCircle className="absolute top-1/2 -translate-y-1/2 left-3 text-gray-400" size={20} />
                        <input
                            id="userAdmin"
                            type="text"
                            className="block pl-10 pr-3 pb-2.5 pt-4 w-full text-sm text-grgray-100 rounded-lg border border-gray-300 appearance-none focus:outline-none focus:ring-0 focus:border-blue-600 peer"
                            placeholder=" "
                            required
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />
                        <label
                            htmlFor="userAdmin"
                            className="absolute text-sm text-gray-500 duration-300 transform -translate-y-4 scale-75 top-2 z-10 origin-[0] bg-gray-100 px-2 peer-focus:px-2 peer-focus:text-blue-600 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-2 peer-focus:scale-75 peer-focus:-translate-y-4 start-1"
                        >
                            Usuário
                        </label>
                    </div>

                    {/* Senha */}
                    <div className="relative mt-3">
                        <Lock className="absolute top-1/2 -translate-y-1/2 left-3 text-gray-400" size={20} />
                        <input
                            id="passwordAdmin"
                            type="password"
                            className="block pl-10 pr-3 pb-2.5 pt-4 w-full text-sm text-gray-900 bg-gray-100 rounded-lg border border-gray-300 appearance-none focus:outline-none focus:ring-0 focus:border-blue-600 peer"
                            placeholder=" "
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        <label
                            htmlFor="passwordAdmin"
                            className="absolute text-sm text-gray-500 duration-300 transform -translate-y-4 scale-75 top-2 z-10 origin-[0] bg-gray-100 px-2 peer-focus:px-2 peer-focus:text-blue-600 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-2 peer-focus:scale-75 peer-focus:-translate-y-4 start-1"
                        >
                            Senha
                        </label>
                    </div>

                    {/* Confirmar Senha */}
                    <div className="relative mt-3">
                        <Lock className="absolute top-1/2 -translate-y-1/2 left-3 text-gray-400" size={20} />
                        <input
                            id="confirmPasswordAdmin"
                            type="password"
                            className="block pl-10 pr-3 pb-2.5 pt-4 w-full text-sm text-gray-900 bg-gray-100 rounded-lg border border-gray-300 appearance-none focus:outline-none focus:ring-0 focus:border-blue-600 peer"
                            placeholder=" "
                            required
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                        <label
                            htmlFor="confirmPasswordAdmin"
                            className="absolute text-sm text-gray-500 duration-300 transform -translate-y-4 scale-75 top-2 z-10 origin-[0] bg-gray-100 px-2 peer-focus:px-2 peer-focus:text-blue-600 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-2 peer-focus:scale-75 peer-focus:-translate-y-4 start-1"
                        >
                            Confirmar Senha
                        </label>
                    </div>

                    {/* Telefone */}
                    <div className="relative mt-3">
                        <Phone className="absolute top-1/2 -translate-y-1/2 left-3 text-gray-400" size={20} />
                        <input
                            id="contactAdmin"
                            type="text"
                            className="block pl-10 pr-3 pb-2.5 pt-4 w-full text-sm text-gray-900 bg-gray-100 rounded-lg border border-gray-300 appearance-none focus:outline-none focus:ring-0 focus:border-blue-600 peer"
                            placeholder=" "
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                        />
                        <label
                            htmlFor="contactAdmin"
                            className="absolute text-sm text-gray-500 duration-300 transform -translate-y-4 scale-75 top-2 z-10 origin-[0] bg-gray-100 px-2 peer-focus:px-2 peer-focus:text-blue-600 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-2 peer-focus:scale-75 peer-focus:-translate-y-4 start-1"
                        >
                            Contato
                        </label>
                    </div>

                    {/* Botão */}
                    <div className="lg:flex items-center justify-end gap-3 pt-6 mt-6 border-t border-gray-200">
                        <button
                            type="submit"
                            className="cursor-pointer inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-transparent bg-pink-600 text-sm font-semibold text-white shadow-sm hover:bg-pink-700"
                        >
                            <AdminPanelSettings /> Atualizar Informações
                        </button>
                    </div>
                </div>
            </form>
        </>
    );
}

export default AdminSettings;
