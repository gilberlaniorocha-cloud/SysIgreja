import React, { useEffect, useState } from 'react';
import { useAuth } from '../lib/auth';
import { getCategorias, createCategoria, updateCategoria, deleteCategoria, getAllSubcategorias, createSubcategoria } from '../lib/queries';
import { Database } from '../types/database';
import DataTable from '../components/DataTable';
import SubcategoriasModal from '../components/SubcategoriasModal';
import ConfirmModal from '../components/ConfirmModal';
import { Plus, List, Download, Upload } from 'lucide-react';

import { ErrorBoundary } from '../components/ErrorBoundary';

type Categoria = Database['public']['Tables']['categorias']['Row'];

export default function Categorias() {
  const { igrejaId } = useAuth();
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategoria, setEditingCategoria] = useState<Categoria | null>(null);
  const [deletingCategoria, setDeletingCategoria] = useState<Categoria | null>(null);
  const [managingSubcategorias, setManagingSubcategorias] = useState<Categoria | null>(null);
  
  const [nome, setNome] = useState('');
  const [tipo, setTipo] = useState<'receita' | 'despesa'>('receita');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCategorias = async () => {
    if (!igrejaId) return;
    try {
      const data = await getCategorias(igrejaId);
      setCategorias(data);
    } catch (error) {
      console.error('Error loading categorias:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategorias();
  }, [igrejaId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!igrejaId) return;
    
    setError(null);
    setSaving(true);
    try {
      if (editingCategoria) {
        await updateCategoria(editingCategoria.id, { nome, tipo });
      } else {
        await createCategoria({ nome, tipo, igreja_id: igrejaId });
      }
      setIsFormOpen(false);
      setEditingCategoria(null);
      setNome('');
      setTipo('receita');
      loadCategorias();
    } catch (error) {
      console.error('Error saving categoria:', error);
      setError('Ocorreu um erro ao salvar a categoria. Por favor, tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = (categoria: Categoria) => {
    setDeletingCategoria(categoria);
  };

  const handleConfirmDelete = async () => {
    if (!deletingCategoria) return;
    setError(null);
    try {
      await deleteCategoria(deletingCategoria.id);
      setDeletingCategoria(null);
      loadCategorias();
    } catch (error) {
      console.error('Error deleting categoria:', error);
      setError('Erro ao excluir categoria. Ela pode estar sendo usada em alguma receita ou despesa.');
    }
  };

  const openEditForm = (categoria: Categoria) => {
    setEditingCategoria(categoria);
    setNome(categoria.nome);
    setTipo(categoria.tipo as 'receita' | 'despesa');
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingCategoria(null);
    setNome('');
    setTipo('receita');
  };

  const handleExport = async () => {
    if (!igrejaId) return;
    try {
      const allSubcategorias = await getAllSubcategorias(igrejaId);
      
      const exportData = categorias.map(cat => ({
        nome: cat.nome,
        tipo: cat.tipo,
        subcategorias: allSubcategorias
          .filter(sub => sub.categoria_id === cat.id)
          .map(sub => ({ nome: sub.nome }))
      }));

      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", "categorias.json");
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
    } catch (error) {
      console.error('Error exporting categorias:', error);
      setError('Erro ao exportar categorias.');
    }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !igrejaId) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        setLoading(true);
        const importedData = JSON.parse(event.target?.result as string);
        
        if (!Array.isArray(importedData)) {
          throw new Error('Formato de arquivo inválido.');
        }

        for (const cat of importedData) {
          if (!cat.nome || !cat.tipo) continue;
          
          const newCat = await createCategoria({
            nome: cat.nome,
            tipo: cat.tipo,
            igreja_id: igrejaId
          });

          if (cat.subcategorias && Array.isArray(cat.subcategorias)) {
            for (const sub of cat.subcategorias) {
              if (sub.nome) {
                await createSubcategoria({
                  nome: sub.nome,
                  categoria_id: newCat.id
                });
              }
            }
          }
        }
        
        await loadCategorias();
        setError(null);
      } catch (error) {
        console.error('Error importing categorias:', error);
        setError('Erro ao importar categorias. Verifique se o arquivo é válido.');
      } finally {
        setLoading(false);
        e.target.value = '';
      }
    };
    reader.readAsText(file);
  };

  const columns = [
    { header: 'Nome', accessor: 'nome' as keyof Categoria },
    { 
      header: 'Tipo', 
      accessor: (row: Categoria) => row.tipo === 'receita' ? 'Receita' : 'Despesa' 
    },
  ];

  if (loading) return <div>Carregando categorias...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Categorias</h1>
        {!isFormOpen && (
          <div className="flex space-x-3">
            <button
              onClick={handleExport}
              className="inline-flex items-center px-4 py-2 border border-gray-200 rounded-xl shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all"
              title="Exportar categorias para arquivo JSON"
            >
              <Download className="-ml-1 mr-2 h-5 w-5 text-gray-400" />
              Exportar
            </button>
            
            <label className="inline-flex items-center px-4 py-2 border border-gray-200 rounded-xl shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all cursor-pointer" title="Importar categorias de arquivo JSON">
              <Upload className="-ml-1 mr-2 h-5 w-5 text-gray-400" />
              Importar
              <input
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleImport}
              />
            </label>

            <button
              onClick={() => {
                setIsFormOpen(true);
                setError(null);
              }}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
            >
              <Plus className="-ml-1 mr-2 h-5 w-5" />
              Nova Categoria
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {isFormOpen ? (
        <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-lg shadow">
          <div>
            <label htmlFor="nome" className="block text-sm font-medium text-gray-700">Nome da Categoria</label>
            <input
              type="text"
              id="nome"
              required
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
            />
          </div>
          <div>
            <label htmlFor="tipo" className="block text-sm font-medium text-gray-700">Tipo</label>
            <select
              id="tipo"
              required
              value={tipo}
              onChange={(e) => setTipo(e.target.value as 'receita' | 'despesa')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
            >
              <option value="receita">Receita</option>
              <option value="despesa">Despesa</option>
            </select>
          </div>
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={closeForm}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
            >
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      ) : (
        <DataTable
          columns={columns}
          data={categorias}
          onEdit={openEditForm}
          onDelete={handleDeleteClick}
          customActions={(categoria) => (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setManagingSubcategorias(categoria);
              }}
              className="text-indigo-600 hover:text-indigo-900 mr-4"
              title="Gerenciar Subcategorias"
            >
              <List className="h-4 w-4" />
            </button>
          )}
        />
      )}

      {managingSubcategorias && (
        <ErrorBoundary fallback={
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-500 bg-opacity-75">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-lg w-full">
              <h3 className="text-lg font-medium text-red-900 mb-2">Erro ao carregar modal</h3>
              <p className="text-sm text-gray-500 mb-4">Ocorreu um erro inesperado ao tentar abrir as subcategorias.</p>
              <button 
                onClick={() => setManagingSubcategorias(null)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
              >
                Fechar
              </button>
            </div>
          </div>
        }>
          <SubcategoriasModal
            categoria={managingSubcategorias}
            onClose={() => setManagingSubcategorias(null)}
          />
        </ErrorBoundary>
      )}

      {deletingCategoria && (
        <ConfirmModal
          title="Excluir Categoria"
          message={`Tem certeza que deseja excluir a categoria "${deletingCategoria.nome}"?`}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeletingCategoria(null)}
        />
      )}
    </div>
  );
}
