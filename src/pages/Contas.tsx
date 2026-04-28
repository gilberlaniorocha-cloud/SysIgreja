import { useEffect, useState } from 'react';
import { useAuth } from '../lib/auth';
import { getContas, createConta, updateConta, deleteConta } from '../lib/queries';
import { Database } from '../types/database';
import DataTable from '../components/DataTable';
import ContaForm from '../components/ContaForm';
import ConfirmModal from '../components/ConfirmModal';
import { Plus } from 'lucide-react';

type Conta = Database['public']['Tables']['contas_bancarias']['Row'];

export default function Contas() {
  const { igrejaId } = useAuth();
  const [contas, setContas] = useState<Conta[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingConta, setEditingConta] = useState<Conta | null>(null);
  const [deletingConta, setDeletingConta] = useState<Conta | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadContas = async () => {
    if (!igrejaId) return;
    try {
      const data = await getContas(igrejaId);
      setContas(data);
    } catch (error) {
      console.error('Error loading contas:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContas();
  }, [igrejaId]);

  const handleSubmit = async (data: Omit<Conta, 'id' | 'criado_em' | 'igreja_id'>) => {
    setError(null);
    try {
      if (editingConta) {
        await updateConta(editingConta.id, data);
      } else {
        await createConta({ ...data, igreja_id: igrejaId });
      }
      setIsFormOpen(false);
      setEditingConta(null);
      loadContas();
    } catch (error) {
      console.error('Error saving conta:', error);
      setError('Ocorreu um erro ao salvar a conta bancária. Por favor, tente novamente.');
    }
  };

  const handleDeleteClick = (conta: Conta) => {
    setDeletingConta(conta);
  };

  const handleConfirmDelete = async () => {
    if (!deletingConta) return;
    setError(null);
    try {
      await deleteConta(deletingConta.id);
      setDeletingConta(null);
      loadContas();
    } catch (error) {
      console.error('Error deleting conta:', error);
      setError('Erro ao excluir conta bancária. Ela pode estar sendo usada em alguma receita ou despesa.');
    }
  };

  const columns = [
    { header: 'Nome da Conta', accessor: 'nome_conta' as keyof Conta },
    { header: 'Banco', accessor: 'banco' as keyof Conta },
    { 
      header: 'Saldo Inicial', 
      accessor: (row: Conta) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(row.saldo_inicial || 0) 
    },
  ];

  if (loading) return <div>Carregando contas...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Contas Bancárias</h1>
        {!isFormOpen && (
          <button
            onClick={() => {
              setEditingConta(null);
              setIsFormOpen(true);
              setError(null);
            }}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
          >
            <Plus className="-ml-1 mr-2 h-5 w-5" />
            Nova Conta
          </button>
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
        <ContaForm
          initialData={editingConta}
          onSubmit={handleSubmit}
          onCancel={() => {
            setIsFormOpen(false);
            setEditingConta(null);
          }}
        />
      ) : (
        <DataTable
          columns={columns}
          data={contas}
          onEdit={(conta) => {
            setEditingConta(conta);
            setIsFormOpen(true);
          }}
          onDelete={handleDeleteClick}
        />
      )}

      {deletingConta && (
        <ConfirmModal
          title="Excluir Conta Bancária"
          message={`Tem certeza que deseja excluir a conta "${deletingConta.nome_conta}"?`}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeletingConta(null)}
        />
      )}
    </div>
  );
}
