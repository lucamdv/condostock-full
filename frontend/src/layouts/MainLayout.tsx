import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
// 👇 Adicionei 'Home' aqui nos imports
import { LayoutDashboard, ShoppingCart, Package, Users, LogOut, Home } from 'lucide-react';
import clsx from 'clsx';

export function MainLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  // Ler o usuário salvo para saber se é ADMIN
  const userJson = localStorage.getItem('condostock_user');
  const user = userJson ? JSON.parse(userJson) : { role: 'RESIDENT' };
  const isAdmin = user.role === 'ADMIN';

  // Define os menus
  const menuItems = [
    // --- ITENS VISÍVEIS PARA TODOS ---
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    
    // 👇 NOVO ITEM: Minha Unidade (Família)
    { icon: Home, label: 'Minha Unidade', path: '/minha-unidade' },

    { icon: ShoppingCart, label: isAdmin ? 'Caixa / Vendas' : 'Fazer Compras', path: '/sales' },
  ];

  // --- ITENS APENAS DO SÍNDICO ---
  if (isAdmin) {
    menuItems.push(
      { icon: Package, label: 'Produtos', path: '/products' },
      { icon: Users, label: 'Moradores (Geral)', path: '/residents' }
    );
  }

  function handleLogout() {
    localStorage.removeItem('condostock_token');
    localStorage.removeItem('condostock_user');
    localStorage.removeItem('condostock_user_id'); // Limpa o ID também por segurança
    navigate('/login');
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="w-64 bg-slate-900 text-white flex flex-col fixed h-full shadow-xl transition-all z-20">
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-2xl font-bold text-blue-400 flex items-center gap-2">
            <LayoutDashboard />
            CondoStock
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {isAdmin ? 'Gestão Administrativa' : 'Área do Morador'}
          </p>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={clsx(
                  'flex items-center gap-3 px-4 py-3 rounded-lg transition-all',
                  isActive 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                )}
              >
                <Icon size={20} />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="mb-4 px-2">
            <p className="text-xs text-slate-500 uppercase font-bold mb-1">Usuário</p>
            <p className="text-sm font-medium text-slate-300 truncate">{user.name}</p>
            {/* Mostra o CPF formatado ou Email se tiver */}
            <p className="text-xs text-slate-500 truncate">{user.email || user.cpf}</p>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full text-red-400 hover:bg-slate-800 rounded-lg transition-all"
          >
            <LogOut size={20} />
            <span className="font-medium">Sair</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 ml-64 p-8">
        <Outlet />
      </main>
    </div>
  );
}