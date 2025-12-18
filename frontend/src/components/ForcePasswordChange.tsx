import { useState } from 'react';
import { api } from '../services/api';
import { Lock, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function ForcePasswordChange() {
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleChange() {
    if (newPassword.length < 6) return alert('A senha precisa ter pelo menos 6 caracteres.');
    
    const userJson = localStorage.getItem('condostock_user');
    if (!userJson) return;
    const user = JSON.parse(userJson);

    setLoading(true);
    try {
      // Chama a rota que criamos no backend
      await api.post(`/residents/${user.id}/change-password`, { password: newPassword });
      
      // Atualiza o localStorage para ele não pedir de novo sem precisar relogar
      user.isFirstLogin = false;
      localStorage.setItem('condostock_user', JSON.stringify(user));
      
      alert('Senha atualizada com sucesso!');
      
      // Recarrega a página para o App.tsx perceber a mudança e liberar o Dashboard
      window.location.reload(); 
    } catch (error) {
      alert('Erro ao atualizar senha.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-sm flex items-center justify-center z-[999]">
      <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-md w-full text-center animate-in zoom-in-95">
        <div className="w-16 h-16 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <Lock size={32} />
        </div>
        
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Segurança em Primeiro Lugar</h2>
        <p className="text-slate-500 mb-6">
          Como este é seu primeiro acesso, você precisa definir uma nova senha pessoal para continuar.
        </p>

        <input 
          type="password"
          placeholder="Nova Senha (mínimo 6 dígitos)"
          className="w-full p-4 rounded-xl border border-slate-300 mb-4 focus:border-blue-500 outline-none text-center text-lg"
          value={newPassword}
          onChange={e => setNewPassword(e.target.value)}
        />

        <button 
          onClick={handleChange}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
        >
          {loading ? 'Salvando...' : 'Definir Senha e Entrar'}
        </button>
      </div>
    </div>
  );
}