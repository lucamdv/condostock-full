import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Search, ShoppingCart, Trash2, CheckCircle, Wallet, LogOut } from 'lucide-react';
import { ProductThumbnail } from '../components/ProductThumbnail';
import { useNavigate } from 'react-router-dom';

// --- TIPOS ---
interface Product {
  id: string;
  name: string;
  price: string;
  totalStock: number;
  barcode: string;
}

interface CartItem extends Product {
  quantity: number;
}

interface UserSession {
  id: string;
  name: string;
  email: string;
  role: string;
  apartment: string;
}

export function Sales() {
  const navigate = useNavigate();
  
  // --- ESTADOS ---
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentType, setPaymentType] = useState('FIADO'); // Padrão mais comum em Honest Market
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [myBalance, setMyBalance] = useState<number>(0);

  // --- CARREGAMENTO INICIAL ---
  useEffect(() => {
    // 1. Identificar quem está logado
    const userJson = localStorage.getItem('condostock_user');
    if (!userJson) {
      navigate('/login');
      return;
    }
    const user = JSON.parse(userJson);
    setCurrentUser(user);

    // 2. Carregar produtos
    loadProducts();

    // 3. Buscar saldo atualizado do próprio usuário
    api.get(`/residents/${user.id}`).then(res => {
      setMyBalance(Number(res.data.account.balance));
    });

  }, []);

  async function loadProducts() {
    const res = await api.get('/products');
    setProducts(res.data);
  }

  // --- FUNÇÕES DO CARRINHO ---
  function addToCart(product: Product) {
    if (product.totalStock <= 0) return alert('Produto esgotado! 😓');

    setCart((prev) => {
      const itemExists = prev.find((i) => i.id === product.id);
      
      // Validação de estoque local
      const currentQtyInCart = itemExists ? itemExists.quantity : 0;
      if (currentQtyInCart + 1 > product.totalStock) {
        alert('Você pegou o último item do estoque!');
        return prev;
      }

      if (itemExists) {
        return prev.map((i) => 
          i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  }

  function removeFromCart(id: string) {
    setCart((prev) => prev.filter((item) => item.id !== id));
  }

  const total = cart.reduce((acc, item) => {
    return acc + (Number(item.price) * item.quantity);
  }, 0);

  // --- FINALIZAR COMPRA (SELF-SERVICE) ---
  async function handleCheckout() {
    if (cart.length === 0) return alert('Seu carrinho está vazio.');
    if (!currentUser) return;

    // Confirmação simples
    const confirmMessage = paymentType === 'FIADO' 
      ? `Confirmar compra de ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(total)} no FIADO?`
      : 'Confirma que já realizou o pagamento (Pix/Dinheiro)?';

    if (!window.confirm(confirmMessage)) return;

    setLoading(true);
    try {
      const saleData = {
        items: cart.map(item => ({
          productId: item.id,
          quantity: item.quantity
        })),
        paymentType: paymentType,
        residentId: currentUser.id, // <--- O PULO DO GATO: Usa o ID de quem tá logado!
      };

      await api.post('/sales', saleData);
      
      alert('Compra registrada! Obrigado pela honestidade. 🛍️');
      
      setCart([]); 
      loadProducts(); // Recarrega estoque
      
      // Atualiza saldo visualmente
      if (paymentType === 'FIADO') {
        setMyBalance(prev => prev + total);
      }

    } catch (error) {
      alert('Erro ao registrar compra. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  // Filtro de busca
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] gap-4">
      
      {/* --- CABEÇALHO DO MORADOR --- */}
      <div className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Olá, {currentUser?.name.split(' ')[0]} 👋</h1>
          <p className="text-slate-500 text-sm">O que vamos levar para o Apê {currentUser?.apartment} hoje?</p>
        </div>
        <div className="flex items-center gap-4">
            <div className="text-right hidden md:block">
                <p className="text-xs text-slate-400 uppercase font-bold">Saldo Devedor Atual</p>
                <p className={`font-bold text-xl ${myBalance > 0 ? 'text-red-500' : 'text-green-600'}`}>
                    {myBalance.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}
                </p>
            </div>
            <div className="bg-blue-50 p-3 rounded-full text-blue-600">
                <Wallet size={24} />
            </div>
        </div>
      </div>

      <div className="flex flex-1 gap-6 overflow-hidden">
        {/* --- ESQUERDA: VITRINE --- */}
        <div className="flex-1 flex flex-col gap-4 overflow-hidden">
            
            {/* Busca */}
            <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-100 flex items-center gap-3 shrink-0">
            <Search className="text-slate-400" size={20} />
            <input 
                type="text"
                placeholder="O que você está procurando?"
                className="flex-1 outline-none text-lg"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
            </div>

            {/* Grid de Produtos */}
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 overflow-y-auto pb-20 pr-2">
            {filteredProducts.map((product) => (
                <button
                key={product.id}
                onClick={() => addToCart(product)}
                disabled={product.totalStock === 0}
                className={`rounded-xl border text-left transition-all hover:shadow-lg flex flex-col h-auto bg-white overflow-hidden group relative
                    ${product.totalStock === 0 ? 'opacity-50 grayscale cursor-not-allowed' : 'border-slate-200 hover:border-blue-500'}`}
                >
                <div className="h-40 w-full bg-white relative p-4 flex items-center justify-center">
                    <ProductThumbnail barcode={product.barcode} alt={product.name} />
                    {product.totalStock > 0 && (
                        <span className="absolute top-2 right-2 text-[10px] font-bold px-2 py-1 rounded-full bg-slate-100 text-slate-600">
                        Restam {product.totalStock}
                        </span>
                    )}
                </div>

                <div className="p-3 flex flex-col gap-1 border-t border-slate-50">
                    <h3 className="font-semibold text-slate-700 text-sm line-clamp-2 min-h-[2.5rem]">
                    {product.name}
                    </h3>
                    <p className="font-bold text-blue-600 text-lg">
                    {Number(product.price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </p>
                </div>

                {/* Efeito de Clique */}
                <div className="absolute inset-0 bg-blue-600/10 opacity-0 active:opacity-100 transition-opacity pointer-events-none" />
                </button>
            ))}
            </div>
        </div>

        {/* --- DIREITA: CARRINHO (CHECKOUT) --- */}
        <div className="w-80 md:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 flex flex-col overflow-hidden shrink-0 h-full">
            <div className="p-5 bg-slate-900 text-white">
            <h2 className="text-lg font-bold flex items-center gap-2">
                <ShoppingCart className="text-blue-400" /> Meu Carrinho
            </h2>
            </div>

            {/* Lista */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
            {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60">
                <ShoppingCart size={48} className="mb-2" />
                <p>Toque nos produtos</p>
                </div>
            ) : (
                cart.map((item) => (
                <div key={item.id} className="flex justify-between items-center bg-white p-3 rounded-lg shadow-sm border border-slate-100">
                    <div className="flex items-center gap-3 overflow-hidden">
                        <div className="font-bold bg-blue-100 text-blue-700 w-8 h-8 flex items-center justify-center rounded-lg text-sm shrink-0">
                            {item.quantity}
                        </div>
                        <div className="min-w-0">
                            <p className="font-medium text-slate-700 text-sm truncate">{item.name}</p>
                            <p className="text-xs text-slate-400">
                                Unit: {Number(item.price).toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}
                            </p>
                        </div>
                    </div>
                    <button onClick={() => removeFromCart(item.id)} className="text-red-400 p-2 hover:bg-red-50 rounded-full">
                        <Trash2 size={18} />
                    </button>
                </div>
                ))
            )}
            </div>

            {/* Rodapé e Pagamento */}
            <div className="p-5 bg-white border-t border-slate-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
            <div className="mb-4">
                <p className="text-xs font-bold text-slate-400 uppercase mb-2">Como você vai pagar?</p>
                <div className="grid grid-cols-2 gap-2">
                    <button
                        onClick={() => setPaymentType('FIADO')}
                        className={`py-3 rounded-lg text-sm font-bold border-2 transition-all
                        ${paymentType === 'FIADO' 
                            ? 'border-blue-600 bg-blue-50 text-blue-700' 
                            : 'border-slate-100 text-slate-400 hover:border-slate-300'}`}
                    >
                        📝 Pendurar (Fiado)
                    </button>
                    <button
                        onClick={() => setPaymentType('PIX')}
                        className={`py-3 rounded-lg text-sm font-bold border-2 transition-all
                        ${paymentType === 'PIX' 
                            ? 'border-green-500 bg-green-50 text-green-700' 
                            : 'border-slate-100 text-slate-400 hover:border-slate-300'}`}
                    >
                        💠 Pix / QR Code
                    </button>
                </div>
            </div>

            <div className="flex justify-between items-end mb-4">
                <span className="text-slate-500 font-medium">Total da Compra</span>
                <span className="text-3xl font-bold text-slate-800">
                {total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
            </div>

            <button 
                onClick={handleCheckout}
                disabled={loading || cart.length === 0}
                className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 text-white py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
            >
                {loading ? 'Registrando...' : '✅ Finalizar e Pegar'}
            </button>
            </div>
        </div>

      </div>
    </div>
  );
}