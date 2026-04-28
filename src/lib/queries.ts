import { supabase } from './supabaseClient';
import { Database } from '../types/database';

type ContaRow = Database['public']['Tables']['contas_bancarias']['Row'];
type ContaInsert = Database['public']['Tables']['contas_bancarias']['Insert'];
type ContaUpdate = Database['public']['Tables']['contas_bancarias']['Update'];

type ReceitaRow = Database['public']['Tables']['receitas']['Row'];
type ReceitaInsert = Database['public']['Tables']['receitas']['Insert'];
type ReceitaUpdate = Database['public']['Tables']['receitas']['Update'];

type DespesaRow = Database['public']['Tables']['despesas']['Row'];
type DespesaInsert = Database['public']['Tables']['despesas']['Insert'];
type DespesaUpdate = Database['public']['Tables']['despesas']['Update'];

type CategoriaRow = Database['public']['Tables']['categorias']['Row'];
type CategoriaInsert = Database['public']['Tables']['categorias']['Insert'];
type CategoriaUpdate = Database['public']['Tables']['categorias']['Update'];

type SubcategoriaRow = Database['public']['Tables']['subcategorias']['Row'];
type SubcategoriaInsert = Database['public']['Tables']['subcategorias']['Insert'];
type SubcategoriaUpdate = Database['public']['Tables']['subcategorias']['Update'];

type CartaoCreditoRow = Database['public']['Tables']['cartoes_credito']['Row'];
type CartaoCreditoInsert = Database['public']['Tables']['cartoes_credito']['Insert'];
type CartaoCreditoUpdate = Database['public']['Tables']['cartoes_credito']['Update'];

type PatrimonioCategoriaRow = Database['public']['Tables']['patrimonio_categorias']['Row'];
type PatrimonioCategoriaInsert = Database['public']['Tables']['patrimonio_categorias']['Insert'];
type PatrimonioCategoriaUpdate = Database['public']['Tables']['patrimonio_categorias']['Update'];

type PatrimonioRow = Database['public']['Tables']['patrimonios']['Row'];
type PatrimonioInsert = Database['public']['Tables']['patrimonios']['Insert'];
type PatrimonioUpdate = Database['public']['Tables']['patrimonios']['Update'];

type IgrejaRow = Database['public']['Tables']['igrejas']['Row'];
type IgrejaUpdate = Database['public']['Tables']['igrejas']['Update'];

// Igreja
export async function getIgreja(id: string): Promise<IgrejaRow> {
  const { data, error } = await supabase
    .from('igrejas')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data as IgrejaRow;
}

export async function updateIgreja(id: string, igreja: IgrejaUpdate) {
  const { data, error } = await (supabase as any)
    .from('igrejas')
    .update(igreja)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Categorias
export async function getCategorias(igrejaId: string, tipo?: 'receita' | 'despesa') {
  let query = supabase
    .from('categorias')
    .select('*')
    .eq('igreja_id', igrejaId)
    .order('nome');
    
  if (tipo) {
    query = query.eq('tipo', tipo);
  }
  
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function createCategoria(categoria: CategoriaInsert) {
  const { data, error } = await (supabase as any).from('categorias').insert(categoria).select().single();
  if (error) throw error;
  return data;
}

export async function updateCategoria(id: string, categoria: CategoriaUpdate) {
  const { data, error } = await (supabase as any).from('categorias').update(categoria).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteCategoria(id: string) {
  const { error } = await supabase.from('categorias').delete().eq('id', id);
  if (error) throw error;
}

// Subcategorias
export async function getSubcategorias(categoriaId: string) {
  const { data, error } = await supabase
    .from('subcategorias')
    .select('*')
    .eq('categoria_id', categoriaId)
    .order('nome');
  if (error) throw error;
  return data || [];
}

export async function getAllSubcategorias(igrejaId: string): Promise<any[]> {
  const { data, error } = await supabase
    .from('subcategorias')
    .select('*, categorias!inner(igreja_id)')
    .eq('categorias.igreja_id', igrejaId)
    .order('nome');
  if (error) throw error;
  return data || [];
}

export async function createSubcategoria(subcategoria: SubcategoriaInsert) {
  const { data, error } = await (supabase as any).from('subcategorias').insert(subcategoria).select().single();
  if (error) throw error;
  return data;
}

export async function updateSubcategoria(id: string, subcategoria: SubcategoriaUpdate) {
  const { data, error } = await (supabase as any).from('subcategorias').update(subcategoria).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteSubcategoria(id: string) {
  const { error } = await supabase.from('subcategorias').delete().eq('id', id);
  if (error) throw error;
}

// Contas Bancárias
export async function getContas(igrejaId: string) {
  const { data, error } = await supabase
    .from('contas_bancarias')
    .select('*')
    .eq('igreja_id', igrejaId)
    .order('nome_conta');
  if (error) throw error;
  return data || [];
}

export async function createConta(conta: ContaInsert) {
  const { data, error } = await (supabase as any).from('contas_bancarias').insert(conta).select().single();
  if (error) throw error;
  return data;
}

export async function updateConta(id: string, conta: ContaUpdate) {
  const { data, error } = await (supabase as any).from('contas_bancarias').update(conta).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteConta(id: string) {
  const { error } = await supabase.from('contas_bancarias').delete().eq('id', id);
  if (error) throw error;
}

// Cartões de Crédito
export async function getCartoes(igrejaId: string) {
  const { data, error } = await supabase
    .from('cartoes_credito')
    .select('*')
    .eq('igreja_id', igrejaId)
    .order('nome');
  if (error) throw error;
  return data || [];
}

export async function createCartao(cartao: CartaoCreditoInsert) {
  const { data, error } = await (supabase as any).from('cartoes_credito').insert(cartao).select().single();
  if (error) throw error;
  return data;
}

export async function updateCartao(id: string, cartao: CartaoCreditoUpdate) {
  const { data, error } = await (supabase as any).from('cartoes_credito').update(cartao).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteCartao(id: string) {
  const { error } = await supabase.from('cartoes_credito').delete().eq('id', id);
  if (error) throw error;
}

// Receitas
export async function getReceitas(igrejaId: string) {
  const { data, error } = await supabase
    .from('receitas')
    .select('*, contas_bancarias(nome_conta), categorias(nome), subcategorias(nome)')
    .eq('igreja_id', igrejaId)
    .order('data_recebimento', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function createReceita(receita: ReceitaInsert) {
  const { data, error } = await (supabase as any).from('receitas').insert(receita).select().single();
  if (error) throw error;
  return data;
}

export async function updateReceita(id: string, receita: ReceitaUpdate) {
  const { data, error } = await (supabase as any).from('receitas').update(receita).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteReceita(id: string) {
  const { error } = await supabase.from('receitas').delete().eq('id', id);
  if (error) throw error;
}

// Despesas
export async function getDespesas(igrejaId: string): Promise<any[]> {
  const { data, error } = await supabase
    .from('despesas')
    .select('*, contas_bancarias(nome_conta), categorias(nome), subcategorias(nome), cartoes_credito(nome)')
    .eq('igreja_id', igrejaId)
    .order('data_pagamento', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function createDespesa(despesa: DespesaInsert) {
  const { data, error } = await (supabase as any).from('despesas').insert(despesa).select().single();
  if (error) throw error;
  return data;
}

export async function createDespesas(despesas: DespesaInsert[]) {
  const { data, error } = await (supabase as any).from('despesas').insert(despesas).select();
  if (error) throw error;
  return data;
}

export async function updateDespesa(id: string, despesa: DespesaUpdate) {
  const { data, error } = await (supabase as any).from('despesas').update(despesa).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function marcarDespesasComoPagas(ids: string[]) {
  if (!ids || ids.length === 0) return;
  const { error } = await (supabase as any)
    .from('despesas')
    .update({ pago: true })
    .in('id', ids);
  if (error) throw error;
}

export async function updateDespesasEmLote(
  grupoId: string, 
  dataPagamentoReferencia: string, 
  escopo: 'previous' | 'future' | 'all', 
  despesa: DespesaUpdate
) {
  let query = (supabase as any).from('despesas').update(despesa).eq('grupo_id', grupoId);
  
  if (escopo === 'previous') {
    query = query.lte('data_pagamento', dataPagamentoReferencia);
  } else if (escopo === 'future') {
    query = query.gte('data_pagamento', dataPagamentoReferencia);
  }
  
  const { data, error } = await query.select();
  if (error) throw error;
  return data;
}

export async function deleteDespesa(id: string) {
  const { error } = await supabase.from('despesas').delete().eq('id', id);
  if (error) throw error;
}

export async function deleteDespesas(ids: string[]) {
  const { error } = await supabase.from('despesas').delete().in('id', ids);
  if (error) throw error;
}

// Dashboard Stats
export async function getDashboardStats(igrejaId: string) {
  // Get all receitas
  const { data: receitas, error: recError } = await supabase
    .from('receitas')
    .select('valor, recebido')
    .eq('igreja_id', igrejaId);
  if (recError) throw recError;

  // Get all despesas
  const { data: despesas, error: despError } = await supabase
    .from('despesas')
    .select('valor, pago, data_pagamento')
    .eq('igreja_id', igrejaId);
  if (despError) throw despError;

  // Get contas for initial balance
  const { data: contas, error: contasError } = await supabase
    .from('contas_bancarias')
    .select('saldo_inicial')
    .eq('igreja_id', igrejaId);
  if (contasError) throw contasError;

  const totalReceitas = (receitas as any[] || []).reduce((acc, curr) => acc + Number(curr.valor), 0);
  const totalDespesas = (despesas as any[] || []).reduce((acc, curr) => acc + Number(curr.valor), 0);
  const totalReceitasRecebidas = (receitas as any[] || []).filter(r => r.recebido).reduce((acc, curr) => acc + Number(curr.valor), 0);
  const despesasPagas = (despesas as any[] || []).filter(d => d.pago).reduce((acc, curr) => acc + Number(curr.valor), 0);
  
  const today = new Date();
  today.setHours(0,0,0,0);
  const despesasVencidas = (despesas as any[] || []).filter(d => !d.pago && new Date(d.data_pagamento) < today).reduce((acc, curr) => acc + Number(curr.valor), 0);

  const saldoInicial = (contas as any[] || []).reduce((acc, curr) => acc + Number(curr.saldo_inicial || 0), 0);
  
  const saldoPrevisto = saldoInicial + totalReceitas - totalDespesas;
  const saldoTotalReal = saldoInicial + totalReceitasRecebidas - despesasPagas;

  return {
    totalReceitas,
    totalDespesas,
    saldoTotal: saldoPrevisto, // mantendo o nome antigo para retrocompatibilidade se necessário, ou podemos usar o real dependendo da necessidade
    saldoTotalReal,
    despesasPagas,
    despesasVencidas,
  };
}

// Patrimonio Categorias
export async function getPatrimonioCategorias(igrejaId: string): Promise<PatrimonioCategoriaRow[]> {
  const { data, error } = await supabase
    .from('patrimonio_categorias')
    .select('*')
    .eq('igreja_id', igrejaId)
    .order('nome');
  if (error) throw error;
  return data as PatrimonioCategoriaRow[];
}

export async function createPatrimonioCategoria(categoria: PatrimonioCategoriaInsert) {
  const { data, error } = await (supabase as any)
    .from('patrimonio_categorias')
    .insert(categoria)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updatePatrimonioCategoria(id: string, categoria: PatrimonioCategoriaUpdate) {
  const { data, error } = await (supabase as any)
    .from('patrimonio_categorias')
    .update(categoria)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deletePatrimonioCategoria(id: string) {
  const { error } = await supabase
    .from('patrimonio_categorias')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

// Patrimonios
export async function getPatrimonios(igrejaId: string): Promise<any[]> {
  const { data, error } = await supabase
    .from('patrimonios')
    .select(`
      *,
      patrimonio_categorias (
        nome
      )
    `)
    .eq('igreja_id', igrejaId)
    .order('nome');
  if (error) throw error;
  return data;
}

export async function createPatrimonio(patrimonio: PatrimonioInsert) {
  const { data, error } = await (supabase as any)
    .from('patrimonios')
    .insert(patrimonio)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updatePatrimonio(id: string, patrimonio: PatrimonioUpdate) {
  const { data, error } = await (supabase as any)
    .from('patrimonios')
    .update(patrimonio)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deletePatrimonio(id: string) {
  const { error } = await supabase
    .from('patrimonios')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

