import { useEffect, useState } from 'react';
import { useAuth } from '../lib/auth';
import { getReceitas, createReceita, updateReceita, deleteReceita, getContas, getCategorias } from '../lib/queries';
import { Database } from '../types/database';
import DataTable from '../components/DataTable';
import ReceitaForm from '../components/ReceitaForm';
import ConfirmModal from '../components/ConfirmModal';
import { Plus, Filter, X, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type Receita = Database['public']['Tables']['receitas']['Row'];
type Conta = Database['public']['Tables']['contas_bancarias']['Row'];
type Categoria = Database['public']['Tables']['categorias']['Row'];

export default function Receitas() {
  const { igrejaId } = useAuth();
  const [receitas, setReceitas] = useState<any[]>([]);
  const [contas, setContas] = useState<Conta[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingReceita, setEditingReceita] = useState<Receita | null>(null);
  const [deletingReceita, setDeletingReceita] = useState<Receita | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Filtros
  const [showFilters, setShowFilters] = useState(false);
  const [filtroDataInicio, setFiltroDataInicio] = useState('');
  const [filtroDataFim, setFiltroDataFim] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [filtroConta, setFiltroConta] = useState('');
  const [filtroAno, setFiltroAno] = useState('');
  const [filtroMes, setFiltroMes] = useState('');
  const [filtroStatus, setFiltroStatus] = useState(''); // 'vencidas', 'pendentes', 'recebidas'

  const loadData = async () => {
    if (!igrejaId) return;
    try {
      const [receitasData, contasData, categoriasData] = await Promise.all([
        getReceitas(igrejaId),
        getContas(igrejaId),
        getCategorias(igrejaId, 'receita')
      ]);
      setReceitas(receitasData);
      setContas(contasData);
      setCategorias(categoriasData);
    } catch (error) {
      console.error('Error loading receitas:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [igrejaId]);

  const handleSubmit = async (data: Omit<Receita, 'id' | 'criado_em' | 'igreja_id'>) => {
    setError(null);
    try {
      if (editingReceita) {
        await updateReceita(editingReceita.id, data);
      } else {
        await createReceita({ ...data, igreja_id: igrejaId });
      }
      setIsFormOpen(false);
      setEditingReceita(null);
      loadData();
    } catch (error) {
      console.error('Error saving receita:', error);
      setError('Ocorreu um erro ao salvar a receita. Por favor, tente novamente.');
    }
  };

  const handleDeleteClick = (receita: Receita) => {
    setDeletingReceita(receita);
  };

  const handleConfirmDelete = async () => {
    if (!deletingReceita) return;
    setError(null);
    try {
      await deleteReceita(deletingReceita.id);
      setDeletingReceita(null);
      loadData();
    } catch (error) {
      console.error('Error deleting receita:', error);
      setError('Ocorreu um erro ao excluir a receita. Por favor, tente novamente.');
    }
  };

  const columns = [
    { 
      header: 'Data', 
      accessor: (row: any) => format(parseISO(row.data_recebimento), "dd/MM/yyyy", { locale: ptBR }) 
    },
    { header: 'Descrição', accessor: 'descricao' as keyof Receita },
    { 
      header: 'Conta', 
      accessor: (row: any) => row.contas_bancarias?.nome_conta || 'N/A' 
    },
    { 
      header: 'Categoria', 
      accessor: (row: any) => row.categorias?.nome || 'N/A' 
    },
    { 
      header: 'Subcategoria', 
      accessor: (row: any) => row.subcategorias?.nome || 'N/A' 
    },
    { 
      header: 'Valor', 
      accessor: (row: any) => {
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        const dataRecebimento = parseISO(row.data_recebimento);
        const isVencida = !row.recebido && dataRecebimento < hoje;
        return (
          <span className={isVencida ? 'text-red-600 font-bold' : ''}>
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(row.valor)}
          </span>
        );
      }
    },
    {
      header: 'Status',
      accessor: (row: any) => {
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        const dataRecebimento = parseISO(row.data_recebimento);
        const isVencida = !row.recebido && dataRecebimento < hoje;
        
        if (row.recebido) {
          return (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Recebido
            </span>
          );
        }
        
        if (isVencida) {
          return (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
              <AlertCircle className="w-3 h-3 mr-1" />
              Vencida
            </span>
          );
        }
        
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3 mr-1" />
            Pendente
          </span>
        );
      }
    }
  ];

  const receitasFiltradas = receitas.filter(receita => {
    let match = true;
    if (filtroDataInicio && receita.data_recebimento < filtroDataInicio) match = false;
    if (filtroDataFim && receita.data_recebimento > filtroDataFim) match = false;
    if (filtroCategoria && receita.categoria_id !== filtroCategoria) match = false;
    if (filtroConta && receita.conta_id !== filtroConta) match = false;
    if (filtroAno && !receita.data_recebimento.startsWith(filtroAno)) match = false;
    if (filtroMes && receita.data_recebimento.substring(5, 7) !== filtroMes) match = false;
    
    if (filtroStatus) {
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      const dataRecebimento = parseISO(receita.data_recebimento);
      
      if (filtroStatus === 'recebidas' && !receita.recebido) match = false;
      if (filtroStatus === 'pendentes' && (receita.recebido || dataRecebimento < hoje)) match = false;
      if (filtroStatus === 'vencidas' && (receita.recebido || dataRecebimento >= hoje)) match = false;
    }
    
    return match;
  });

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const totalFiltrado = receitasFiltradas.reduce((acc, curr) => acc + Number(curr.valor), 0);
  
  const totalVencido = receitasFiltradas
    .filter(r => !r.recebido && parseISO(r.data_recebimento) < hoje)
    .reduce((acc, r) => acc + Number(r.valor), 0);
    
  const totalPendente = receitasFiltradas
    .filter(r => !r.recebido && parseISO(r.data_recebimento) >= hoje)
    .reduce((acc, r) => acc + Number(r.valor), 0);
    
  const totalRecebido = receitasFiltradas
    .filter(r => r.recebido)
    .reduce((acc, r) => acc + Number(r.valor), 0);

  const limparFiltros = () => {
    setFiltroDataInicio('');
    setFiltroDataFim('');
    setFiltroCategoria('');
    setFiltroConta('');
    setFiltroAno('');
    setFiltroMes('');
    setFiltroStatus('');
  };

  const anosDisponiveis = Array.from(new Set(receitas.map(r => r.data_recebimento.substring(0, 4)))).sort().reverse();
  if (anosDisponiveis.length === 0) anosDisponiveis.push(new Date().getFullYear().toString());

  if (loading) return <div>Carregando receitas...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Receitas</h1>
        {!isFormOpen && (
          <div className="flex space-x-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center px-4 py-2 border border-gray-200 rounded-xl shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-300 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <Filter className="-ml-1 mr-2 h-5 w-5 text-gray-400" />
              Filtros
            </button>
            <button
              onClick={() => {
                setEditingReceita(null);
                setIsFormOpen(true);
                setError(null);
              }}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <Plus className="-ml-1 mr-2 h-5 w-5" />
              Nova Receita
            </button>
          </div>
        )}
      </div>

      {!isFormOpen && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 transition-all hover:shadow-md relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-red-500"></div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Total Vencido</p>
                <p className="text-3xl font-bold text-red-600">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalVencido)}
                </p>
              </div>
              <div className="bg-red-50 p-3 rounded-xl">
                <AlertCircle className="h-8 w-8 text-red-500" />
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 transition-all hover:shadow-md relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-amber-500"></div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Total Pendente</p>
                <p className="text-3xl font-bold text-amber-600">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalPendente)}
                </p>
              </div>
              <div className="bg-amber-50 p-3 rounded-xl">
                <Clock className="h-8 w-8 text-amber-500" />
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 transition-all hover:shadow-md relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Total Recebido</p>
                <p className="text-3xl font-bold text-emerald-600">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalRecebido)}
                </p>
              </div>
              <div className="bg-emerald-50 p-3 rounded-xl">
                <CheckCircle2 className="h-8 w-8 text-emerald-500" />
              </div>
            </div>
          </div>
        </div>
      )}

      {showFilters && !isFormOpen && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Filtros Avançados</h3>
            <button onClick={limparFiltros} className="text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors">
              Limpar Filtros
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ano</label>
              <select
                value={filtroAno}
                onChange={(e) => setFiltroAno(e.target.value)}
                className="block w-full rounded-xl border-gray-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2.5 px-3 border transition-colors"
              >
                <option value="">Todos</option>
                {anosDisponiveis.map(ano => (
                  <option key={ano} value={ano}>{ano}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mês</label>
              <select
                value={filtroMes}
                onChange={(e) => setFiltroMes(e.target.value)}
                className="block w-full rounded-xl border-gray-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2.5 px-3 border transition-colors"
              >
                <option value="">Todos</option>
                <option value="01">Janeiro</option>
                <option value="02">Fevereiro</option>
                <option value="03">Março</option>
                <option value="04">Abril</option>
                <option value="05">Maio</option>
                <option value="06">Junho</option>
                <option value="07">Julho</option>
                <option value="08">Agosto</option>
                <option value="09">Setembro</option>
                <option value="10">Outubro</option>
                <option value="11">Novembro</option>
                <option value="12">Dezembro</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data Início</label>
              <input
                type="date"
                value={filtroDataInicio}
                onChange={(e) => setFiltroDataInicio(e.target.value)}
                className="block w-full rounded-xl border-gray-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2.5 px-3 border transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data Fim</label>
              <input
                type="date"
                value={filtroDataFim}
                onChange={(e) => setFiltroDataFim(e.target.value)}
                className="block w-full rounded-xl border-gray-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2.5 px-3 border transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
              <select
                value={filtroCategoria}
                onChange={(e) => setFiltroCategoria(e.target.value)}
                className="block w-full rounded-xl border-gray-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2.5 px-3 border transition-colors"
              >
                <option value="">Todas</option>
                {categorias.map(c => (
                  <option key={c.id} value={c.id}>{c.nome}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Conta</label>
              <select
                value={filtroConta}
                onChange={(e) => setFiltroConta(e.target.value)}
                className="block w-full rounded-xl border-gray-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2.5 px-3 border transition-colors"
              >
                <option value="">Todas</option>
                {contas.map(c => (
                  <option key={c.id} value={c.id}>{c.nome_conta}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filtroStatus}
                onChange={(e) => setFiltroStatus(e.target.value)}
                className="block w-full rounded-xl border-gray-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2.5 px-3 border transition-colors"
              >
                <option value="">Todos</option>
                <option value="recebidas">Recebidas</option>
                <option value="pendentes">Pendentes</option>
                <option value="vencidas">Vencidas</option>
              </select>
            </div>
          </div>
          
          <div className="mt-6 p-5 bg-indigo-50 rounded-xl flex justify-between items-center border border-indigo-100">
            <span className="text-indigo-900 font-medium">Total do Período Filtrado:</span>
            <span className="text-2xl font-bold text-indigo-700">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalFiltrado)}
            </span>
          </div>
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
        <ReceitaForm
          initialData={editingReceita}
          contas={contas}
          categorias={categorias}
          onSubmit={handleSubmit}
          onCancel={() => {
            setIsFormOpen(false);
            setEditingReceita(null);
          }}
        />
      ) : (
        <DataTable
          columns={columns}
          data={receitasFiltradas}
          onEdit={(receita) => {
            setEditingReceita(receita);
            setIsFormOpen(true);
          }}
          onDelete={handleDeleteClick}
        />
      )}

      {deletingReceita && (
        <ConfirmModal
          title="Excluir Receita"
          message={`Tem certeza que deseja excluir a receita "${deletingReceita.descricao}"?`}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeletingReceita(null)}
        />
      )}
    </div>
  );
}
