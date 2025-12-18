import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Plus, Trash2, Home, Clock, CheckCircle, User, X, LogOut } from 'lucide-react';

interface Resident {
  id: string;
  name: string;
  cpf: string;
  role: 'ADMIN' | 'RESIDENT';
  unitRole: 'OWNER' | 'MEMBER';
  status: 'ACTIVE' | 'PENDING' | 'REJECTED';
  email?: string;
}

export function MyUnit() {
  const [family, setFamily] = useState<Resident[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Estado inicial com strings vazias
  const [newMember, setNewMember] = useState({ name: '', cpf: '', email: '', phone: '' });

  // Pega o ID de forma robusta
  const getMyId = () => {
    const id = localStorage.getItem('condostock_user_id');
    if (id) return id;
    const userStr = localStorage.getItem('condostock_user');
    if (userStr) {
      try { return JSON.parse(userStr).id; } catch (e) { return null; }
    }
    return null;
  };

  const storedId = getMyId();

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const response = await api.get('/residents/me/unit');
      setFamily(response.data);
    } catch (error) {
      console.error('Erro ao carregar família', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddMember(e: React.FormEvent) {
    e.preventDefault();
    try {
      // 👇 TRUQUE DE MESTRE: Converte "" (vazio) para undefined
      // Assim o Backend ignora o campo em vez de tentar validar um email vazio
      const payload = {
        ...newMember,
        email: newMember.email.trim() || undefined,
        phone: newMember.phone.trim() || undefined
      };

      await api.post('/residents/me/dependent', payload);
      
      alert('Solicitação enviada! O familiar aparecerá como pendente.');
      setIsModalOpen(false);
      setNewMember({ name: '', cpf: '', email: '', phone: '' });
      loadData();
    } catch (error: any) {
      console.error(error);
      // Mostra mensagem de erro mais clara se possível
      const msg = error.response?.data?.message || 'Erro ao adicionar. Verifique se o CPF ou E-mail já existem.';
      alert(msg);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Tem certeza que deseja remover este dependente?')) return;
    try {
      await api.delete(`/residents/${id}`);
      loadData();
    } catch (error) {
      alert('Erro ao remover dependente.');
    }
  }

  const me = family.find(r => r.id === storedId);
  const isOwner = me?.unitRole === 'OWNER' || me?.role === 'ADMIN';
  const needLogin = !loading && family.length > 0 && !me;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Home className="text-blue-600" /> Minha Unidade
          </h1>
          <p className="text-slate-500">Gerencie as pessoas que moram com você</p>
        </div>

        {isOwner && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-md"
          >
            <Plus size={20} />
            Adicionar Familiar
          </button>
        )}
      </div>

      {needLogin && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LogOut size={20} />
            <span>Sessão inválida. Faça login novamente.</span>
          </div>
          <button onClick={() => { localStorage.clear(); window.location.href = '/login'; }} className="bg-red-100 px-3 py-1 rounded font-bold text-sm">Sair</button>
        </div>
      )}

      {loading ? (
        <p className="text-slate-500 animate-pulse">Carregando moradores...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {family.length === 0 && (
            <div className="col-span-full text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-300">
              <User className="mx-auto text-slate-300 mb-2" size={48} />
              <p className="text-slate-500">Nenhum morador encontrado.</p>
            </div>
          )}
          
          {family.map(person => (
            <div key={person.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex justify-between items-center hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold shadow-sm ${
                  person.role === 'ADMIN' ? 'bg-red-100 text-red-600' :
                  person.unitRole === 'OWNER' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'
                }`}>
                  {person.name.substring(0, 2).toUpperCase()}
                </div>

                <div>
                  <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                    {person.name}
                    {person.id === storedId && <span className="text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-500 border border-slate-200">(Eu)</span>}
                  </h3>
                  <p className="text-sm text-slate-500">CPF: {person.cpf}</p>
                  
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide ${
                      person.role === 'ADMIN' ? 'bg-red-50 text-red-700 border border-red-100' :
                      person.unitRole === 'OWNER' ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'bg-purple-50 text-purple-700 border border-purple-100'
                    }`}>
                      {person.role === 'ADMIN' ? 'Síndico' : person.unitRole === 'OWNER' ? 'Titular' : 'Dependente'}
                    </span>
                    {person.status === 'PENDING' && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-50 text-yellow-700 border border-yellow-100 flex items-center gap-1 font-medium">
                        <Clock size={10} /> Aguardando
                      </span>
                    )}
                     {person.status === 'ACTIVE' && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-100 flex items-center gap-1 font-medium">
                        <CheckCircle size={10} /> Ativo
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {isOwner && person.id !== storedId && (
                <button 
                  onClick={() => handleDelete(person.id)}
                  className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                  title="Remover morador"
                >
                  <Trash2 size={20} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
               <h2 className="text-lg font-bold text-slate-800">Novo Familiar</h2>
               <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                 <X size={20} />
               </button>
            </div>
            
            <form onSubmit={handleAddMember} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nome Completo</label>
                <input required className="w-full px-4 py-2 rounded-lg border border-slate-200 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-50 transition-all" 
                  placeholder="Ex: Maria Silva" value={newMember.name} onChange={e => setNewMember({...newMember, name: e.target.value})} />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">CPF</label>
                <input required className="w-full px-4 py-2 rounded-lg border border-slate-200 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-50 transition-all" 
                  placeholder="000.000.000-00" value={newMember.cpf} onChange={e => setNewMember({...newMember, cpf: e.target.value})} />
              </div>

              {/* NOVOS CAMPOS: E-MAIL E TELEFONE */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">E-mail (Opcional)</label>
                <input type="email" className="w-full px-4 py-2 rounded-lg border border-slate-200 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-50 transition-all" 
                  placeholder="email@exemplo.com" value={newMember.email} onChange={e => setNewMember({...newMember, email: e.target.value})} />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Telefone (Opcional)</label>
                <input className="w-full px-4 py-2 rounded-lg border border-slate-200 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-50 transition-all" 
                  placeholder="(00) 00000-0000" value={newMember.phone} onChange={e => setNewMember({...newMember, phone: e.target.value})} />
              </div>

              <div className="flex gap-3 mt-6 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2.5 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 font-medium transition-colors">Cancelar</button>
                <button type="submit" className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-lg shadow-blue-200 transition-all">Solicitar Cadastro</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}