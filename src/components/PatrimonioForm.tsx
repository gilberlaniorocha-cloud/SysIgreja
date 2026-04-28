import { useState } from 'react';
import { Database } from '../types/database';

type Patrimonio = Database['public']['Tables']['patrimonios']['Row'];
type PatrimonioCategoria = Database['public']['Tables']['patrimonio_categorias']['Row'];

interface PatrimonioFormProps {
  initialData?: Patrimonio | null;
  categorias: PatrimonioCategoria[];
  onSubmit: (data: Omit<Patrimonio, 'id' | 'criado_em' | 'igreja_id'>) => void;
  onCancel: () => void;
}

export default function PatrimonioForm({ initialData, categorias, onSubmit, onCancel }: PatrimonioFormProps) {
  const [formData, setFormData] = useState({
    nome: initialData?.nome || '',
    categoria_id: initialData?.categoria_id || '',
    forma_aquisicao: initialData?.forma_aquisicao || '',
    localizacao: initialData?.localizacao || '',
    responsavel: initialData?.responsavel || '',
    data_aquisicao: initialData?.data_aquisicao || '',
    valor: initialData?.valor?.toString() || '',
    condicao: initialData?.condicao || '',
    marca: initialData?.marca || '',
    modelo: initialData?.modelo || '',
    numero_serie: initialData?.numero_serie || '',
    foto_url: initialData?.foto_url || '',
    observacoes: initialData?.observacoes || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      nome: formData.nome,
      categoria_id: formData.categoria_id || null,
      forma_aquisicao: formData.forma_aquisicao || null,
      localizacao: formData.localizacao || null,
      responsavel: formData.responsavel || null,
      data_aquisicao: formData.data_aquisicao || null,
      valor: formData.valor ? Number(formData.valor) : null,
      condicao: formData.condicao || null,
      marca: formData.marca || null,
      modelo: formData.modelo || null,
      numero_serie: formData.numero_serie || null,
      foto_url: formData.foto_url || null,
      observacoes: formData.observacoes || null
    });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 md:p-8 rounded-xl shadow-sm border border-gray-100 space-y-6">
      <h2 className="text-xl font-semibold mb-6 text-gray-900">
        {initialData ? 'Editar Patrimônio' : 'Novo Patrimônio'}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Nome do Patrimônio *</label>
          <input
            type="text"
            required
            value={formData.nome}
            onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
            className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Categoria</label>
          <select
            value={formData.categoria_id}
            onChange={(e) => setFormData({ ...formData, categoria_id: e.target.value })}
            className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
          >
            <option value="">Selecione uma categoria</option>
            {categorias.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.nome}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Forma de Aquisição</label>
          <select
            value={formData.forma_aquisicao}
            onChange={(e) => setFormData({ ...formData, forma_aquisicao: e.target.value })}
            className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
          >
            <option value="">Selecione</option>
            <option value="Compra">Compra</option>
            <option value="Doação">Doação</option>
            <option value="Transferência">Transferência</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Condição</label>
          <select
            value={formData.condicao}
            onChange={(e) => setFormData({ ...formData, condicao: e.target.value })}
            className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
          >
            <option value="">Selecione</option>
            <option value="Novo">Novo</option>
            <option value="Bom">Bom</option>
            <option value="Regular">Regular</option>
            <option value="Precisa manutenção">Precisa manutenção</option>
            <option value="Inutilizado">Inutilizado</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Localização</label>
          <input
            type="text"
            value={formData.localizacao}
            onChange={(e) => setFormData({ ...formData, localizacao: e.target.value })}
            className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Responsável</label>
          <input
            type="text"
            value={formData.responsavel}
            onChange={(e) => setFormData({ ...formData, responsavel: e.target.value })}
            className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Data de Aquisição</label>
          <input
            type="date"
            value={formData.data_aquisicao}
            onChange={(e) => setFormData({ ...formData, data_aquisicao: e.target.value })}
            className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Valor</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={formData.valor}
            onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
            className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Marca</label>
          <input
            type="text"
            value={formData.marca}
            onChange={(e) => setFormData({ ...formData, marca: e.target.value })}
            className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Modelo</label>
          <input
            type="text"
            value={formData.modelo}
            onChange={(e) => setFormData({ ...formData, modelo: e.target.value })}
            className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Número de Série</label>
          <input
            type="text"
            value={formData.numero_serie}
            onChange={(e) => setFormData({ ...formData, numero_serie: e.target.value })}
            className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">URL da Foto</label>
          <input
            type="url"
            value={formData.foto_url}
            onChange={(e) => setFormData({ ...formData, foto_url: e.target.value })}
            placeholder="https://..."
            className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Observações</label>
        <textarea
          rows={3}
          value={formData.observacoes}
          onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
          className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
        />
      </div>

      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
        <button
          type="button"
          onClick={onCancel}
          className="px-5 py-2.5 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="px-5 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all"
        >
          Salvar
        </button>
      </div>
    </form>
  );
}
