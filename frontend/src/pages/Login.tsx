import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Lock, User, Building2, ArrowRight } from 'lucide-react';

export function Login() {
  const navigate = useNavigate();
  const [cpf, setCpf] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      // Chama o backend enviando CPF
      const response = await api.post('/auth/login', { cpf, password });
      
      const { access_token, user } = response.data;

      // 1. Salva o Token (Essencial para as requisições)
      localStorage.setItem('condostock_token', access_token);

      // 2. Salva o objeto usuário completo (Para mostrar nome no menu, etc)
      localStorage.setItem('condostock_user', JSON.stringify(user));

      // 3. Salva o ID separado (CRUCIAL: Usado pela tela "Minha Unidade" para saber quem é "(Eu)")
      localStorage.setItem('condostock_user_id', user.id);

      // Configura o token para as próximas requisições imediatamente
      api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;

      // Lógica de Primeiro Acesso (Troca de Senha)
      if (user.isFirstLogin) {
        // Força recarregamento para o App.tsx detectar o firstLogin e abrir o Modal
        window.location.href = '/'; 
      } else {
        // Navegação rápida (SPA)
        navigate('/');
      }
      
    } catch (error) {
      console.error(error);
      alert('CPF ou senha inválidos!');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col md:flex-row">
        
        {/* Lado Esquerdo (Visual) */}
        <div className="bg-blue-600 md:w-1/2 p-12 flex flex-col justify-between text-white relative overflow-hidden">
          <div className="relative z-10">
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mb-6 backdrop-blur-sm">
              <Building2 size={24} className="text-white" />
            </div>
            <h1 className="text-4xl font-bold mb-2">CondoStock</h1>
            <p className="text-blue-100 text-lg">Gestão inteligente para o seu condomínio.</p>
          </div>
          
          <div className="relative z-10 mt-12">
            <p className="text-sm text-blue-200">
              "Facilitou muito a vida dos moradores e do síndico. O acesso via CPF é muito prático!"
            </p>
          </div>

          {/* Decoração de fundo */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500 rounded-full blur-3xl -mr-16 -mt-16 opacity-50"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-700 rounded-full blur-3xl -ml-16 -mb-16 opacity-50"></div>
        </div>

        {/* Lado Direito (Formulário) */}
        <div className="md:w-1/2 p-12 flex flex-col justify-center">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-800">Acesso ao Condomínio</h2>
            <p className="text-slate-500">Digite seu CPF para acessar.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">CPF</label>
              <div className="relative">
                <User className="absolute left-3 top-3 text-slate-400" size={20} />
                <input 
                  type="text" 
                  required
                  placeholder="000.000.000-00"
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                  value={cpf}
                  onChange={e => setCpf(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Senha</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-slate-400" size={20} />
                <input 
                  type="password" 
                  required
                  placeholder="••••"
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
              </div>
              <p className="text-xs text-slate-400 mt-1">Primeiro acesso? A senha são os 4 primeiros dígitos do CPF.</p>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-all flex items-center justify-center gap-2 group shadow-lg shadow-blue-200"
            >
              {loading ? 'Validando...' : (
                <>
                  Entrar no Sistema <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-slate-400">
            Problemas no acesso? Procure a administração.
          </p>
        </div>
      </div>
    </div>
  );
}