import { useEffect, useState } from "react";
import { api } from "../services/api";
import { Package, Plus, Search, Tag } from "lucide-react";
import { ProductThumbnail } from "../components/ProductThumbnail";

// Interface atualizada com o novo campo 'totalStock'
interface Product {
  id: string;
  name: string;
  description: string;
  price: string;
  barcode: string;
  totalStock: number;
}

export function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    try {
      const response = await api.get("/products");
      setProducts(response.data);
    } catch (error) {
      alert("Erro ao carregar produtos");
    } finally {
      setLoading(false);
    }
  }

  // Filtro de busca (Nome ou Código de Barras)
  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.barcode.includes(searchTerm)
  );

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Produtos</h1>
          <p className="text-slate-500">
            Gerencie seu catálogo e confira o estoque.
          </p>
        </div>

        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition-colors shadow-sm">
          <Plus size={20} />
          Novo Produto
        </button>
      </div>

      {/* Barra de Busca */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 mb-6 flex items-center gap-3">
        <Search className="text-slate-400" size={20} />
        <input
          type="text"
          placeholder="Buscar por nome ou código de barras..."
          className="flex-1 outline-none text-slate-700 placeholder-slate-400"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-slate-500 text-sm">
            <tr>
              <th className="px-6 py-4 font-medium">Produto</th>
              <th className="px-6 py-4 font-medium">Código (EAN)</th>
              <th className="px-6 py-4 font-medium">Preço</th>
              <th className="px-6 py-4 font-medium">Estoque Atual</th>
              <th className="px-6 py-4 font-medium text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-500">
                  Carregando...
                </td>
              </tr>
            ) : filteredProducts.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-500">
                  Nenhum produto encontrado.
                </td>
              </tr>
            ) : (
              filteredProducts.map((product) => (
                <tr
                  key={product.id}
                  className="hover:bg-slate-50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 shrink-0 rounded-md overflow-hidden border border-slate-200">
                        <ProductThumbnail
                          barcode={product.barcode}
                          alt={product.name}
                        />
                      </div>

                      {/* Resto das informações continua igual */}
                      <div>
                        <p className="font-semibold text-slate-800">
                          {product.name}
                        </p>
                        <p className="text-xs text-slate-500 truncate max-w-[200px]">
                          {product.description}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600 font-mono text-sm">
                    <div className="flex items-center gap-1">
                      <Tag size={14} className="text-slate-400" />
                      {product.barcode}
                    </div>
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-800">
                    {new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(Number(product.price))}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 rounded-md text-xs font-bold ${
                        product.totalStock > 0
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {product.totalStock} un
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                      Editar
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
