import React, { useState, useEffect } from 'react';
import { Database } from '../types/database';
import { getSubcategorias } from '../lib/queries';

type Receita = Database['public']['Tables']['receitas']['Row'];
type Conta = Database['public']['Tables']['contas_bancarias']['Row'];
type Categoria = Database['public']['Tables']['categorias']['Row'];
type Subcategoria = Database['public']['Tables']['subcategorias']['Row'];

interface ReceitaFormProps {
  initialData?: Receita | null;
  contas: Conta[];
  categorias: Categoria[];
  onSubmit: (data: Omit<Receita, 'id' | 'criado_em' | 'igreja_id'>) => Promise<void>;
  onCancel: () => void;
}

export default function ReceitaForm({ initialData, contas, categorias, onSubmit, onCancel }: ReceitaFormProps) {
  const [contaId, setContaId] = useState(initialData?.conta_id || '');
  const [categoriaId, setCategoriaId] = useState(initialData?.categoria_id || '');
  const [subcategoriaId, setSubcategoriaId] = useState(initialData?.subcategoria_id || '');
  const [subcategorias, setSubcategorias] = useState<Subcategoria[]>([]);
  const [descricao, setDescricao] = useState(initialData?.descricao || '');
  const [valor, setValor] = useState(initialData?.valor?.toString() || '');
  const [dataRecebimento, setDataRecebimento] = useState(initialData?.data_recebimento || new Date().toISOString().split('T')[0]);
  const [recebido, setRecebido] = useState(initialData?.recebido ?? true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (categoriaId) {
      getSubcategorias(categoriaId).then(setSubcategorias).catch(console.error);
    } else {
      setSubcategorias([]);
      setSubcategoriaId('');
    }
  }, [categoriaId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!contaId) {
      setError('Por favor, selecione uma conta bancária.');
      return;
    }
    setLoading(true);
    try {
      await onSubmit({
        conta_id: contaId,
        categoria_id: categoriaId || null,
        subcategoria_id: subcategoriaId || null,
        descricao: descricao || null,
        valor: parseFloat(valor),
        data_recebimento: dataRecebimento,
        recebido: recebido,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 md:p-8 rounded-xl shadow-sm border border-gray-100">
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="contaId" className="block text-sm font-medium text-gray-700 mb-1.5">Conta Bancária</label>
          <select
            id="contaId"
            required
            value={contaId}
            onChange={(e) => setContaId(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
          >
            <option value="">Selecione uma conta</option>
            {contas.map((conta) => (
              <option key={conta.id} value={conta.id}>{conta.nome_conta}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="categoriaId" className="block text-sm font-medium text-gray-700 mb-1.5">Categoria (Tipo de Receita)</label>
          <select
            id="categoriaId"
            value={categoriaId}
            onChange={(e) => {
              setCategoriaId(e.target.value);
              setSubcategoriaId('');
            }}
            className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
          >
            <option value="">Selecione uma categoria (opcional)</option>
            {categorias.map((categoria) => (
              <option key={categoria.id} value={categoria.id}>{categoria.nome}</option>
            ))}
          </select>
        </div>
        {subcategorias.length > 0 && (
          <div>
            <label htmlFor="subcategoriaId" className="block text-sm font-medium text-gray-700 mb-1.5">Subcategoria</label>
            <select
              id="subcategoriaId"
              value={subcategoriaId}
              onChange={(e) => setSubcategoriaId(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
            >
              <option value="">Selecione uma subcategoria (opcional)</option>
              {subcategorias.map((subcategoria) => (
                <option key={subcategoria.id} value={subcategoria.id}>{subcategoria.nome}</option>
              ))}
            </select>
          </div>
        )}
        <div>
          <label htmlFor="descricao" className="block text-sm font-medium text-gray-700 mb-1.5">Descrição</label>
          <input
            type="text"
            id="descricao"
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
          />
        </div>
        <div>
          <label htmlFor="valor" className="block text-sm font-medium text-gray-700 mb-1.5">Valor</label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            id="valor"
            required
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
          />
        </div>
        <div>
          <label htmlFor="dataRecebimento" className="block text-sm font-medium text-gray-700 mb-1.5">Data do Recebimento</label>
          <input
            type="date"
            id="dataRecebimento"
            required
            value={dataRecebimento}
            onChange={(e) => setDataRecebimento(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
          />
        </div>
        <div className="flex items-center mt-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
          <input
            id="recebido"
            type="checkbox"
            checked={recebido}
            onChange={(e) => setRecebido(e.target.checked)}
            className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded transition-all"
          />
          <label htmlFor="recebido" className="ml-3 block text-sm font-medium text-gray-900">
            Receita já recebida
          </label>
        </div>
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
          disabled={loading}
          className="px-5 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-all"
        >
          {loading ? 'Salvando...' : 'Salvar'}
        </button>
      </div>
    </form>
  );
}
