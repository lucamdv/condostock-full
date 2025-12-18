import { useEffect, useState } from 'react';
import { X, Calendar, ShoppingBag, DollarSign } from 'lucide-react';
import { api } from '../services/api';

interface SaleItem {
  id: string;
  quantity: number;
  unitPrice: string;
  product: {
    name: string;
  };
}

interface Sale {
  id: string;
  total: string;
  createdAt: string;
  paymentType: string;
  items: SaleItem[];
}

interface HistoryModalProps {
  residentId: string | null;
  onClose: () => void;
}

export function HistoryModal({ residentId, onClose }: HistoryModalProps) {
  const [history, setHistory] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (residentId) {
      setLoading(true);
      api.get(`/residents/${residentId}/history`)
        .then(res => setHistory(res.data))
        .catch(err => alert('Erro ao carregar histórico'))
        .finally(() => setLoading(false));
    }
  }, [residentId]);

  if (!residentId) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        
        {/* Cabeçalho */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-2xl">
          <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Calendar className="text-blue-500" /> Histórico de Consumo
            </h2>
            <p className="text-sm text-slate-500">Detalhes de todas as compras realizadas.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        {/* Lista de Compras */}
        <div className="overflow-y-auto p-6 flex-1 space-y-4 bg-slate-50/50">
          {loading ? (
            <div className="text-center py-10 text-slate-400">Carregando transações...</div>
          ) : history.length === 0 ? (
            <div className="text-center py-10 flex flex-col items-center text-slate-400">
              <ShoppingBag size={48} className="mb-3 opacity-20" />
              <p>Nenhuma compra registrada ainda.</p>
            </div>
          ) : (
            history.map((sale) => (
              <div key={sale.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                
                {/* Resumo da Venda */}
                <div className="flex justify-between items-start mb-3 pb-3 border-b border-slate-50">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-50 p-2 rounded-lg text-blue-600">
                      <ShoppingBag size={20} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase">
                        {new Date(sale.createdAt).toLocaleDateString('pt-BR')} às {new Date(sale.createdAt).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
                      </p>
                      <p className="text-sm font-medium text-slate-700">
                        Pagamento: <span className="font-bold">{sale.paymentType === 'FIADO' ? '📝 FIADO' : '💰 À VISTA'}</span>
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-slate-800">
                      {Number(sale.total).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </p>
                  </div>
                </div>

                {/* Itens da Venda */}
                <div className="space-y-1 pl-11">
                  {sale.items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm text-slate-600">
                      <span>{item.quantity}x {item.product.name}</span>
                      <span className="text-slate-400">
                        {Number(item.unitPrice).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </span>
                    </div>
                  ))}
                </div>

              </div>
            ))
          )}
        </div>

        {/* Rodapé */}
        <div className="p-4 border-t border-slate-100 bg-white rounded-b-2xl flex justify-end">
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition-colors"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
}