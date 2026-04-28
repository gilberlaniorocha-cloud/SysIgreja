import { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, Label } from 'recharts';
import { getDespesas } from '../lib/queries';

interface CategoryData {
  name: string;
  value: number;
  percentage: number;
}

const COLORS = [
  '#3b82f6', // blue-500
  '#ef4444', // red-500
  '#10b981', // emerald-500
  '#f59e0b', // amber-500
  '#8b5cf6', // violet-500
  '#ec4899', // pink-500
  '#14b8a6', // teal-500
  '#f97316', // orange-500
  '#6366f1', // indigo-500
  '#84cc16', // lime-500
];

export default function ExpensesByCategoryChart({ igrejaId }: { igrejaId: string }) {
  const [data, setData] = useState<CategoryData[]>([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const loadData = async () => {
      try {
        const despesas = await getDespesas(igrejaId);

        // Group by category
        const groupedData: Record<string, number> = {};
        let totalExpenses = 0;

        (despesas as any[]).forEach(d => {
          const cat = d.categorias?.nome || 'Sem Categoria';
          if (!groupedData[cat]) groupedData[cat] = 0;
          const val = Number(d.valor);
          groupedData[cat] += val;
          totalExpenses += val;
        });

        const chartData = Object.keys(groupedData)
          .map(key => ({
            name: key,
            value: groupedData[key],
            percentage: totalExpenses > 0 ? (groupedData[key] / totalExpenses) * 100 : 0
          }))
          .sort((a, b) => b.value - a.value); // Sort by highest expense

        setData(chartData);
        setTotal(totalExpenses);
      } catch (error) {
        console.error('Error loading expenses by category:', error);
      }
    };

    loadData();
  }, [igrejaId]);

  if (data.length === 0) {
    return (
      <div className="flex justify-center items-center h-full text-gray-500 text-sm">
        Nenhuma despesa registrada.
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 border border-gray-100 shadow-xl rounded-xl">
          <p className="font-semibold text-gray-900 mb-2">{data.name}</p>
          <div className="space-y-1">
            <p className="text-sm text-gray-600 flex justify-between gap-4">
              <span>Valor:</span>
              <span className="font-semibold text-gray-900">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data.value)}</span>
            </p>
            <p className="text-sm text-gray-600 flex justify-between gap-4">
              <span>Representa:</span>
              <span className="font-semibold text-gray-900">{data.percentage.toFixed(1)}%</span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col md:flex-row h-full items-center">
      <div className="w-full md:w-1/2 h-64 relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={65}
              outerRadius={85}
              paddingAngle={2}
              dataKey="value"
              stroke="none"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
              <Label
                value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(total)}
                position="center"
                className="text-sm font-bold fill-gray-900"
              />
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      
      <div className="w-full md:w-1/2 mt-6 md:mt-0 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
        <div className="space-y-2">
          {data.map((item, index) => (
            <div key={item.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
              <div className="flex items-center space-x-3 truncate pr-4">
                <div 
                  className="w-3 h-3 rounded-full flex-shrink-0 shadow-sm" 
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className="text-sm font-medium text-gray-700 truncate" title={item.name}>
                  {item.name}
                </span>
              </div>
              <div className="flex flex-col items-end flex-shrink-0">
                <span className="text-sm font-bold text-gray-900">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.value)}
                </span>
                <span className="text-xs font-medium text-gray-500 bg-white px-2 py-0.5 rounded-full mt-1 border border-gray-100 shadow-sm">
                  {item.percentage.toFixed(1)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
