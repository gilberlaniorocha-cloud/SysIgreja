import { useEffect, useState } from 'react';
import { getDespesas } from '../lib/queries';
import { format, parseISO, isSameYear } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface MonthlySummary {
  month: string;
  total: number;
  count: number;
  monthNumber: number;
}

export default function UnpaidExpensesSummary({ igrejaId }: { igrejaId: string }) {
  const [data, setData] = useState<MonthlySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [availableYears, setAvailableYears] = useState<number[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const despesas = await getDespesas(igrejaId);

        // Extract available years
        const years = new Set<number>();
        years.add(new Date().getFullYear()); // Always include current year

        (despesas as any[]).forEach(d => {
          if (d.data_pagamento) {
            years.add(parseISO(d.data_pagamento).getFullYear());
          }
        });
        
        setAvailableYears(Array.from(years).sort((a, b) => b - a));

        // Filter unpaid expenses for the selected year
        const unpaidDespesas = (despesas as any[]).filter(d => 
          d.pago === false && 
          d.data_pagamento && 
          parseISO(d.data_pagamento).getFullYear() === selectedYear
        );

        // Group by month
        const groupedData: Record<number, { total: number; count: number }> = {};
        
        unpaidDespesas.forEach(d => {
          const monthNum = parseISO(d.data_pagamento).getMonth();
          if (!groupedData[monthNum]) {
            groupedData[monthNum] = { total: 0, count: 0 };
          }
          groupedData[monthNum].total += Number(d.valor);
          groupedData[monthNum].count += 1;
        });

        const summaryData = Object.keys(groupedData).map(key => {
          const monthNum = parseInt(key);
          // Create a dummy date to format the month name
          const date = new Date(selectedYear, monthNum, 1);
          return {
            month: format(date, 'MMMM', { locale: ptBR }),
            total: groupedData[monthNum].total,
            count: groupedData[monthNum].count,
            monthNumber: monthNum
          };
        }).sort((a, b) => a.monthNumber - b.monthNumber);

        setData(summaryData);
      } catch (error) {
        console.error('Error loading unpaid expenses:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [igrejaId, selectedYear]);

  if (loading) {
    return <div className="animate-pulse h-64 bg-gray-50 rounded-2xl border border-gray-100"></div>;
  }

  const totalUnpaid = data.reduce((acc, curr) => acc + curr.total, 0);

  return (
    <div className="bg-white shadow-sm border border-gray-100 rounded-2xl p-6 md:p-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Despesas a Pagar (Em Aberto)</h2>
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(Number(e.target.value))}
          className="rounded-lg border border-gray-300 bg-gray-50 px-3 py-1.5 text-sm text-gray-900 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
        >
          {availableYears.map(year => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>
      </div>

      {data.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
          <p className="text-gray-500">Nenhuma despesa em aberto para o ano de {selectedYear}.</p>
        </div>
      ) : (
        <>
          <div className="mb-6 p-4 bg-red-50 rounded-xl border border-red-100">
            <p className="text-sm font-medium text-red-800 mb-1">Total a pagar em {selectedYear}</p>
            <p className="text-3xl font-bold text-red-600 tracking-tight">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalUnpaid)}
            </p>
          </div>
          
          <div className="flow-root max-h-64 overflow-y-auto pr-2 custom-scrollbar">
            <ul className="space-y-3">
              {data.map((item) => (
                <li key={item.monthNumber} className="p-4 bg-gray-50 rounded-xl border border-gray-100 flex justify-between items-center hover:border-red-200 hover:bg-red-50/30 transition-all">
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-gray-900 capitalize">{item.month}</span>
                    <span className="text-xs font-medium text-gray-500 mt-0.5">{item.count} {item.count === 1 ? 'despesa' : 'despesas'}</span>
                  </div>
                  <span className="text-sm font-bold text-red-600">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.total)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
