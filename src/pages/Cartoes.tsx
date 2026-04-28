import { useEffect, useState } from 'react';
import { useAuth } from '../lib/auth';
import { getCartoes, createCartao, updateCartao, deleteCartao, getDespesas, marcarDespesasComoPagas } from '../lib/queries';
import { Database } from '../types/database';
import DataTable from '../components/DataTable';
import CartaoForm from '../components/CartaoForm';
import ConfirmModal from '../components/ConfirmModal';
import { Plus, CreditCard, Calendar, CheckCircle2, Eye, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { parseISO, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type Cartao = Database['public']['Tables']['cartoes_credito']['Row'];
type Despesa = Database['public']['Tables']['despesas']['Row'];

export default function Cartoes() {
  const { igrejaId } = useAuth();
  const [cartoes, setCartoes] = useState<Cartao[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCartao, setEditingCartao] = useState<Cartao | null>(null);
  const [deletingCartao, setDeletingCartao] = useState<Cartao | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Faturas states
  const [despesasCartao, setDespesasCartao] = useState<Despesa[]>([]);
  const [anoSelecionado, setAnoSelecionado] = useState(new Date().getFullYear());
  const [cartaoSelecionado, setCartaoSelecionado] = useState<string>('todos');
  const [payingMonth, setPayingMonth] = useState<number | null>(null);
  const [detalhesMes, setDetalhesMes] = useState<{ mes: string; despesas: any[] } | null>(null);

  const loadCartoes = async () => {
    if (!igrejaId) return;
    try {
      const data = await getCartoes(igrejaId);
      setCartoes(data);
    } catch (error) {
      console.error('Error loading cartoes:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDespesasCartao = async () => {
    if (!igrejaId) return;
    try {
      const data = await getDespesas(igrejaId);
      // Filtra apenas despesas que têm um cartão de crédito associado
      const despesasComCartao = data.filter(d => d.cartao_id !== null);
      setDespesasCartao(despesasComCartao);
    } catch (error) {
      console.error('Error loading despesas do cartao:', error);
    }
  };

  useEffect(() => {
    loadCartoes();
    loadDespesasCartao();
  }, [igrejaId]);

  const handleSubmit = async (data: Omit<Cartao, 'id' | 'criado_em' | 'igreja_id'>) => {
    setError(null);
    try {
      if (editingCartao) {
        await updateCartao(editingCartao.id, data);
      } else {
        await createCartao({ ...data, igreja_id: igrejaId });
      }
      setIsFormOpen(false);
      setEditingCartao(null);
      loadCartoes();
      loadDespesasCartao();
    } catch (error) {
      console.error('Error saving cartao:', error);
      setError('Ocorreu um erro ao salvar o cartão de crédito. Por favor, tente novamente.');
    }
  };

  const handleDeleteClick = (cartao: Cartao) => {
    setDeletingCartao(cartao);
  };

  const handleConfirmDelete = async () => {
    if (!deletingCartao) return;
    setError(null);
    try {
      await deleteCartao(deletingCartao.id);
      setDeletingCartao(null);
      loadCartoes();
      loadDespesasCartao();
    } catch (error) {
      console.error('Error deleting cartao:', error);
      setError('Erro ao excluir cartão de crédito. Ele pode estar sendo usado em alguma despesa.');
    }
  };

  const handlePagarFatura = async (mesIndex: number) => {
    setPayingMonth(mesIndex);
    setError(null);
    try {
      const despesasPendentes = despesasCartao.filter(d => {
        const data = parseISO(d.data_pagamento);
        const isMesmoAno = data.getFullYear() === anoSelecionado;
        const isMesmoMes = data.getMonth() === mesIndex;
        const isMesmoCartao = cartaoSelecionado === 'todos' || d.cartao_id === cartaoSelecionado;
        
        return isMesmoAno && isMesmoMes && isMesmoCartao && !d.pago;
      });

      const ids = despesasPendentes.map(d => d.id);
      if (ids.length > 0) {
        await marcarDespesasComoPagas(ids);
        await loadDespesasCartao();
      }
    } catch (error) {
      console.error('Erro ao pagar fatura:', error);
      setError('Ocorreu um erro ao tentar dar baixa na fatura.');
    } finally {
      setPayingMonth(null);
    }
  };

  const handleDetalharFatura = (mesIndex: number, nomeMes: string) => {
    const despesasDoMes = despesasCartao.filter(d => {
      const data = parseISO(d.data_pagamento);
      const isMesmoAno = data.getFullYear() === anoSelecionado;
      const isMesmoMes = data.getMonth() === mesIndex;
      const isMesmoCartao = cartaoSelecionado === 'todos' || d.cartao_id === cartaoSelecionado;
      
      return isMesmoAno && isMesmoMes && isMesmoCartao;
    });
    
    // Sort by date
    despesasDoMes.sort((a, b) => new Date(a.data_pagamento).getTime() - new Date(b.data_pagamento).getTime());
    
    setDetalhesMes({ mes: nomeMes, despesas: despesasDoMes });
  };

  const columns = [
    { header: 'Nome do Cartão', accessor: 'nome' as keyof Cartao },
    { header: 'Bandeira', accessor: 'bandeira' as keyof Cartao },
    { 
      header: 'Limite', 
      accessor: (row: Cartao) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(row.limite || 0) 
    },
    { header: 'Fechamento', accessor: (row: Cartao) => `Dia ${row.dia_fechamento}` },
    { header: 'Vencimento', accessor: (row: Cartao) => `Dia ${row.dia_vencimento}` },
    { 
      header: 'Status', 
      accessor: (row: Cartao) => (
        <span className={cn(
          "px-2 py-1 text-xs font-medium rounded-full",
          row.ativo ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
        )}>
          {row.ativo ? 'Ativo' : 'Inativo'}
        </span>
      )
    },
  ];

  // Lógica de Resumo de Faturas
  const anosDisponiveis = Array.from(
    new Set(despesasCartao.map(d => parseISO(d.data_pagamento).getFullYear()))
  ).sort((a, b) => b - a);
  
  if (anosDisponiveis.length === 0) {
    anosDisponiveis.push(new Date().getFullYear());
  }

  const meses = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const faturasPorMes = meses.map((nomeMes, index) => {
    const despesasDoMes = despesasCartao.filter(d => {
      const data = parseISO(d.data_pagamento);
      const isMesmoAno = data.getFullYear() === anoSelecionado;
      const isMesmoMes = data.getMonth() === index;
      const isMesmoCartao = cartaoSelecionado === 'todos' || d.cartao_id === cartaoSelecionado;
      
      return isMesmoAno && isMesmoMes && isMesmoCartao;
    });

    const valorFatura = despesasDoMes.reduce((acc, d) => acc + Number(d.valor), 0);
    const valorPago = despesasDoMes.filter(d => d.pago).reduce((acc, d) => acc + Number(d.valor), 0);
    const valorAPagar = despesasDoMes.filter(d => !d.pago).reduce((acc, d) => acc + Number(d.valor), 0);

    return {
      mes: nomeMes,
      valorFatura,
      valorPago,
      valorAPagar
    };
  });

  const totalAnoFatura = faturasPorMes.reduce((acc, m) => acc + m.valorFatura, 0);
  const totalAnoPago = faturasPorMes.reduce((acc, m) => acc + m.valorPago, 0);
  const totalAnoAPagar = faturasPorMes.reduce((acc, m) => acc + m.valorAPagar, 0);

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-500">Carregando cartões...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Cartões de Crédito</h1>
        {!isFormOpen && (
          <button
            onClick={() => {
              setEditingCartao(null);
              setIsFormOpen(true);
              setError(null);
            }}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
          >
            <Plus className="-ml-1 mr-2 h-5 w-5" />
            Novo Cartão
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
        <CartaoForm
          initialData={editingCartao}
          onSubmit={handleSubmit}
          onCancel={() => {
            setIsFormOpen(false);
            setEditingCartao(null);
          }}
        />
      ) : (
        <div className="space-y-8">
          <DataTable
            columns={columns}
            data={cartoes}
            onEdit={(cartao) => {
              setEditingCartao(cartao);
              setIsFormOpen(true);
            }}
            onDelete={handleDeleteClick}
          />

          {/* Resumo de Faturas */}
          <div className="bg-white shadow-sm border border-gray-200 rounded-2xl overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 bg-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center">
                <div className="p-2 bg-indigo-50 rounded-lg mr-3">
                  <CreditCard className="h-5 w-5 text-indigo-600" />
                </div>
                <h3 className="text-lg leading-6 font-semibold text-gray-900">
                  Resumo de Faturas
                </h3>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex items-center">
                  <label htmlFor="cartao" className="text-sm font-medium text-gray-700 mr-2">Cartão:</label>
                  <select
                    id="cartao"
                    value={cartaoSelecionado}
                    onChange={(e) => setCartaoSelecionado(e.target.value)}
                    className="block w-full sm:w-48 rounded-xl border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2 transition-shadow"
                  >
                    <option value="todos">Todos os cartões</option>
                    {cartoes.map(cartao => (
                      <option key={cartao.id} value={cartao.id}>{cartao.nome}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center">
                  <label htmlFor="ano" className="text-sm font-medium text-gray-700 mr-2">Ano:</label>
                  <select
                    id="ano"
                    value={anoSelecionado}
                    onChange={(e) => setAnoSelecionado(Number(e.target.value))}
                    className="block w-full sm:w-32 rounded-xl border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2 transition-shadow"
                  >
                    {anosDisponiveis.map(ano => (
                      <option key={ano} value={ano}>{ano}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50/50">
                  <tr>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Mês</th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Valor da Fatura</th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Valor Pago</th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Valor a Pagar</th>
                    <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Ações</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {faturasPorMes.map((fatura, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/80 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {fatura.mes}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(fatura.valorFatura)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-emerald-600">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(fatura.valorPago)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-rose-600">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(fatura.valorAPagar)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => handleDetalharFatura(idx, fatura.mes)}
                            className="inline-flex items-center px-3 py-1.5 border border-gray-200 text-xs font-medium rounded-lg shadow-sm text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all"
                            title="Ver detalhes das parcelas"
                          >
                            <Eye className="h-4 w-4 mr-1.5 text-gray-400" />
                            Detalhes
                          </button>
                          {fatura.valorAPagar > 0 && (
                            <button
                              onClick={() => handlePagarFatura(idx)}
                              disabled={payingMonth === idx}
                              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-lg shadow-sm text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 transition-all"
                              title="Dar baixa em todas as parcelas deste mês"
                            >
                              {payingMonth === idx ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1.5"></div>
                              ) : (
                                <CheckCircle2 className="h-4 w-4 mr-1.5" />
                              )}
                              Pagar Fatura
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50/80 font-semibold border-t border-gray-200">
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Total do Ano</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalAnoFatura)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-emerald-600">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalAnoPago)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-rose-600">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalAnoAPagar)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      {deletingCartao && (
        <ConfirmModal
          title="Excluir Cartão de Crédito"
          message={`Tem certeza que deseja excluir o cartão "${deletingCartao.nome}"?`}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeletingCartao(null)}
        />
      )}

      {detalhesMes && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-500 bg-opacity-75">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900" id="modal-title">
                Detalhes da Fatura - {detalhesMes.mes} {anoSelecionado}
              </h3>
              <button
                onClick={() => setDetalhesMes(null)}
                className="text-gray-400 hover:text-gray-500 focus:outline-none"
              >
                <span className="sr-only">Fechar</span>
                <X className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              {detalhesMes.despesas.length > 0 ? (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descrição</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoria</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {detalhesMes.despesas.map((despesa) => (
                      <tr key={despesa.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {format(parseISO(despesa.data_pagamento), 'dd/MM/yyyy')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {despesa.descricao}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {despesa.categorias?.nome || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(despesa.valor)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={cn(
                            "px-2 inline-flex text-xs leading-5 font-semibold rounded-full",
                            despesa.pago ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                          )}>
                            {despesa.pago ? 'Pago' : 'Pendente'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">Nenhuma despesa encontrada para este mês.</p>
              )}
            </div>
            
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
              <button
                type="button"
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                onClick={() => setDetalhesMes(null)}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

