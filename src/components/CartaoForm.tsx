import React, { useState, useEffect } from 'react';
import { Database } from '../types/database';

type Cartao = Database['public']['Tables']['cartoes_credito']['Row'];

interface CartaoFormProps {
  initialData?: Cartao | null;
  onSubmit: (data: Omit<Cartao, 'id' | 'criado_em' | 'igreja_id'>) => void;
  onCancel: () => void;
}

export default function CartaoForm({ initialData, onSubmit, onCancel }: CartaoFormProps) {
  const [formData, setFormData] = useState({
    nome: '',
    bandeira: '',
    limite: 0,
    dia_fechamento: 1,
    dia_vencimento: 10,
    ativo: true,
    observacoes: ''
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        nome: initialData.nome,
        bandeira: initialData.bandeira || '',
        limite: initialData.limite || 0,
        dia_fechamento: initialData.dia_fechamento || 1,
        dia_vencimento: initialData.dia_vencimento || 10,
        ativo: initialData.ativo ?? true,
        observacoes: initialData.observacoes || ''
      });
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (name === 'limite' || name === 'dia_fechamento' || name === 'dia_vencimento') {
      setFormData(prev => ({ ...prev, [name]: Number(value) }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 md:p-8 rounded-xl shadow-sm border border-gray-100">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="nome" className="block text-sm font-medium text-gray-700 mb-1.5">
            Nome do Cartão / Banco *
          </label>
          <input
            type="text"
            name="nome"
            id="nome"
            required
            value={formData.nome}
            onChange={handleChange}
            className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
          />
        </div>

        <div>
          <label htmlFor="bandeira" className="block text-sm font-medium text-gray-700 mb-1.5">
            Bandeira
          </label>
          <input
            type="text"
            name="bandeira"
            id="bandeira"
            placeholder="Visa, Mastercard, etc."
            value={formData.bandeira}
            onChange={handleChange}
            className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
          />
        </div>

        <div>
          <label htmlFor="limite" className="block text-sm font-medium text-gray-700 mb-1.5">
            Limite Total
          </label>
          <input
            type="number"
            name="limite"
            id="limite"
            step="0.01"
            min="0"
            value={formData.limite}
            onChange={handleChange}
            className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
          />
        </div>

        <div className="flex items-center mt-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
          <input
            id="ativo"
            name="ativo"
            type="checkbox"
            checked={formData.ativo}
            onChange={handleChange}
            className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded transition-all"
          />
          <label htmlFor="ativo" className="ml-3 block text-sm font-medium text-gray-900">
            Cartão Ativo
          </label>
        </div>

        <div>
          <label htmlFor="dia_fechamento" className="block text-sm font-medium text-gray-700 mb-1.5">
            Dia de Fechamento da Fatura
          </label>
          <input
            type="number"
            name="dia_fechamento"
            id="dia_fechamento"
            min="1"
            max="31"
            value={formData.dia_fechamento}
            onChange={handleChange}
            className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
          />
        </div>

        <div>
          <label htmlFor="dia_vencimento" className="block text-sm font-medium text-gray-700 mb-1.5">
            Dia de Vencimento
          </label>
          <input
            type="number"
            name="dia_vencimento"
            id="dia_vencimento"
            min="1"
            max="31"
            value={formData.dia_vencimento}
            onChange={handleChange}
            className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
          />
        </div>

        <div className="md:col-span-2">
          <label htmlFor="observacoes" className="block text-sm font-medium text-gray-700 mb-1.5">
            Observações
          </label>
          <textarea
            name="observacoes"
            id="observacoes"
            rows={3}
            value={formData.observacoes}
            onChange={handleChange}
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
          className="px-5 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all"
        >
          Salvar
        </button>
      </div>
    </form>
  );
}
