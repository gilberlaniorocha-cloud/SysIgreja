import { useEffect, useState } from 'react';
import { useAuth } from '../lib/auth';
import { getPatrimonios, getPatrimonioCategorias, createPatrimonio, updatePatrimonio, deletePatrimonio } from '../lib/queries';
import { Database } from '../types/database';
import DataTable from '../components/DataTable';
import PatrimonioForm from '../components/PatrimonioForm';
import ConfirmModal from '../components/ConfirmModal';
import PatrimonioCategoriasModal from '../components/PatrimonioCategoriasModal';
import { Plus, Settings, Filter } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type Patrimonio = Database['public']['Tables']['patrimonios']['Row'];
type PatrimonioCategoria = Database['public']['Tables']['patrimonio_categorias']['Row'];

export default function Patrimonios() {
  const { igrejaId } = useAuth();
  const [patrimonios, setPatrimonios] = useState<any[]>([]);
  const [categorias, setCategorias] = useState<PatrimonioCategoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isCategoriasModalOpen, setIsCategoriasModalOpen] = useState(false);
  const [editingPatrimonio, setEditingPatrimonio] = useState<Patrimonio | null>(null);
  const [deletingPatrimonio, setDeletingPatrimonio] = useState<Patrimonio | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [filterCategoria, setFilterCategoria] = useState('');
  const [filterCondicao, setFilterCondicao] = useState('');

  const loadData = async () => {
    if (!igrejaId) return;
    try {
      const [patrimoniosData, categoriasData] = await Promise.all([
        getPatrimonios(igrejaId),
        getPatrimonioCategorias(igrejaId)
      ]);
      setPatrimonios(patrimoniosData);
      setCategorias(categoriasData);
    } catch (error) {
      console.error('Error loading patrimonios:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [igrejaId]);

  const handleSubmit = async (data: Omit<Patrimonio, 'id' | 'criado_em' | 'igreja_id'>) => {
    setError(null);
    try {
      if (editingPatrimonio) {
        await updatePatrimonio(editingPatrimonio.id, data);
      } else {
        await createPatrimonio({ ...data, igreja_id: igrejaId });
      }
      setIsFormOpen(false);
      setEditingPatrimonio(null);
      loadData();
    } catch (error) {
      console.error('Error saving patrimonio:', error);
      setError('Ocorreu um erro ao salvar o patrimônio. Por favor, tente novamente.');
    }
  };

  const handleDeleteClick = (patrimonio: Patrimonio) => {
    setDeletingPatrimonio(patrimonio);
  };

  const handleConfirmDelete = async (idsToDelete: string[]) => {
    setError(null);
    try {
      for (const id of idsToDelete) {
        await deletePatrimonio(id);
      }
      setDeletingPatrimonio(null);
      loadData();
    } catch (error) {
      console.error('Error deleting patrimonio:', error);
      setError('Ocorreu um erro ao excluir o patrimônio. Por favor, tente novamente.');
    }
  };

  const columns = [
    { header: 'Nome', accessor: 'nome' as keyof Patrimonio },
    { 
      header: 'Categoria', 
      accessor: (row: any) => row.patrimonio_categorias?.nome || 'N/A' 
    },
    { header: 'Localização', accessor: 'localizacao' as keyof Patrimonio },
    { header: 'Responsável', accessor: 'responsavel' as keyof Patrimonio },
    { 
      header: 'Aquisição', 
      accessor: (row: any) => row.data_aquisicao ? format(parseISO(row.data_aquisicao), "dd/MM/yyyy", { locale: ptBR }) : '-' 
    },
    { 
      header: 'Valor', 
      accessor: (row: any) => row.valor ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(row.valor) : '-' 
    },
    {
      header: 'Condição',
      accessor: (row: any) => {
        const condicao = row.condicao || '-';
        let colorClass = 'bg-gray-100 text-gray-800';
        if (condicao === 'Novo' || condicao === 'Bom') colorClass = 'bg-green-100 text-green-800';
        if (condicao === 'Regular') colorClass = 'bg-yellow-100 text-yellow-800';
        if (condicao === 'Precisa manutenção' || condicao === 'Inutilizado') colorClass = 'bg-red-100 text-red-800';
        
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
            {condicao}
          </span>
        );
      }
    }
  ];

  if (loading) return <div>Carregando patrimônios...</div>;

  const filteredPatrimonios = patrimonios.filter(p => {
    if (filterCategoria && p.categoria_id !== filterCategoria) return false;
    if (filterCondicao && p.condicao !== filterCondicao) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Patrimônio</h1>
        <div className="flex space-x-3">
          {!isFormOpen && (
            <>
              <button
                onClick={() => setIsCategoriasModalOpen(true)}
                className="inline-flex items-center px-4 py-2 border border-gray-200 rounded-xl shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all"
              >
                <Settings className="-ml-1 mr-2 h-5 w-5 text-gray-400" />
                Categorias
              </button>
              <button
                onClick={() => {
                  setEditingPatrimonio(null);
                  setIsFormOpen(true);
                  setError(null);
                }}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
              >
                <Plus className="-ml-1 mr-2 h-5 w-5" />
                Novo Patrimônio
              </button>
            </>
          )}
        </div>
      </div>

      {!isFormOpen && (
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-4">
          <div className="flex items-center text-gray-800 font-semibold mb-3">
            <div className="p-1.5 bg-gray-100 rounded-lg mr-2">
              <Filter className="w-4 h-4 text-gray-600" />
            </div>
            Filtros
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Categoria</label>
              <select
                value={filterCategoria}
                onChange={(e) => setFilterCategoria(e.target.value)}
                className="w-full rounded-xl border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2.5 transition-shadow"
              >
                <option value="">Todas as categorias</option>
                {categorias.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.nome}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Condição</label>
              <select
                value={filterCondicao}
                onChange={(e) => setFilterCondicao(e.target.value)}
                className="w-full rounded-xl border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2.5 transition-shadow"
              >
                <option value="">Todas as condições</option>
                <option value="Novo">Novo</option>
                <option value="Bom">Bom</option>
                <option value="Regular">Regular</option>
                <option value="Precisa manutenção">Precisa manutenção</option>
                <option value="Inutilizado">Inutilizado</option>
              </select>
            </div>
          </div>
          
          {(filterCategoria || filterCondicao) && (
            <div className="flex justify-end mt-4 pt-4 border-t border-gray-100">
              <button
                onClick={() => {
                  setFilterCategoria('');
                  setFilterCondicao('');
                }}
                className="text-sm text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
              >
                Limpar Filtros
              </button>
            </div>
          )}
        </div>
      )}

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
        <PatrimonioForm
          initialData={editingPatrimonio}
          categorias={categorias}
          onSubmit={handleSubmit}
          onCancel={() => {
            setIsFormOpen(false);
            setEditingPatrimonio(null);
          }}
        />
      ) : (
        <DataTable
          columns={columns}
          data={filteredPatrimonios}
          onEdit={(patrimonio) => {
            setEditingPatrimonio(patrimonio);
            setIsFormOpen(true);
          }}
          onDelete={handleDeleteClick}
        />
      )}

      {deletingPatrimonio && (
        <ConfirmModal
          title="Excluir Patrimônio"
          message={`Tem certeza que deseja excluir o patrimônio "${deletingPatrimonio.nome}"?`}
          onConfirm={() => handleConfirmDelete([deletingPatrimonio.id])}
          onCancel={() => setDeletingPatrimonio(null)}
        />
      )}

      <PatrimonioCategoriasModal
        isOpen={isCategoriasModalOpen}
        onClose={() => {
          setIsCategoriasModalOpen(false);
          loadData(); // Reload to get any new categories
        }}
      />
    </div>
  );
}
