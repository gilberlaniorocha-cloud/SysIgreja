import React, { useState, useEffect } from 'react';
import { getSubcategorias, createSubcategoria, updateSubcategoria, deleteSubcategoria } from '../lib/queries';
import { Database } from '../types/database';
import ConfirmModal from './ConfirmModal';
import { Plus, Edit2, Trash2, X } from 'lucide-react';

type Subcategoria = Database['public']['Tables']['subcategorias']['Row'];
type Categoria = Database['public']['Tables']['categorias']['Row'];

interface SubcategoriasModalProps {
  categoria: Categoria;
  onClose: () => void;
}

export default function SubcategoriasModal({ categoria, onClose }: SubcategoriasModalProps) {
  const [subcategorias, setSubcategorias] = useState<Subcategoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [nome, setNome] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingSubcategoria, setDeletingSubcategoria] = useState<Subcategoria | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const loadSubcategorias = async () => {
    try {
      const data = await getSubcategorias(categoria.id);
      setSubcategorias(data);
    } catch (error) {
      console.error('Error loading subcategorias:', error);
      setError('Erro ao carregar subcategorias.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubcategorias();
  }, [categoria.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) return;

    setError(null);
    setSaving(true);
    try {
      if (editingId) {
        await updateSubcategoria(editingId, { nome });
      } else {
        await createSubcategoria({ nome, categoria_id: categoria.id });
      }
      setNome('');
      setEditingId(null);
      loadSubcategorias();
    } catch (error) {
      console.error('Error saving subcategoria:', error);
      setError('Erro ao salvar subcategoria.');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (subcategoria: Subcategoria) => {
    setEditingId(subcategoria.id);
    setNome(subcategoria.nome);
  };

  const handleDeleteClick = (subcategoria: Subcategoria) => {
    setDeletingSubcategoria(subcategoria);
  };

  const handleConfirmDelete = async () => {
    if (!deletingSubcategoria) return;
    setError(null);
    try {
      await deleteSubcategoria(deletingSubcategoria.id);
      setDeletingSubcategoria(null);
      loadSubcategorias();
    } catch (error) {
      console.error('Error deleting subcategoria:', error);
      setError('Erro ao excluir subcategoria. Ela pode estar sendo usada.');
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setNome('');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm transition-opacity" aria-hidden="true" onClick={onClose}></div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className="relative inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full z-10">
          <div className="bg-white px-6 pt-6 pb-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900" id="modal-title">
                Subcategorias de {categoria.nome}
              </h3>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors bg-gray-50 hover:bg-gray-100 p-2 rounded-full">
                <X className="h-5 w-5" />
              </button>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-start">
                <div className="flex-shrink-0">
                  <X className="h-5 w-5 text-red-400" aria-hidden="true" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mb-8 flex gap-3">
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Nome da subcategoria"
                className="flex-1 rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                required
              />
              {editingId && (
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="px-5 py-2.5 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all"
                >
                  Cancelar
                </button>
              )}
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center px-5 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? '...' : editingId ? 'Salvar' : 'Adicionar'}
              </button>
            </form>

            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              </div>
            ) : subcategorias.length === 0 ? (
              <div className="py-8 text-center text-sm text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                Nenhuma subcategoria cadastrada.
              </div>
            ) : (
              <div className="max-h-64 overflow-y-auto pr-2 -mr-2">
                <ul className="space-y-2">
                  {subcategorias.map((sub) => (
                    <li key={sub.id} className="p-4 bg-gray-50 rounded-xl border border-gray-100 flex justify-between items-center group hover:border-indigo-100 hover:bg-indigo-50/30 transition-all">
                      <span className="text-sm font-medium text-gray-900">{sub.nome}</span>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleEdit(sub)}
                          className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(sub)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Excluir"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <div className="bg-gray-50/50 px-6 py-4 border-t border-gray-100 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>

      {deletingSubcategoria && (
        <ConfirmModal
          title="Excluir Subcategoria"
          message={`Tem certeza que deseja excluir a subcategoria "${deletingSubcategoria.nome}"?`}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeletingSubcategoria(null)}
        />
      )}
    </div>
  );
}
