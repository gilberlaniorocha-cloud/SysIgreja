import React, { useState, useEffect } from 'react';
import { Database } from '../types/database';
import { addMonths, parseISO, format } from 'date-fns';
import { getSubcategorias } from '../lib/queries';

type Despesa = Database['public']['Tables']['despesas']['Row'];
type Conta = Database['public']['Tables']['contas_bancarias']['Row'];
type Categoria = Database['public']['Tables']['categorias']['Row'];
type Subcategoria = Database['public']['Tables']['subcategorias']['Row'];
type Cartao = Database['public']['Tables']['cartoes_credito']['Row'];

interface DespesaFormProps {
  initialData?: Despesa | null;
  contas: Conta[];
  categorias: Categoria[];
  cartoes: Cartao[];
  onSubmit: (
    data: Omit<Despesa, 'id' | 'criado_em' | 'igreja_id'> | Omit<Despesa, 'id' | 'criado_em' | 'igreja_id'>[],
    updateScope?: 'single' | 'previous' | 'future' | 'all'
  ) => Promise<void>;
  onCancel: () => void;
}

export default function DespesaForm({ initialData, contas, categorias, cartoes, onSubmit, onCancel }: DespesaFormProps) {
  const [contaId, setContaId] = useState(initialData?.conta_id || '');
  const [cartaoId, setCartaoId] = useState(initialData?.cartao_id || '');
  const [categoriaId, setCategoriaId] = useState(initialData?.categoria_id || '');
  const [subcategoriaId, setSubcategoriaId] = useState(initialData?.subcategoria_id || '');
  const [subcategorias, setSubcategorias] = useState<Subcategoria[]>([]);
  const [descricao, setDescricao] = useState(initialData?.descricao || '');
  const [valor, setValor] = useState(initialData?.valor?.toString() || '');
  const [dataPagamento, setDataPagamento] = useState(initialData?.data_pagamento || new Date().toISOString().split('T')[0]);
  const [pago, setPago] = useState<boolean>(initialData?.pago ?? true);
  const [loading, setLoading] = useState(false);
  
  const [tipoDespesa, setTipoDespesa] = useState<'unica' | 'parcelada' | 'fixa'>('unica');
  const [parcelas, setParcelas] = useState<number | ''>(2);
  const [mesesFixos, setMesesFixos] = useState<number | ''>(12);
  const [tipoValorParcela, setTipoValorParcela] = useState<'total' | 'parcela'>('total');
  const [updateScope, setUpdateScope] = useState<'single' | 'previous' | 'future' | 'all'>('single');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (categoriaId) {
      getSubcategorias(categoriaId).then(setSubcategorias).catch(console.error);
    } else {
      setSubcategorias([]);
      setSubcategoriaId('');
    }
  }, [categoriaId]);

  const isInstallment = initialData?.grupo_id || initialData?.descricao?.match(/^(.*) \(\d+\/\d+\)$/);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!contaId) {
      setError('Por favor, selecione uma conta bancária.');
      return;
    }
    setLoading(true);
    try {
      const valorNum = parseFloat(valor);
      
      if (!initialData && tipoDespesa !== 'unica') {
        const despesasArray: Omit<Despesa, 'id' | 'criado_em' | 'igreja_id'>[] = [];
        const numIteracoes = tipoDespesa === 'parcelada' ? (Number(parcelas) || 2) : (Number(mesesFixos) || 12);
        const numParcelas = Number(parcelas) || 2;
        const grupoId = crypto.randomUUID();
        
        const valorParcela = tipoDespesa === 'parcelada' && tipoValorParcela === 'total' 
          ? Number((valorNum / numParcelas).toFixed(2))
          : valorNum;
        
        for (let i = 0; i < numIteracoes; i++) {
          const dataAtual = format(addMonths(parseISO(dataPagamento), i), 'yyyy-MM-dd');
          let desc = descricao || '';
          
          if (tipoDespesa === 'parcelada') {
            desc = `${desc} (${i + 1}/${numParcelas})`;
          } else if (tipoDespesa === 'fixa') {
            // Optional: add something to description for fixed expenses, or leave as is
          }
          
          despesasArray.push({
            conta_id: contaId,
            cartao_id: cartaoId || null,
            categoria_id: categoriaId || null,
            subcategoria_id: subcategoriaId || null,
            descricao: desc || null,
            valor: valorParcela,
            data_pagamento: dataAtual,
            pago: pago,
            grupo_id: grupoId,
          });
        }
        await onSubmit(despesasArray);
      } else {
        await onSubmit({
          conta_id: contaId,
          cartao_id: cartaoId || null,
          categoria_id: categoriaId || null,
          subcategoria_id: subcategoriaId || null,
          descricao: descricao || null,
          valor: valorNum,
          data_pagamento: dataPagamento,
          pago: pago,
          grupo_id: initialData?.grupo_id || null,
        }, updateScope);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 md:p-8 rounded-xl shadow-sm border border-gray-100">
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}
      {!initialData && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Despesa</label>
          <div className="flex space-x-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
            <label className="inline-flex items-center cursor-pointer">
              <input
                type="radio"
                className="form-radio h-5 w-5 text-indigo-600 border-gray-300 focus:ring-indigo-500 transition-all"
                name="tipoDespesa"
                value="unica"
                checked={tipoDespesa === 'unica'}
                onChange={() => setTipoDespesa('unica')}
              />
              <span className="ml-3 text-sm font-medium text-gray-900">Única</span>
            </label>
            <label className="inline-flex items-center cursor-pointer">
              <input
                type="radio"
                className="form-radio h-5 w-5 text-indigo-600 border-gray-300 focus:ring-indigo-500 transition-all"
                name="tipoDespesa"
                value="parcelada"
                checked={tipoDespesa === 'parcelada'}
                onChange={() => setTipoDespesa('parcelada')}
              />
              <span className="ml-3 text-sm font-medium text-gray-900">Parcelada</span>
            </label>
            <label className="inline-flex items-center cursor-pointer">
              <input
                type="radio"
                className="form-radio h-5 w-5 text-indigo-600 border-gray-300 focus:ring-indigo-500 transition-all"
                name="tipoDespesa"
                value="fixa"
                checked={tipoDespesa === 'fixa'}
                onChange={() => setTipoDespesa('fixa')}
              />
              <span className="ml-3 text-sm font-medium text-gray-900">Fixa</span>
            </label>
          </div>
        </div>
      )}

      {tipoDespesa === 'parcelada' && !initialData && (
        <div className="space-y-6">
          <div>
            <label htmlFor="parcelas" className="block text-sm font-medium text-gray-700 mb-1.5">Número de Parcelas</label>
            <input
              type="number"
              id="parcelas"
              min="2"
              max="120"
              required
              value={parcelas}
              onChange={(e) => setParcelas(e.target.value === '' ? '' : parseInt(e.target.value))}
              className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">O valor informado abaixo é:</label>
            <div className="flex space-x-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
              <label className="inline-flex items-center cursor-pointer">
                <input
                  type="radio"
                  className="form-radio h-5 w-5 text-indigo-600 border-gray-300 focus:ring-indigo-500 transition-all"
                  name="tipoValorParcela"
                  value="total"
                  checked={tipoValorParcela === 'total'}
                  onChange={() => setTipoValorParcela('total')}
                />
                <span className="ml-3 text-sm font-medium text-gray-900">Valor Total (será dividido)</span>
              </label>
              <label className="inline-flex items-center cursor-pointer">
                <input
                  type="radio"
                  className="form-radio h-5 w-5 text-indigo-600 border-gray-300 focus:ring-indigo-500 transition-all"
                  name="tipoValorParcela"
                  value="parcela"
                  checked={tipoValorParcela === 'parcela'}
                  onChange={() => setTipoValorParcela('parcela')}
                />
                <span className="ml-3 text-sm font-medium text-gray-900">Valor da Parcela</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {tipoDespesa === 'fixa' && !initialData && (
        <div>
          <label htmlFor="mesesFixos" className="block text-sm font-medium text-gray-700 mb-1.5">Gerar para quantos meses?</label>
          <input
            type="number"
            id="mesesFixos"
            min="2"
            max="120"
            required
            value={mesesFixos}
            onChange={(e) => setMesesFixos(e.target.value === '' ? '' : parseInt(e.target.value))}
            className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
          />
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="contaId" className="block text-sm font-medium text-gray-700 mb-1.5">Conta Bancária *</label>
          <select
            id="contaId"
            required
            value={contaId}
            onChange={(e) => setContaId(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
          >
          <option value="">Selecione uma conta</option>
          {contas.map((conta) => (
            <option key={conta.id} value={conta.id}>{conta.nome_conta}</option>
          ))}
        </select>
      </div>
        <div>
          <label htmlFor="cartaoId" className="block text-sm font-medium text-gray-700 mb-1.5">Cartão de Crédito</label>
          <select
            id="cartaoId"
            value={cartaoId}
            onChange={(e) => setCartaoId(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
          >
            <option value="">Nenhum cartão</option>
            {cartoes.map((cartao) => (
              <option key={cartao.id} value={cartao.id}>{cartao.nome}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="categoriaId" className="block text-sm font-medium text-gray-700 mb-1.5">Categoria (Tipo de Despesa)</label>
          <select
            id="categoriaId"
            value={categoriaId}
            onChange={(e) => {
              setCategoriaId(e.target.value);
              setSubcategoriaId('');
            }}
            className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
          >
            <option value="">Selecione uma categoria (opcional)</option>
            {categorias.map((categoria) => (
              <option key={categoria.id} value={categoria.id}>{categoria.nome}</option>
            ))}
          </select>
        </div>
        {subcategorias.length > 0 && (
          <div>
            <label htmlFor="subcategoriaId" className="block text-sm font-medium text-gray-700 mb-1.5">Subcategoria</label>
            <select
              id="subcategoriaId"
              value={subcategoriaId}
              onChange={(e) => setSubcategoriaId(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
            >
              <option value="">Selecione uma subcategoria (opcional)</option>
              {subcategorias.map((subcategoria) => (
                <option key={subcategoria.id} value={subcategoria.id}>{subcategoria.nome}</option>
              ))}
            </select>
          </div>
        )}
        <div className="md:col-span-2">
          <label htmlFor="descricao" className="block text-sm font-medium text-gray-700 mb-1.5">Descrição</label>
          <input
            type="text"
            id="descricao"
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
          />
        </div>
        <div>
          <label htmlFor="valor" className="block text-sm font-medium text-gray-700 mb-1.5">
            {tipoDespesa === 'parcelada' 
              ? (tipoValorParcela === 'total' ? 'Valor Total a ser dividido' : 'Valor de cada parcela') 
              : tipoDespesa === 'fixa' ? 'Valor mensal' : 'Valor'}
          </label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            id="valor"
            required
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
          />
        </div>
        <div>
          <label htmlFor="dataPagamento" className="block text-sm font-medium text-gray-700 mb-1.5">Data do Pagamento / Vencimento</label>
          <input
            type="date"
            id="dataPagamento"
            required
            value={dataPagamento}
            onChange={(e) => setDataPagamento(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
          />
        </div>
      </div>

      <div className="flex items-center mt-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
        <input
          id="pago"
          type="checkbox"
          checked={pago}
          onChange={(e) => setPago(e.target.checked)}
          className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded transition-all"
        />
        <label htmlFor="pago" className="ml-3 block text-sm font-medium text-gray-900">
          Despesa já foi paga
        </label>
      </div>

      {isInstallment && (
        <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-md">
          <p className="text-sm font-medium text-gray-700 mb-3">
            Esta despesa faz parte de um parcelamento. Como deseja aplicar as alterações?
          </p>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="radio"
                name="updateScope"
                value="single"
                checked={updateScope === 'single'}
                onChange={() => setUpdateScope('single')}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
              />
              <span className="ml-2 text-sm text-gray-700">Alterar só esse lançamento</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="updateScope"
                value="previous"
                checked={updateScope === 'previous'}
                onChange={() => setUpdateScope('previous')}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
              />
              <span className="ml-2 text-sm text-gray-700">Alterar esse e as parcelas anteriores</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="updateScope"
                value="future"
                checked={updateScope === 'future'}
                onChange={() => setUpdateScope('future')}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
              />
              <span className="ml-2 text-sm text-gray-700">Alterar esse e as parcelas futuras</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="updateScope"
                value="all"
                checked={updateScope === 'all'}
                onChange={() => setUpdateScope('all')}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
              />
              <span className="ml-2 text-sm text-gray-700">Alterar todas as parcelas</span>
            </label>
          </div>
        </div>
      )}

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
