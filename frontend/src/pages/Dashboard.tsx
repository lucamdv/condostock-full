import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Link } from 'react-router-dom';
import { 
  TrendingUp, 
  Users, 
  Package, 
  AlertTriangle, 
  ShoppingBag, 
  ArrowRight, 
  Wallet,
  DollarSign
} from 'lucide-react';

interface DashboardStats {
  totalSales: number;
  totalReceivable: number; // Dinheiro na rua (Fiado)
  lowStockCount: number;
  activeResidents: number;
}

interface UserSession {
  id: string;
  name: string;
  role: string;
  account?: { balance: number };
}

export function Dashboard() {
  const [user, setUser] = useState<UserSession | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalSales: 0,
    totalReceivable: 0,
    lowStockCount: 0,
    activeResidents: 0
  });
  const [myBalance, setMyBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    // 1. Pega usuário logado
    const userJson = localStorage.getItem('condostock_user');
    if (!userJson) return;
    const currentUser = JSON.parse(userJson);
    setUser(currentUser);

    try {
      // Se for ADMIN, carrega dados gerais
      if (currentUser.role === 'ADMIN') {
        const [productsRes, residentsRes, salesRes] = await Promise.all([
          api.get('/products'),
          api.get('/residents'),
          api.get('/sales') // Idealmente, teríamos uma rota de dashboard no back, mas calculamos aqui pro MVP
        ]);

        const products = productsRes.data;
        const residents = residentsRes.data;
        const sales = salesRes.data;

        // Cálculos
        const lowStock = products.filter((p: any) => p.totalStock < p.minStock).length;
        const receivable = residents.reduce((acc: number, r: any) => acc + Number(r.account.balance), 0);
        const totalSales = sales.reduce((acc: number, s: any) => acc + Number(s.total), 0);

        setStats({
          totalSales,
          totalReceivable: receivable,
          lowStockCount: lowStock,
          activeResidents: residents.length
        });
      } 
      // Se for MORADOR, carrega saldo pessoal
      else {
        const res = await api.get(`/residents/${currentUser.id}`);
        setMyBalance(Number(res.data.account.balance));
      }
    } catch (error) {
      console.error("Erro ao carregar dashboard", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div className="p-8 text-slate-400">Carregando painel...</div>;

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      
      {/* --- BOAS VINDAS --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">
            {user?.role === 'ADMIN' ? 'Painel do Síndico' : `Olá, ${user?.name.split(' ')[0]}!`}
          </h1>
          <p className="text-slate-500">
            {user?.role === 'ADMIN' 
              ? 'Visão geral do mercadinho e finanças.' 
              : 'Bem-vindo ao seu mercadinho honesto.'}
          </p>
        </div>
        <div className="text-sm text-slate-400 font-medium bg-slate-100 px-3 py-1 rounded-full">
          {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </div>
      </div>

      {/* --- VISÃO DO SÍNDICO (ADMIN) --- */}
      {user?.role === 'ADMIN' && (
        <>
          {/* Cards de Métricas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
              <div className="p-4 bg-green-50 text-green-600 rounded-xl">
                <DollarSign size={24} />
              </div>
              <div>
                <p className="text-sm text-slate-500 font-medium">Vendas Totais</p>
                <p className="text-2xl font-bold text-slate-800">
                  {stats.totalSales.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
              <div className="p-4 bg-blue-50 text-blue-600 rounded-xl">
                <Wallet size={24} />
              </div>
              <div>
                <p className="text-sm text-slate-500 font-medium">A Receber (Fiado)</p>
                <p className="text-2xl font-bold text-blue-600">
                  {stats.totalReceivable.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
              <div className="p-4 bg-orange-50 text-orange-600 rounded-xl">
                <AlertTriangle size={24} />
              </div>
              <div>
                <p className="text-sm text-slate-500 font-medium">Estoque Baixo</p>
                <p className="text-2xl font-bold text-slate-800">{stats.lowStockCount} produtos</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
              <div className="p-4 bg-purple-50 text-purple-600 rounded-xl">
                <Users size={24} />
              </div>
              <div>
                <p className="text-sm text-slate-500 font-medium">Moradores Ativos</p>
                <p className="text-2xl font-bold text-slate-800">{stats.activeResidents}</p>
              </div>
            </div>
          </div>

          {/* Atalhos Rápidos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Link to="/products" className="group bg-gradient-to-br from-slate-800 to-slate-900 text-white p-8 rounded-2xl flex items-center justify-between hover:shadow-lg transition-all">
              <div>
                <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
                  <Package className="text-blue-400" /> Repor Estoque
                </h3>
                <p className="text-slate-400 text-sm">Gerencie produtos e quantidades.</p>
              </div>
              <ArrowRight className="group-hover:translate-x-2 transition-transform" />
            </Link>

            <Link to="/residents" className="group bg-white border border-slate-200 p-8 rounded-2xl flex items-center justify-between hover:border-blue-300 hover:shadow-md transition-all">
              <div>
                <h3 className="text-xl font-bold text-slate-800 mb-2 flex items-center gap-2">
                  <Users className="text-blue-600" /> Gerenciar Contas
                </h3>
                <p className="text-slate-500 text-sm">Ver quem está devendo e histórico.</p>
              </div>
              <ArrowRight className="text-slate-400 group-hover:translate-x-2 transition-transform" />
            </Link>
          </div>
        </>
      )}

      {/* --- VISÃO DO MORADOR (USER) --- */}
      {user?.role === 'RESIDENT' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Card de Saldo */}
          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl flex flex-col justify-between h-64 relative overflow-hidden">
            <div className="relative z-10">
              <p className="text-slate-500 font-medium mb-1 flex items-center gap-2">
                <Wallet size={18} /> Meu Saldo Devedor
              </p>
              <h2 className={`text-5xl font-bold ${myBalance > 0 ? 'text-red-500' : 'text-green-500'}`}>
                {myBalance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </h2>
              {myBalance > 0 && (
                <p className="text-red-400 text-sm mt-2 font-medium bg-red-50 inline-block px-3 py-1 rounded-full">
                  Lembre-se de acertar com o síndico até o dia 10!
                </p>
              )}
              {myBalance === 0 && (
                <p className="text-green-600 text-sm mt-2 font-medium bg-green-50 inline-block px-3 py-1 rounded-full">
                  Tudo certo! Você não tem dívidas.
                </p>
              )}
            </div>
            
            {/* Decoração de fundo */}
            <div className={`absolute -right-10 -bottom-10 w-48 h-48 rounded-full opacity-10 
              ${myBalance > 0 ? 'bg-red-500' : 'bg-green-500'}`} 
            />
          </div>

          {/* Card de Ação (Ir para Loja) */}
          <Link to="/sales" className="bg-blue-600 text-white p-8 rounded-3xl shadow-xl shadow-blue-200 flex flex-col justify-between h-64 group hover:bg-blue-700 transition-colors relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="text-3xl font-bold mb-2">Fazer Compras</h3>
              <p className="text-blue-100 max-w-xs">
                Geladeira vazia? Acesse a lojinha agora mesmo e pegue o que precisa.
              </p>
            </div>
            
            <div className="relative z-10 flex items-center gap-2 font-bold text-lg mt-4">
              Ir para o mercadinho <ArrowRight className="group-hover:translate-x-2 transition-transform" />
            </div>

            <ShoppingBag className="absolute -right-6 -bottom-6 text-blue-500 opacity-50" size={180} strokeWidth={1} />
          </Link>

        </div>
      )}
    </div>
  );
}