import React, { useState } from 'react';
import { Database } from '../types/database';

type Despesa = Database['public']['Tables']['despesas']['Row'];

interface DeleteDespesaModalProps {
  despesa: Despesa;
  despesas: Despesa[];
  onClose: () => void;
  onConfirm: (idsToDelete: string[]) => void;
}

export default function DeleteDespesaModal({ despesa, despesas, onClose, onConfirm }: DeleteDespesaModalProps) {
  const [deleteOption, setDeleteOption] = useState<'current' | 'future' | 'all'>('current');

  // Parse description to find if it's an installment
  const match = despesa.descricao?.match(/^(.*) \((\d+)\/(\d+)\)$/);
  
  if (!match) {
    // Should not happen if we only show this modal for installments, 
    // but fallback to just deleting the current one.
    return (
      <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-opacity">
        <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl transform transition-all">
          <h3 className="text-xl font-semibold text-gray-900 mb-3">Excluir Despesa</h3>
          <p className="text-sm text-gray-600 mb-6 leading-relaxed">
            Tem certeza que deseja excluir a despesa "{despesa.descricao}"?
          </p>
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-5 py-2.5 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all"
            >
              Cancelar
            </button>
            <button
              onClick={() => onConfirm([despesa.id])}
              className="px-5 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all"
            >
              Excluir
            </button>
          </div>
        </div>
      </div>
    );
  }

  const baseDescription = match[1];
  const currentInstallment = parseInt(match[2], 10);
  const totalInstallments = parseInt(match[3], 10);

  const handleConfirm = () => {
    let idsToDelete: string[] = [];

    if (deleteOption === 'current') {
      idsToDelete = [despesa.id];
    } else if (deleteOption === 'future') {
      // Find current and future installments
      idsToDelete = despesas
        .filter(d => {
          const dMatch = d.descricao?.match(/^(.*) \((\d+)\/(\d+)\)$/);
          if (!dMatch) return false;
          const dBase = dMatch[1];
          const dCurrent = parseInt(dMatch[2], 10);
          const dTotal = parseInt(dMatch[3], 10);
          
          return dBase === baseDescription && 
                 dTotal === totalInstallments && 
                 dCurrent >= currentInstallment &&
                 d.valor === despesa.valor &&
                 d.conta_id === despesa.conta_id;
        })
        .map(d => d.id);
    } else if (deleteOption === 'all') {
      // Find all installments
      idsToDelete = despesas
        .filter(d => {
          const dMatch = d.descricao?.match(/^(.*) \((\d+)\/(\d+)\)$/);
          if (!dMatch) return false;
          const dBase = dMatch[1];
          const dTotal = parseInt(dMatch[3], 10);
          
          return dBase === baseDescription && 
                 dTotal === totalInstallments &&
                 d.valor === despesa.valor &&
                 d.conta_id === despesa.conta_id;
        })
        .map(d => d.id);
    }

    onConfirm(idsToDelete);
  };

  return (
    <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-opacity">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl transform transition-all">
        <h3 className="text-xl font-semibold text-gray-900 mb-3">Excluir Despesa Parcelada</h3>
        <p className="text-sm text-gray-600 mb-6 leading-relaxed">
          A despesa "{despesa.descricao}" faz parte de um parcelamento. O que você deseja excluir?
        </p>
        
        <div className="space-y-4 mb-8 bg-gray-50 p-4 rounded-xl border border-gray-100">
          <label className="flex items-start cursor-pointer group">
            <div className="flex items-center h-5 mt-0.5">
              <input
                type="radio"
                className="form-radio text-red-600 h-4 w-4 border-gray-300 focus:ring-red-500"
                name="deleteOption"
                value="current"
                checked={deleteOption === 'current'}
                onChange={() => setDeleteOption('current')}
              />
            </div>
            <div className="ml-3 flex flex-col">
              <span className="text-sm font-medium text-gray-900 group-hover:text-red-600 transition-colors">Excluir só a parcela atual</span>
            </div>
          </label>
          <label className="flex items-start cursor-pointer group">
            <div className="flex items-center h-5 mt-0.5">
              <input
                type="radio"
                className="form-radio text-red-600 h-4 w-4 border-gray-300 focus:ring-red-500"
                name="deleteOption"
                value="future"
                checked={deleteOption === 'future'}
                onChange={() => setDeleteOption('future')}
              />
            </div>
            <div className="ml-3 flex flex-col">
              <span className="text-sm font-medium text-gray-900 group-hover:text-red-600 transition-colors">Excluir a parcela atual e as futuras</span>
            </div>
          </label>
          <label className="flex items-start cursor-pointer group">
            <div className="flex items-center h-5 mt-0.5">
              <input
                type="radio"
                className="form-radio text-red-600 h-4 w-4 border-gray-300 focus:ring-red-500"
                name="deleteOption"
                value="all"
                checked={deleteOption === 'all'}
                onChange={() => setDeleteOption('all')}
              />
            </div>
            <div className="ml-3 flex flex-col">
              <span className="text-sm font-medium text-gray-900 group-hover:text-red-600 transition-colors">Excluir todas as parcelas</span>
            </div>
          </label>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            className="px-5 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all"
          >
            Excluir
          </button>
        </div>
      </div>
    </div>
  );
}
