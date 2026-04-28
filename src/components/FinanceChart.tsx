import { useEffect, useState } from 'react';
import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getReceitas, getDespesas } from '../lib/queries';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ChartData {
  name: string;
  Receitas: number;
  Despesas: number;
  Saldo: number;
}

export default function FinanceChart({ igrejaId }: { igrejaId: string }) {
  const [data, setData] = useState<ChartData[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [receitas, despesas] = await Promise.all([
          getReceitas(igrejaId),
          getDespesas(igrejaId)
        ]);

        // Group by YYYY-MM for proper chronological sorting
        const groupedData: Record<string, { Receitas: number; Despesas: number }> = {};

        (receitas as any[]).forEach(r => {
          const date = parseISO(r.data_recebimento);
          const key = format(date, 'yyyy-MM');
          if (!groupedData[key]) groupedData[key] = { Receitas: 0, Despesas: 0 };
          groupedData[key].Receitas += Number(r.valor);
        });

        (despesas as any[]).forEach(d => {
          const date = parseISO(d.data_pagamento);
          const key = format(date, 'yyyy-MM');
          if (!groupedData[key]) groupedData[key] = { Receitas: 0, Despesas: 0 };
          groupedData[key].Despesas += Number(d.valor);
        });

        const sortedKeys = Object.keys(groupedData).sort();

        const chartData = sortedKeys.map(key => {
          const [year, month] = key.split('-');
          const date = new Date(Number(year), Number(month) - 1);
          return {
            name: format(date, 'MMM yyyy', { locale: ptBR }),
            Receitas: groupedData[key].Receitas,
            Despesas: groupedData[key].Despesas,
            Saldo: groupedData[key].Receitas - groupedData[key].Despesas
          };
        });

        setData(chartData);
      } catch (error) {
        console.error('Error loading chart data:', error);
      }
    };

    loadData();
  }, [igrejaId]);

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart
        data={data}
        margin={{
          top: 5,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
        <XAxis 
          dataKey="name" 
          axisLine={false}
          tickLine={false}
          tick={{ fill: '#64748b', fontSize: 12 }}
          dy={10}
        />
        <YAxis 
          axisLine={false}
          tickLine={false}
          tick={{ fill: '#64748b', fontSize: 12 }}
          tickFormatter={(value) => `R$ ${value / 1000}k`}
          dx={-10}
        />
        <Tooltip 
          formatter={(value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value as number)}
          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
        />
        <Legend 
          iconType="circle"
          wrapperStyle={{ paddingTop: '20px' }}
        />
        <Bar dataKey="Receitas" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
        <Bar dataKey="Despesas" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={40} />
        <Line type="monotone" dataKey="Saldo" stroke="#6366f1" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6, strokeWidth: 0 }} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
