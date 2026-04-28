import { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth';
import { getPatrimonioCategorias, createPatrimonioCategoria, updatePatrimonioCategoria, deletePatrimonioCategoria } from '../lib/queries';
import { Database } from '../types/database';
import { X, Edit2, Trash2, Plus } from 'lucide-react';
import ConfirmModal from './ConfirmModal';

type Categoria = Database['public']['Tables']['patrimonio_categorias']['Row'];

interface PatrimonioCategoriasModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PatrimonioCategoriasModal({ isOpen, onClose }: PatrimonioCategoriasModalProps) {
  const { igrejaId } = useAuth();
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [nome, setNome] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadCategorias = async () => {
    if (!igrejaId) return;
    try {
      const data = await getPatrimonioCategorias(igrejaId);
      setCategorias(data);
    } catch (error) {
      console.error('Error loading categorias:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadCategorias();
    }
  }, [isOpen, igrejaId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || !igrejaId) return;

    setError(null);
    try {
      if (editingId) {
        await updatePatrimonioCategoria(editingId, { nome });
      } else {
        await createPatrimonioCategoria({ nome, igreja_id: igrejaId });
      }
      setNome('');
      setEditingId(null);
      loadCategorias();
    } catch (error) {
      console.error('Error saving categoria:', error);
      setError('Erro ao salvar categoria.');
    }
  };

  const handleEdit = (categoria: Categoria) => {
    setNome(categoria.nome);
    setEditingId(categoria.id);
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    setError(null);
    try {
      await deletePatrimonioCategoria(deletingId);
      setDeletingId(null);
      loadCategorias();
    } catch (error: any) {
      console.error('Error deleting categoria:', error);
      setError('Erro ao excluir categoria. Ela pode estar em uso.');
      setDeletingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-opacity" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 max-h-[90vh] flex flex-col shadow-xl transform transition-all" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-gray-900" id="modal-title">
            Categorias de Patrimônio
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors bg-gray-50 hover:bg-gray-100 p-2 rounded-full">
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start">
            <div className="flex-shrink-0">
              <X className="h-5 w-5 text-red-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mb-6 flex gap-3">
          <input
            type="text"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Nome da categoria"
            className="flex-1 rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
            required
          />
          <button
            type="submit"
            className="inline-flex items-center px-5 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all"
          >
            {editingId ? 'Salvar' : <Plus className="h-5 w-5" />}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={() => {
                setEditingId(null);
                setNome('');
              }}
              className="inline-flex items-center px-5 py-2.5 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all"
            >
              Cancelar
            </button>
          )}
        </form>

        <div className="flex-1 overflow-y-auto pr-2 -mr-2">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : (
            <ul className="space-y-2">
              {categorias.map((categoria) => (
                <li key={categoria.id} className="p-4 bg-gray-50 rounded-xl border border-gray-100 flex justify-between items-center group hover:border-indigo-100 hover:bg-indigo-50/30 transition-all">
                  <span className="text-sm font-medium text-gray-900">{categoria.nome}</span>
                  <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleEdit(categoria)}
                      className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      title="Editar"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setDeletingId(categoria.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Excluir"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              ))}
              {categorias.length === 0 && (
                <li className="py-8 text-center text-sm text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                  Nenhuma categoria cadastrada.
                </li>
              )}
            </ul>
          )}
        </div>
      </div>

      {deletingId && (
        <ConfirmModal
          title="Excluir Categoria"
          message="Tem certeza que deseja excluir esta categoria? Esta ação não poderá ser desfeita se a categoria não estiver em uso."
          onConfirm={handleDelete}
          onCancel={() => setDeletingId(null)}
        />
      )}
    </div>
  );
}
