import { useEffect, useState } from "react";
import { api } from "../services/api";
import {
  Plus,
  Search,
  Trash2,
  Edit,
  X,
  Save,
  User,
  Mail,
  FileText,
  Shield,
  Home,
  Check,
  AlertCircle,
} from "lucide-react";

interface Resident {
  id: string;
  name: string;
  cpf: string;
  email: string;
  phone: string;
  apartment: string;
  block: string;
  role: "ADMIN" | "RESIDENT";
  unitRole: "OWNER" | "MEMBER";
  status: "ACTIVE" | "PENDING" | "REJECTED";
}

export function Residents() {
  const [residents, setResidents] = useState<Resident[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    cpf: "",
    email: "",
    phone: "",
    apartment: "",
    block: "",
    profileType: "OWNER",
  });

  useEffect(() => {
    loadResidents();
  }, []);

  async function loadResidents() {
    try {
      const response = await api.get("/residents");
      setResidents(response.data);
    } catch (error) {
      console.error("Erro ao carregar moradores", error);
    } finally {
      setLoading(false);
    }
  }

  // --- LÓGICA DE AGRUPAMENTO ---
  const filteredResidents = residents.filter(
    (r) =>
      r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.apartment.includes(searchTerm) ||
      r.cpf.includes(searchTerm)
  );

  // Agrupa os moradores por "Bloco + Apartamento"
  const groupedResidents = filteredResidents.reduce((acc, resident) => {
    const key = `${resident.block}-${resident.apartment}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(resident);
    return acc;
  }, {} as Record<string, Resident[]>);

  // --- FUNÇÕES DE AÇÃO ---
  async function handleUpdateStatus(
    id: string,
    newStatus: "ACTIVE" | "REJECTED"
  ) {
    try {
      // Log para você ver no console se o ID e o Status estão vindo certos
      console.log(`Tentando atualizar morador ${id} para ${newStatus}`);

      // Enviamos o status dentro de um objeto, como o Controller espera
      await api.patch(`/residents/${id}/status`, { status: newStatus });

      alert(
        newStatus === "ACTIVE"
          ? "Morador aprovado com sucesso!"
          : "Solicitação rejeitada."
      );

      // Recarrega a lista para sumir o alerta de pendente
      loadResidents();
    } catch (error: any) {
      console.error("Erro detalhado:", error.response?.data || error.message);
      alert("Erro ao atualizar status. Verifique os logs do servidor.");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Tem certeza?")) return;
    try {
      await api.delete(`/residents/${id}`);
      loadResidents();
    } catch (error) {
      alert("Erro ao deletar.");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // 1. Traduz o perfil para o formato que o Backend espera
    let role = "RESIDENT";
    let unitRole = "MEMBER";

    if (formData.profileType === "ADMIN") {
      role = "ADMIN";
      unitRole = "OWNER";
    } else if (formData.profileType === "OWNER") {
      role = "RESIDENT";
      unitRole = "OWNER";
    }

    // 2. Monta o objeto de envio limpando espaços vazios
    const payload: any = {
      name: formData.name.trim(),
      cpf: formData.cpf.replace(/\D/g, ""), // Envia apenas números
      email: formData.email.trim() || undefined,
      phone: formData.phone.trim() || undefined,
      apartment: formData.apartment.trim(),
      block: formData.block.trim(),
      role: role,
      unitRole: unitRole,
      status: "ACTIVE", // Morador criado pelo síndico já nasce ativo
    };

    try {
      if (editingId) {
        await api.patch(`/residents/${editingId}`, payload);
        alert("Morador atualizado!");
      } // Dentro do else (onde cria novo morador) no Residents.tsx
      else {
        // 👇 REMOVA o "...payload, password: ..." e envie APENAS o payload
        await api.post("/residents", payload);

        alert("Morador cadastrado com sucesso!");
      }

      setIsModalOpen(false);
      loadResidents(); // Recarrega a lista agrupada
    } catch (error: any) {
      // 4. Debug para ver exatamente o que o validador barrou
      console.error("Erro 400 detalhes:", error.response?.data);
      const apiMessage = error.response?.data?.message;
      alert(
        Array.isArray(apiMessage)
          ? apiMessage.join(", ")
          : "Erro ao salvar: Verifique se o CPF já existe."
      );
    }
  }

  function handleOpenEdit(resident: Resident) {
    setEditingId(resident.id);
    setFormData({
      name: resident.name,
      cpf: resident.cpf,
      email: resident.email || "",
      phone: resident.phone || "",
      apartment: resident.apartment,
      block: resident.block,
      profileType:
        resident.role === "ADMIN"
          ? "ADMIN"
          : resident.unitRole === "OWNER"
          ? "OWNER"
          : "MEMBER",
    });
    setIsModalOpen(true);
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Moradores por Unidade
          </h1>
          <p className="text-slate-500">
            Gestão agrupada e aprovações pendentes
          </p>
        </div>
        <button
          onClick={() => {
            setEditingId(null);
            setIsModalOpen(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-md hover:bg-blue-700 transition-all"
        >
          <Plus size={20} /> Novo Cadastro
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 mb-8 flex items-center gap-3">
        <Search className="text-slate-400" size={20} />
        <input
          type="text"
          placeholder="Buscar por nome, CPF ou apartamento..."
          className="flex-1 outline-none text-slate-600"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {loading ? (
        <p className="text-center text-slate-400 animate-pulse">
          Carregando dados...
        </p>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedResidents)
            .sort()
            .map(([unit, unitResidents]) => (
              <div
                key={unit}
                className="bg-slate-50/50 rounded-2xl p-6 border border-slate-100"
              >
                <div className="flex items-center gap-2 mb-4">
                  <div className="bg-white p-2 rounded-lg shadow-sm border border-slate-200 text-blue-600">
                    <Home size={20} />
                  </div>
                  <h2 className="text-lg font-bold text-slate-700">
                    Bloco {unit.split("-")[0]} - Apt {unit.split("-")[1]}
                  </h2>
                  <span className="text-xs bg-slate-200 text-slate-500 px-2 py-0.5 rounded-full">
                    {unitResidents.length} moradores
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {unitResidents.map((resident) => (
                    <div
                      key={resident.id}
                      className={`bg-white p-5 rounded-xl border shadow-sm relative transition-all ${
                        resident.status === "PENDING"
                          ? "border-yellow-200 ring-2 ring-yellow-50"
                          : "border-slate-100"
                      }`}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                              resident.role === "ADMIN"
                                ? "bg-red-100 text-red-600"
                                : resident.unitRole === "OWNER"
                                ? "bg-blue-100 text-blue-600"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {resident.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <h3 className="font-semibold text-slate-800 leading-tight">
                              {resident.name}
                            </h3>
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                                resident.role === "ADMIN"
                                  ? "bg-red-50 text-red-700"
                                  : resident.unitRole === "OWNER"
                                  ? "bg-blue-50 text-blue-700"
                                  : "bg-slate-100 text-slate-600"
                              }`}
                            >
                              {resident.role === "ADMIN"
                                ? "Síndico"
                                : resident.unitRole === "OWNER"
                                ? "Titular"
                                : "Dependente"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* STATUS PENDENTE COM AÇÕES */}
                      {resident.status === "PENDING" ? (
                        <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-100">
                          <p className="text-xs text-yellow-700 font-medium flex items-center gap-1 mb-3">
                            <AlertCircle size={14} /> Solicitação Pendente
                          </p>
                          <div className="flex gap-2">
                            <button
                              onClick={() =>
                                handleUpdateStatus(resident.id, "ACTIVE")
                              }
                              className="flex-1 bg-green-600 text-white text-xs py-2 rounded-md font-bold flex items-center justify-center gap-1 hover:bg-green-700"
                            >
                              <Check size={14} /> Aprovar
                            </button>
                            <button
                              onClick={() =>
                                handleUpdateStatus(resident.id, "REJECTED")
                              }
                              className="flex-1 bg-white text-red-600 border border-red-200 text-xs py-2 rounded-md font-bold flex items-center justify-center gap-1 hover:bg-red-50"
                            >
                              <X size={14} /> Negar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-slate-50">
                          <button
                            onClick={() => handleOpenEdit(resident)}
                            className="text-slate-400 hover:text-blue-600 p-1"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(resident.id)}
                            className="text-slate-400 hover:text-red-600 p-1"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
        </div>
      )}

      {/* --- MODAL DE CADASTRO / EDIÇÃO --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl animate-fade-in overflow-hidden">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800">
                {editingId ? "Editar Perfil" : "Novo Cadastro"}
              </h2>
              <button onClick={() => setIsModalOpen(false)}>
                <X className="text-slate-400 hover:text-slate-600" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Seletor de Nível de Acesso */}
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                <label className="block text-sm font-bold text-blue-900 mb-2 flex items-center gap-2">
                  <Shield size={16} /> Nível de Acesso
                </label>
                <select
                  className="w-full p-2 rounded-lg border-blue-200 outline-none text-slate-700 bg-white"
                  value={formData.profileType}
                  onChange={(e) =>
                    setFormData({ ...formData, profileType: e.target.value })
                  }
                >
                  <option value="ADMIN">👑 Administrador (Síndico)</option>
                  <option value="OWNER">🏠 Proprietário (Titular)</option>
                  <option value="MEMBER">👤 Morador Comum (Dependente)</option>
                </select>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Nome Completo
                  </label>
                  <input
                    required
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 outline-none focus:border-blue-500"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    CPF (Login)
                  </label>
                  <input
                    required
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 outline-none focus:border-blue-500"
                    placeholder="000.000.000-00"
                    value={formData.cpf}
                    onChange={(e) =>
                      setFormData({ ...formData, cpf: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Apartamento
                  </label>
                  <input
                    required
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 outline-none focus:border-blue-500"
                    value={formData.apartment}
                    onChange={(e) =>
                      setFormData({ ...formData, apartment: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Bloco
                  </label>
                  <input
                    required
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 outline-none focus:border-blue-500"
                    value={formData.block}
                    onChange={(e) =>
                      setFormData({ ...formData, block: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 font-bold"
                >
                  <Save size={18} />{" "}
                  {editingId ? "Salvar Alterações" : "Concluir Cadastro"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
