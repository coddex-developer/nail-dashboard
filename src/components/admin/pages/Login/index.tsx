import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { Gem, User, Lock, ArrowRight } from 'lucide-react';
// Ajuste o caminho de importação conforme a sua estrutura de rotas
import { UrlAdmin } from '../../utils/scripts/url'; 

export default function Login() {
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const handleLogin = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!name || !password) {
            setError('Por favor, preencha todos os campos.');
            return;
        }

        setLoading(true);

        try {
            const res = await fetch(UrlAdmin.login, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, password }),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || 'Credenciais inválidas.');
            }

            const { token } = await res.json();
            
            // Armazena o token para autenticação nas próximas requisições
            localStorage.setItem('admin_token', token);

            await Swal.fire({
                icon: 'success',
                title: 'Login bem-sucedido!',
                text: 'A redirecionar para o painel...',
                timer: 1500,
                showConfirmButton: false,
            });

            navigate('/admin/dashboard');

        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
            <main className="w-full max-w-md mx-auto p-6">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8">
                    <div className="flex flex-col items-center mb-8">
                        <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mb-4">
                            <Gem className="text-white w-7 h-7" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Acesso ao Painel</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Insira as suas credenciais para continuar</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <User className="text-gray-400" size={20} />
                            </div>
                            <input
                                type="text"
                                placeholder="Nome de utilizador"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="block w-full pl-10 pr-3 py-3 text-sm text-gray-900 dark:text-white bg-transparent rounded-lg border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-0 focus:border-blue-600"
                                disabled={loading}
                            />
                        </div>

                        <div className="relative">
                             <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Lock className="text-gray-400" size={20} />
                            </div>
                            <input
                                type="password"
                                placeholder="Senha"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="block w-full pl-10 pr-3 py-3 text-sm text-gray-900 dark:text-white bg-transparent rounded-lg border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-0 focus:border-blue-600"
                                disabled={loading}
                            />
                        </div>

                        {error && (
                            <div className="text-center text-sm text-red-600 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                                {error}
                            </div>
                        )}

                        <div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-full bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:bg-blue-400 transition-colors"
                            >
                                {loading ? 'A entrar...' : 'Entrar'}
                                {!loading && <ArrowRight size={16} />}
                            </button>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
}
