import { useEffect, useState, useRef } from "react";
import { api } from "../services/api";
import { 
  Package, Plus, Search, Tag, UploadCloud, 
  Trash2, X, FileText, CheckCircle, Save, Edit, Image as ImageIcon 
} from "lucide-react";
import { ProductThumbnail } from "../components/ProductThumbnail";

interface Product {
  id?: string;
  name: string;
  description?: string;
  price: number | string;
  barcode: string;
  totalStock: number;
  imageUrl?: string;
}

interface ImportedItem {
  name: string;
  barcode: string;
  price: number;
  stock: number;
  description: string;
}

export function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [importedItems, setImportedItems] = useState<ImportedItem[]>([]);
  const [formData, setFormData] = useState({ 
    name: '', barcode: '', price: '', stock: '', description: '', imageUrl: '' 
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    try {
      const response = await api.get("/products");
      setProducts(response.data);
    } catch (error) {
      console.error("Erro ao carregar produtos", error);
    } finally {
      setLoading(false);
    }
  }

  function handleOpenCreate() {
    setEditingId(null);
    setFormData({ name: '', barcode: '', price: '', stock: '', description: '', imageUrl: '' });
    setIsManualModalOpen(true);
  }

  function handleOpenEdit(product: Product) {
    setEditingId(product.id!);
    setFormData({
      name: product.name,
      barcode: product.barcode,
      price: String(product.price),
      stock: String(product.totalStock),
      description: product.description || '',
      imageUrl: product.imageUrl || ''
    });
    setIsManualModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    const payload = {
        ...formData,
        price: parseFloat(formData.price as string),
        stock: parseFloat(formData.stock as string)
    };

    try {
      if (editingId) {
        await api.patch(`/products/${editingId}`, payload);
        alert('Produto atualizado!');
      } else {
        await api.post('/products', payload);
        alert('Produto criado!');
      }
      setIsManualModalOpen(false);
      loadProducts();
    } catch (error) {
      alert('Erro ao salvar.');
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => parseXML(e.target?.result as string);
    reader.readAsText(file);
    event.target.value = '';
  };

  const parseXML = (xmlText: string) => {
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlText, "text/xml");
      const items = xmlDoc.getElementsByTagName("det");
      const parsedProducts: ImportedItem[] = [];

      for (let i = 0; i < items.length; i++) {
        const prod = items[i].getElementsByTagName("prod")[0];
        const name = prod.getElementsByTagName("xProd")[0]?.textContent || "Sem Nome";
        const barcode = prod.getElementsByTagName("cEAN")[0]?.textContent || prod.getElementsByTagName("cProd")[0]?.textContent || "";
        const quantity = parseFloat(prod.getElementsByTagName("qCom")[0]?.textContent || "0");
        const price = parseFloat(prod.getElementsByTagName("vUnCom")[0]?.textContent || "0");

        if (barcode && barcode !== "SEM GTIN") {
            parsedProducts.push({ name, barcode, stock: quantity, price, description: 'Importado via XML' });
        }
      }
      if (parsedProducts.length > 0) {
        setImportedItems(parsedProducts);
        setIsImportModalOpen(true);
      } else { alert("Nenhum produto válido encontrado."); }
    } catch (error) { alert("Erro ao ler XML."); }
  };

  const confirmImport = async () => {
    let count = 0;
    for (const item of importedItems) {
      try { await api.post('/products', item); count++; } catch (e) {}
    }
    alert(`${count} produtos importados!`);
    setIsImportModalOpen(false);
    loadProducts();
  };

  async function handleDelete(id: string) {
    if (!confirm('Tem certeza?')) return;
    try { await api.delete(`/products/${id}`); loadProducts(); } catch (e) { alert('Erro ao deletar.'); }
  }

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.barcode.includes(searchTerm));

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-2">
            <Package className="text-blue-600" /> Produtos
          </h1>
          <p className="text-slate-500">Gerencie seu catálogo e ajuste as imagens.</p>
        </div>

        <div className="flex gap-2">
            <input type="file" accept=".xml" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
            <button onClick={() => fileInputRef.current?.click()} className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition-colors shadow-sm">
                <UploadCloud size={20} /> Importar NF-e
            </button>
            <button onClick={handleOpenCreate} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition-colors shadow-sm">
                <Plus size={20} /> Novo Produto
            </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 mb-6 flex items-center gap-3">
        <Search className="text-slate-400" size={20} />
        <input type="text" placeholder="Buscar por nome ou código de barras..." className="flex-1 outline-none text-slate-700" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-slate-500 text-sm">
            <tr>
              <th className="px-6 py-4 font-medium">Produto</th>
              <th className="px-6 py-4 font-medium">Preço</th>
              <th className="px-6 py-4 font-medium">Estoque</th>
              <th className="px-6 py-4 font-medium text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? <tr><td colSpan={4} className="p-8 text-center">Carregando...</td></tr> : 
             filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 shrink-0 rounded-lg overflow-hidden border border-slate-200 bg-white p-1 flex items-center justify-center">
                        <ProductThumbnail barcode={product.barcode} alt={product.name} src={product.imageUrl} />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800">{product.name}</p>
                        <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
                            <Tag size={12} /> {product.barcode}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-800">
                    {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(product.price))}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-md text-xs font-bold ${product.totalStock > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {product.totalStock} un
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right flex justify-end gap-2">
                    <button onClick={() => handleOpenEdit(product)} className="text-slate-400 hover:text-blue-600 p-2 transition-colors" title="Editar">
                      <Edit size={18} />
                    </button>
                    <button onClick={() => handleDelete(product.id!)} className="text-slate-400 hover:text-red-600 p-2 transition-colors" title="Excluir">
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>

      {isImportModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-2xl p-6 shadow-2xl">
                <div className="flex justify-between items-center mb-4 border-b pb-4">
                    <h2 className="text-xl font-bold flex items-center gap-2"><FileText className="text-green-600"/> Confirmar Importação</h2>
                    <button onClick={() => setIsImportModalOpen(false)}><X className="text-slate-400" /></button>
                </div>
                <div className="max-h-60 overflow-auto mb-4 bg-slate-50 rounded-lg p-2">
                    {importedItems.map((i, idx) => (
                        <div key={idx} className="flex justify-between border-b last:border-0 p-2 text-sm">
                            <div><p className="font-bold">{i.name}</p><p className="text-xs text-slate-500">{i.barcode}</p></div>
                            <div className="text-right"><p className="font-bold">x{i.stock}</p><p className="text-green-600">R$ {i.price}</p></div>
                        </div>
                    ))}
                </div>
                <div className="flex justify-end gap-3">
                    <button onClick={() => setIsImportModalOpen(false)} className="px-4 py-2 bg-slate-100 rounded-lg">Cancelar</button>
                    <button onClick={confirmImport} className="px-4 py-2 bg-green-600 text-white rounded-lg font-bold flex items-center gap-2"><CheckCircle size={18}/> Confirmar</button>
                </div>
            </div>
        </div>
      )}

      {isManualModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
             <div className="flex justify-between items-center mb-6 border-b pb-4">
                 <h2 className="text-xl font-bold text-slate-800">{editingId ? 'Editar Produto' : 'Novo Produto'}</h2>
                 <button onClick={() => setIsManualModalOpen(false)}><X className="text-slate-400 hover:text-slate-600" /></button>
             </div>
             <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Nome</label>
                    <input required className="w-full px-4 py-2 border rounded-lg" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Código de Barras</label>
                    <input required className="w-full px-4 py-2 border rounded-lg font-mono" value={formData.barcode} onChange={e => setFormData({...formData, barcode: e.target.value})} />
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <label className="block text-xs font-bold text-slate-500 mb-1 flex items-center gap-1 uppercase">
                        <ImageIcon size={12}/> URL da Imagem (Opcional)
                    </label>
                    <input placeholder="Cole o link da imagem aqui..." className="w-full px-3 py-2 border rounded-md text-sm bg-white" value={formData.imageUrl} onChange={e => setFormData({...formData, imageUrl: e.target.value})} />
                    {formData.imageUrl && (
                        <div className="mt-2 w-full h-32 bg-white rounded border flex items-center justify-center overflow-hidden">
                            <img src={formData.imageUrl} alt="Preview" className="h-full object-contain" />
                        </div>
                    )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Preço</label>
                        <input required type="number" step="0.01" className="w-full px-4 py-2 border rounded-lg" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Estoque</label>
                        <input required type="number" className="w-full px-4 py-2 border rounded-lg" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} />
                    </div>
                </div>
                <div className="pt-4 flex gap-3">
                    <button type="button" onClick={() => setIsManualModalOpen(false)} className="flex-1 py-2 bg-slate-100 rounded-lg">Cancelar</button>
                    <button type="submit" className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-bold flex items-center justify-center gap-2"><Save size={18} /> Salvar</button>
                </div>
             </form>
          </div>
        </div>
      )}
    </div>
  );
}