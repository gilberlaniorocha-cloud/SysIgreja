import React, { useState, useEffect } from 'react';
import { Database } from '../types/database';

type Conta = Database['public']['Tables']['contas_bancarias']['Row'];

interface ContaFormProps {
  initialData?: Conta | null;
  onSubmit: (data: Omit<Conta, 'id' | 'criado_em' | 'igreja_id'>) => Promise<void>;
  onCancel: () => void;
}

export default function ContaForm({ initialData, onSubmit, onCancel }: ContaFormProps) {
  const [nomeConta, setNomeConta] = useState(initialData?.nome_conta || '');
  const [banco, setBanco] = useState(initialData?.banco || '');
  const [saldoInicial, setSaldoInicial] = useState(initialData?.saldo_inicial?.toString() || '0');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        nome_conta: nomeConta,
        banco: banco || null,
        saldo_inicial: parseFloat(saldoInicial) || 0,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 md:p-8 rounded-xl shadow-sm border border-gray-100">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <label htmlFor="nomeConta" className="block text-sm font-medium text-gray-700 mb-1.5">Nome da Conta</label>
          <input
            type="text"
            id="nomeConta"
            required
            value={nomeConta}
            onChange={(e) => setNomeConta(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
          />
        </div>
        <div>
          <label htmlFor="banco" className="block text-sm font-medium text-gray-700 mb-1.5">Banco</label>
          <input
            type="text"
            id="banco"
            value={banco}
            onChange={(e) => setBanco(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
          />
        </div>
        <div>
          <label htmlFor="saldoInicial" className="block text-sm font-medium text-gray-700 mb-1.5">Saldo Inicial</label>
          <input
            type="number"
            step="0.01"
            id="saldoInicial"
            value={saldoInicial}
            onChange={(e) => setSaldoInicial(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
          />
        </div>
      </div>
      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
        <button
          type="button"
          onClick={onCancel}
          className="px-5 py-2.5 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-5 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-all"
        >
          {loading ? 'Salvando...' : 'Salvar'}
        </button>
      </div>
    </form>
  );
}
