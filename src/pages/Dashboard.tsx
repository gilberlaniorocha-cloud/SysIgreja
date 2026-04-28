import { useEffect, useState } from 'react';
import { useAuth } from '../lib/auth';
import { getDashboardStats, getReceitas, getDespesas } from '../lib/queries';
import { ArrowUpCircle, ArrowDownCircle, Wallet, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import FinanceChart from '../components/FinanceChart';
import ExpensesByCategoryChart from '../components/ExpensesByCategoryChart';
import UnpaidExpensesSummary from '../components/UnpaidExpensesSummary';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function Dashboard() {
  const { igrejaId } = useAuth();
  const [stats, setStats] = useState({ 
    totalReceitas: 0, 
    totalDespesas: 0, 
    saldoTotal: 0,
    saldoTotalReal: 0,
    despesasPagas: 0,
    despesasVencidas: 0
  });
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!igrejaId) {
      setLoading(false);
      return;
    }

    const loadData = async () => {
      try {
        setError(null);
        const [dashboardStats, receitas, despesas] = await Promise.all([
          getDashboardStats(igrejaId),
          getReceitas(igrejaId),
          getDespesas(igrejaId)
        ]);

        setStats(dashboardStats);

        // Combine and sort recent transactions
        const combined = [
          ...(receitas as any[]).map(r => ({ ...r, type: 'receita', date: r.data_recebimento })),
          ...(despesas as any[]).map(d => ({ ...d, type: 'despesa', date: d.data_pagamento }))
        ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
         .slice(0, 5);

        setRecentTransactions(combined);
      } catch (err: any) {
        console.error('Error loading dashboard data:', err);
        setError(err.message || 'Erro ao carregar os dados do dashboard. Verifique se as tabelas existem no Supabase.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [igrejaId]);

  if (loading) return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div><span className="ml-2 text-gray-600">Carregando dashboard...</span></div>;
  
  if (error) return (
    <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
      <div className="flex">
        <div className="ml-3">
          <h3 className="text-sm font-medium text-red-800">Erro ao carregar Dashboard</h3>
          <div className="mt-2 text-sm text-red-700">
            <p>{error}</p>
            <p className="mt-2 text-xs">Dica: Se você acabou de criar o projeto no Supabase, certifique-se de que rodou os scripts SQL para criar as tabelas (usuarios, contas_bancarias, receitas, despesas) e que o seu usuário está vinculado a uma igreja na tabela usuarios.</p>
          </div>
        </div>
      </div>
    </div>
  );

  if (!igrejaId) return (
    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md">
      <div className="flex">
        <div className="ml-3">
          <h3 className="text-sm font-medium text-yellow-800">Usuário sem Igreja vinculada</h3>
          <div className="mt-2 text-sm text-yellow-700">
            <p>Seu usuário está logado, mas não está vinculado a nenhuma igreja no banco de dados.</p>
            <p className="mt-2 text-xs">Vá no painel do Supabase, na tabela "usuarios", e certifique-se de que o seu usuário tem um "igreja_id" preenchido.</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Dashboard Financeiro</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <div className="bg-white overflow-hidden shadow-sm border border-gray-100 rounded-2xl transition-all hover:shadow-md xl:col-span-2">
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-indigo-50 p-3 rounded-xl">
                <Wallet className="h-6 w-6 text-indigo-600" aria-hidden="true" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Saldo Real (Pago/Recebido)</dt>
                  <dd className="text-2xl font-bold text-gray-900 mt-1">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.saldoTotalReal)}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow-sm border border-gray-100 rounded-2xl transition-all hover:shadow-md xl:col-span-2">
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-blue-50 p-3 rounded-xl">
                <Clock className="h-6 w-6 text-blue-600" aria-hidden="true" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Saldo Previsto</dt>
                  <dd className="text-2xl font-bold text-gray-900 mt-1">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.saldoTotal)}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow-sm border border-gray-100 rounded-2xl transition-all hover:shadow-md xl:col-span-2">
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-emerald-50 p-3 rounded-xl">
                <ArrowUpCircle className="h-6 w-6 text-emerald-600" aria-hidden="true" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Receitas</dt>
                  <dd className="text-2xl font-bold text-gray-900 mt-1">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.totalReceitas)}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow-sm border border-gray-100 rounded-2xl transition-all hover:shadow-md xl:col-span-2">
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-rose-50 p-3 rounded-xl">
                <ArrowDownCircle className="h-6 w-6 text-rose-600" aria-hidden="true" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Despesas</dt>
                  <dd className="text-2xl font-bold text-gray-900 mt-1">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.totalDespesas)}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow-sm border border-gray-100 rounded-2xl transition-all hover:shadow-md xl:col-span-2">
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-50 p-3 rounded-xl">
                <CheckCircle className="h-6 w-6 text-green-600" aria-hidden="true" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Despesas Pagas</dt>
                  <dd className="text-2xl font-bold text-gray-900 mt-1">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.despesasPagas)}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow-sm border border-gray-100 rounded-2xl transition-all hover:shadow-md xl:col-span-2">
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-red-50 p-3 rounded-xl">
                <AlertCircle className="h-6 w-6 text-red-600" aria-hidden="true" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-red-500 truncate">Despesas Vencidas</dt>
                  <dd className="text-2xl font-bold text-red-600 mt-1">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.despesasVencidas)}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart */}
        <div className="bg-white shadow-sm border border-gray-100 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Receitas vs Despesas</h2>
          <div className="h-72">
            <FinanceChart igrejaId={igrejaId!} />
          </div>
        </div>

        {/* Expenses by Category Chart */}
        <div className="bg-white shadow-sm border border-gray-100 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Despesas por Categoria</h2>
          <div className="h-72">
            <ExpensesByCategoryChart igrejaId={igrejaId!} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <UnpaidExpensesSummary igrejaId={igrejaId!} />

        {/* Recent Transactions */}
        <div className="bg-white shadow-sm border border-gray-100 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Últimas Movimentações</h2>
            <div className="flow-root">
              <ul className="-my-5 divide-y divide-gray-100">
              {recentTransactions.map((transaction) => (
                <li key={transaction.id} className="py-4 hover:bg-gray-50 transition-colors rounded-xl px-2 -mx-2">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      {transaction.type === 'receita' ? (
                        <div className="bg-emerald-50 p-2 rounded-lg">
                          <ArrowUpCircle className="h-5 w-5 text-emerald-600" />
                        </div>
                      ) : (
                        <div className="bg-rose-50 p-2 rounded-lg">
                          <ArrowDownCircle className="h-5 w-5 text-rose-600" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {transaction.descricao}
                      </p>
                      <p className="text-xs text-gray-500 truncate mt-0.5">
                        {format(new Date(transaction.date), "dd 'de' MMM, yyyy", { locale: ptBR })}
                        {' · '}
                        {transaction.contas_bancarias?.nome_conta}
                      </p>
                    </div>
                    <div>
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                        transaction.type === 'receita' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'
                      }`}>
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(transaction.valor)}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
              {recentTransactions.length === 0 && (
                <li className="py-8 text-center text-sm text-gray-500 bg-gray-50 rounded-xl">
                  Nenhuma movimentação recente.
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
