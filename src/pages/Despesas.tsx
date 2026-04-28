import { useEffect, useState } from 'react';
import { useAuth } from '../lib/auth';
import { getDespesas, createDespesa, createDespesas, updateDespesa, updateDespesasEmLote, deleteDespesa, deleteDespesas, getContas, getCategorias, getAllSubcategorias, getCartoes } from '../lib/queries';
import { Database } from '../types/database';
import DataTable from '../components/DataTable';
import DespesaForm from '../components/DespesaForm';
import DeleteDespesaModal from '../components/DeleteDespesaModal';
import { Plus, Filter, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type Despesa = Database['public']['Tables']['despesas']['Row'];
type Conta = Database['public']['Tables']['contas_bancarias']['Row'];
type Categoria = Database['public']['Tables']['categorias']['Row'];
type Cartao = Database['public']['Tables']['cartoes_credito']['Row'];

export default function Despesas() {
  const { igrejaId } = useAuth();
  const [despesas, setDespesas] = useState<any[]>([]);
  const [contas, setContas] = useState<Conta[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [subcategorias, setSubcategorias] = useState<any[]>([]);
  const [cartoes, setCartoes] = useState<Cartao[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDespesa, setEditingDespesa] = useState<Despesa | null>(null);
  const [deletingDespesa, setDeletingDespesa] = useState<Despesa | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Filters state
  const [filterAno, setFilterAno] = useState<string>('');
  const [filterMes, setFilterMes] = useState<string>('');
  const [filterCategoria, setFilterCategoria] = useState<string>('');
  const [filterSubcategoria, setFilterSubcategoria] = useState<string>('');
  const [filterConta, setFilterConta] = useState<string>('');
  const [filterCartao, setFilterCartao] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>(''); // 'vencidas', 'em_aberto', 'pagas'

  const loadData = async () => {
    if (!igrejaId) return;
    try {
      const [despesasData, contasData, categoriasData, subcategoriasData, cartoesData] = await Promise.all([
        getDespesas(igrejaId),
        getContas(igrejaId),
        getCategorias(igrejaId, 'despesa'),
        getAllSubcategorias(igrejaId),
        getCartoes(igrejaId)
      ]);
      setDespesas(despesasData);
      setContas(contasData);
      setCategorias(categoriasData);
      setSubcategorias(subcategoriasData);
      setCartoes(cartoesData);
    } catch (error) {
      console.error('Error loading despesas:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [igrejaId]);

  const handleSubmit = async (
    data: Omit<Despesa, 'id' | 'criado_em' | 'igreja_id'> | Omit<Despesa, 'id' | 'criado_em' | 'igreja_id'>[],
    updateScope?: 'single' | 'previous' | 'future' | 'all'
  ) => {
    setError(null);
    try {
      if (editingDespesa) {
        if (updateScope && updateScope !== 'single') {
          // Find related installments based on description parsing
          const match = editingDespesa.descricao?.match(/^(.*) \((\d+)\/(\d+)\)$/);
          let idsToUpdate = [editingDespesa.id];
          
          if (match) {
            const baseDescription = match[1];
            const currentInstallment = parseInt(match[2], 10);
            const totalInstallments = parseInt(match[3], 10);
            
            idsToUpdate = despesas
              .filter(d => {
                const dMatch = d.descricao?.match(/^(.*) \((\d+)\/(\d+)\)$/);
                if (!dMatch) return false;
                const dBase = dMatch[1];
                const dCurrent = parseInt(dMatch[2], 10);
                const dTotal = parseInt(dMatch[3], 10);
                
                if (dBase !== baseDescription || dTotal !== totalInstallments || d.conta_id !== editingDespesa.conta_id) {
                  return false;
                }
                
                if (updateScope === 'previous') return dCurrent <= currentInstallment;
                if (updateScope === 'future') return dCurrent >= currentInstallment;
                if (updateScope === 'all') return true;
                
                return false;
              })
              .map(d => d.id);
          } else if (editingDespesa.grupo_id) {
            // Fallback to grupo_id if available (for future-proofing)
            idsToUpdate = despesas
              .filter(d => {
                if (d.grupo_id !== editingDespesa.grupo_id) return false;
                if (updateScope === 'previous') return new Date(d.data_pagamento) <= new Date(editingDespesa.data_pagamento);
                if (updateScope === 'future') return new Date(d.data_pagamento) >= new Date(editingDespesa.data_pagamento);
                if (updateScope === 'all') return true;
                return false;
              })
              .map(d => d.id);
          }
          
          // Update all found IDs
          await Promise.all(idsToUpdate.map(id => {
            const targetDespesa = despesas.find(d => d.id === id);
            const dataObj = data as Omit<Despesa, 'id' | 'criado_em' | 'igreja_id'>;
            let newDescricao = dataObj.descricao;
            
            // Preserve installment numbering if it exists
            if (targetDespesa && targetDespesa.descricao) {
              const targetMatch = targetDespesa.descricao.match(/ \(\d+\/\d+\)$/);
              if (targetMatch) {
                // If the new description already has a numbering, strip it first
                const baseNewDesc = newDescricao?.replace(/ \(\d+\/\d+\)$/, '') || '';
                newDescricao = `${baseNewDesc}${targetMatch[0]}`;
              }
            }
            
            return updateDespesa(id, {
              ...dataObj,
              descricao: newDescricao,
              // Keep original date for other installments, only update the current one's date
              data_pagamento: id === editingDespesa.id ? dataObj.data_pagamento : targetDespesa?.data_pagamento || dataObj.data_pagamento
            });
          }));
        } else {
          await updateDespesa(editingDespesa.id, data as Omit<Despesa, 'id' | 'criado_em' | 'igreja_id'>);
        }
      } else {
        if (Array.isArray(data)) {
          await createDespesas(data.map(d => ({ ...d, igreja_id: igrejaId })));
        } else {
          await createDespesa({ ...data, igreja_id: igrejaId });
        }
      }
      setIsFormOpen(false);
      setEditingDespesa(null);
      loadData();
    } catch (error) {
      console.error('Error saving despesa:', error);
      setError('Ocorreu um erro ao salvar a despesa. Por favor, tente novamente.');
    }
  };

  const handleDeleteClick = (despesa: Despesa) => {
    setDeletingDespesa(despesa);
  };

  const handleConfirmDelete = async (idsToDelete: string[]) => {
    setError(null);
    try {
      if (idsToDelete.length === 1) {
        await deleteDespesa(idsToDelete[0]);
      } else {
        await deleteDespesas(idsToDelete);
      }
      setDeletingDespesa(null);
      loadData();
    } catch (error) {
      console.error('Error deleting despesa:', error);
      setError('Ocorreu um erro ao excluir a despesa. Por favor, tente novamente.');
    }
  };

  const columns = [
    { 
      header: 'Data', 
      accessor: (row: any) => format(parseISO(row.data_pagamento), "dd/MM/yyyy", { locale: ptBR }) 
    },
    { header: 'Descrição', accessor: 'descricao' as keyof Despesa },
    { 
      header: 'Conta', 
      accessor: (row: any) => row.contas_bancarias?.nome_conta || 'N/A' 
    },
    { 
      header: 'Cartão', 
      accessor: (row: any) => row.cartoes_credito?.nome || '-' 
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
        const dataPagamento = parseISO(row.data_pagamento);
        const isVencida = !row.pago && dataPagamento < hoje;
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
        const dataPagamento = parseISO(row.data_pagamento);
        const isVencida = !row.pago && dataPagamento < hoje;
        
        if (row.pago) {
          return (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Pago
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

  if (loading) return <div>Carregando despesas...</div>;

  // Apply filters
  const filteredDespesas = despesas.filter(despesa => {
    if (filterAno) {
      const despesaAno = parseISO(despesa.data_pagamento).getFullYear().toString();
      if (despesaAno !== filterAno) return false;
    }
    if (filterMes) {
      const despesaMes = (parseISO(despesa.data_pagamento).getMonth() + 1).toString();
      if (despesaMes !== filterMes) return false;
    }
    if (filterCategoria && despesa.categoria_id !== filterCategoria) {
      return false;
    }
    if (filterSubcategoria && despesa.subcategoria_id !== filterSubcategoria) {
      return false;
    }
    if (filterConta && despesa.conta_id !== filterConta) {
      return false;
    }
    if (filterCartao && despesa.cartao_id !== filterCartao) {
      return false;
    }
    if (filterStatus) {
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      const dataPagamento = parseISO(despesa.data_pagamento);
      
      if (filterStatus === 'pagas' && !despesa.pago) return false;
      if (filterStatus === 'em_aberto' && (despesa.pago || dataPagamento < hoje)) return false;
      if (filterStatus === 'vencidas' && (despesa.pago || dataPagamento >= hoje)) return false;
    }
    return true;
  });

  // Get unique years and months for filter dropdowns
  const availableYears = Array.from(new Set(despesas.map(d => parseISO(d.data_pagamento).getFullYear().toString()))).sort((a, b) => Number(b) - Number(a));
  const availableMonths = Array.from(new Set(despesas.map(d => (parseISO(d.data_pagamento).getMonth() + 1).toString()))).sort((a, b) => Number(a) - Number(b));

  // Filter subcategories based on selected category
  const filteredSubcategorias = filterCategoria 
    ? subcategorias.filter(s => s.categoria_id === filterCategoria)
    : subcategorias;

  // Calculate total filtered value
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  
  const totalFiltrado = filteredDespesas.reduce((acc, despesa) => acc + Number(despesa.valor), 0);
  const totalVencido = filteredDespesas
    .filter(d => !d.pago && parseISO(d.data_pagamento) < hoje)
    .reduce((acc, d) => acc + Number(d.valor), 0);
  const totalPendente = filteredDespesas
    .filter(d => !d.pago && parseISO(d.data_pagamento) >= hoje)
    .reduce((acc, d) => acc + Number(d.valor), 0);
  const totalPago = filteredDespesas
    .filter(d => d.pago)
    .reduce((acc, d) => acc + Number(d.valor), 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Despesas</h1>
        {!isFormOpen && (
          <button
            onClick={() => {
              setEditingDespesa(null);
              setIsFormOpen(true);
              setError(null);
            }}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <Plus className="-ml-1 mr-2 h-5 w-5" />
            Nova Despesa
          </button>
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
                <p className="text-sm font-medium text-gray-500 mb-1">Total Pago</p>
                <p className="text-3xl font-bold text-emerald-600">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalPago)}
                </p>
              </div>
              <div className="bg-emerald-50 p-3 rounded-xl">
                <CheckCircle2 className="h-8 w-8 text-emerald-500" />
              </div>
            </div>
          </div>
        </div>
      )}

      {!isFormOpen && (
        <div className="bg-white p-6 rounded-2xl shadow-sm space-y-5 border border-gray-100">
          <div className="flex items-center text-gray-900 font-semibold mb-2">
            <Filter className="w-5 h-5 mr-2 text-indigo-500" />
            Filtros Avançados
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ano</label>
              <select
                value={filterAno}
                onChange={(e) => setFilterAno(e.target.value)}
                className="w-full rounded-xl border-gray-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2.5 px-3 border transition-colors"
              >
                <option value="">Todos os anos</option>
                {availableYears.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mês</label>
              <select
                value={filterMes}
                onChange={(e) => setFilterMes(e.target.value)}
                className="w-full rounded-xl border-gray-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2.5 px-3 border transition-colors"
              >
                <option value="">Todos os meses</option>
                {availableMonths.map(month => (
                  <option key={month} value={month}>
                    {format(new Date(2000, Number(month) - 1, 1), 'MMMM', { locale: ptBR })}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
              <select
                value={filterCategoria}
                onChange={(e) => {
                  setFilterCategoria(e.target.value);
                  setFilterSubcategoria(''); // Reset subcategory when category changes
                }}
                className="w-full rounded-xl border-gray-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2.5 px-3 border transition-colors"
              >
                <option value="">Todas as categorias</option>
                {categorias.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.nome}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subcategoria</label>
              <select
                value={filterSubcategoria}
                onChange={(e) => setFilterSubcategoria(e.target.value)}
                className="w-full rounded-xl border-gray-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2.5 px-3 border transition-colors"
                disabled={!filterCategoria && filteredSubcategorias.length === 0}
              >
                <option value="">Todas as subcategorias</option>
                {filteredSubcategorias.map(sub => (
                  <option key={sub.id} value={sub.id}>{sub.nome}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Conta Bancária</label>
              <select
                value={filterConta}
                onChange={(e) => setFilterConta(e.target.value)}
                className="w-full rounded-xl border-gray-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2.5 px-3 border transition-colors"
              >
                <option value="">Todas as contas</option>
                {contas.map(conta => (
                  <option key={conta.id} value={conta.id}>{conta.nome_conta}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cartão de Crédito</label>
              <select
                value={filterCartao}
                onChange={(e) => setFilterCartao(e.target.value)}
                className="w-full rounded-xl border-gray-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2.5 px-3 border transition-colors"
              >
                <option value="">Todos os cartões</option>
                {cartoes.map(cartao => (
                  <option key={cartao.id} value={cartao.id}>{cartao.nome}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full rounded-xl border-gray-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2.5 px-3 border transition-colors"
              >
                <option value="">Todos os status</option>
                <option value="pagas">Pagas</option>
                <option value="em_aberto">Em Aberto</option>
                <option value="vencidas">Vencidas</option>
              </select>
            </div>
          </div>
          
          {(filterAno || filterMes || filterCategoria || filterSubcategoria || filterConta || filterCartao || filterStatus) && (
            <div className="flex justify-between items-center mt-6 pt-5 border-t border-gray-100">
              <div className="text-sm font-medium text-gray-700 bg-indigo-50 px-4 py-2 rounded-lg border border-indigo-100">
                Total Filtrado: <span className="text-lg font-bold text-indigo-700 ml-2">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalFiltrado)}</span>
              </div>
              <button
                onClick={() => {
                  setFilterAno('');
                  setFilterMes('');
                  setFilterCategoria('');
                  setFilterSubcategoria('');
                  setFilterConta('');
                  setFilterCartao('');
                  setFilterStatus('');
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
        <DespesaForm
          initialData={editingDespesa}
          contas={contas}
          categorias={categorias}
          cartoes={cartoes}
          onSubmit={handleSubmit}
          onCancel={() => {
            setIsFormOpen(false);
            setEditingDespesa(null);
          }}
        />
      ) : (
        <DataTable
          columns={columns}
          data={filteredDespesas}
          onEdit={(despesa) => {
            setEditingDespesa(despesa);
            setIsFormOpen(true);
          }}
          onDelete={handleDeleteClick}
        />
      )}

      {deletingDespesa && (
        <DeleteDespesaModal
          despesa={deletingDespesa}
          despesas={despesas}
          onClose={() => setDeletingDespesa(null)}
          onConfirm={handleConfirmDelete}
        />
      )}
    </div>
  );
}
