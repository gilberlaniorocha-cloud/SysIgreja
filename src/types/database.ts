export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      igrejas: {
        Row: {
          id: string
          nome: string
          endereco: string | null
          cidade: string | null
          bairro: string | null
          estado: string | null
          cep: string | null
          cnpj: string | null
          criado_em: string | null
        }
        Insert: {
          id?: string
          nome: string
          endereco?: string | null
          cidade?: string | null
          bairro?: string | null
          estado?: string | null
          cep?: string | null
          cnpj?: string | null
          criado_em?: string | null
        }
        Update: {
          id?: string
          nome?: string
          endereco?: string | null
          cidade?: string | null
          bairro?: string | null
          estado?: string | null
          cep?: string | null
          cnpj?: string | null
          criado_em?: string | null
        }
      }
      usuarios: {
        Row: {
          id: string
          igreja_id: string | null
          nome: string | null
          email: string | null
          criado_em: string | null
        }
        Insert: {
          id: string
          igreja_id?: string | null
          nome?: string | null
          email?: string | null
          criado_em?: string | null
        }
        Update: {
          id?: string
          igreja_id?: string | null
          nome?: string | null
          email?: string | null
          criado_em?: string | null
        }
      }
      contas_bancarias: {
        Row: {
          id: string
          igreja_id: string | null
          nome_conta: string
          banco: string | null
          saldo_inicial: number | null
          criado_em: string | null
        }
        Insert: {
          id?: string
          igreja_id?: string | null
          nome_conta: string
          banco?: string | null
          saldo_inicial?: number | null
          criado_em?: string | null
        }
        Update: {
          id?: string
          igreja_id?: string | null
          nome_conta?: string
          banco?: string | null
          saldo_inicial?: number | null
          criado_em?: string | null
        }
      }
      cartoes_credito: {
        Row: {
          id: string
          igreja_id: string | null
          nome: string
          bandeira: string | null
          limite: number | null
          dia_fechamento: number | null
          dia_vencimento: number | null
          ativo: boolean | null
          observacoes: string | null
          criado_em: string | null
        }
        Insert: {
          id?: string
          igreja_id?: string | null
          nome: string
          bandeira?: string | null
          limite?: number | null
          dia_fechamento?: number | null
          dia_vencimento?: number | null
          ativo?: boolean | null
          observacoes?: string | null
          criado_em?: string | null
        }
        Update: {
          id?: string
          igreja_id?: string | null
          nome?: string
          bandeira?: string | null
          limite?: number | null
          dia_fechamento?: number | null
          dia_vencimento?: number | null
          ativo?: boolean | null
          observacoes?: string | null
          criado_em?: string | null
        }
      }
      categorias: {
        Row: {
          id: string
          igreja_id: string | null
          nome: string
          tipo: string
          criado_em: string | null
        }
        Insert: {
          id?: string
          igreja_id?: string | null
          nome: string
          tipo: string
          criado_em?: string | null
        }
        Update: {
          id?: string
          igreja_id?: string | null
          nome?: string
          tipo?: string
          criado_em?: string | null
        }
      }
      subcategorias: {
        Row: {
          id: string
          categoria_id: string | null
          nome: string
          criado_em: string | null
        }
        Insert: {
          id?: string
          categoria_id?: string | null
          nome: string
          criado_em?: string | null
        }
        Update: {
          id?: string
          categoria_id?: string | null
          nome?: string
          criado_em?: string | null
        }
      }
      patrimonio_categorias: {
        Row: {
          id: string
          igreja_id: string | null
          nome: string
          criado_em: string | null
        }
        Insert: {
          id?: string
          igreja_id?: string | null
          nome: string
          criado_em?: string | null
        }
        Update: {
          id?: string
          igreja_id?: string | null
          nome?: string
          criado_em?: string | null
        }
        Relationships: []
      }
      patrimonios: {
        Row: {
          id: string
          igreja_id: string | null
          categoria_id: string | null
          nome: string
          forma_aquisicao: string | null
          localizacao: string | null
          responsavel: string | null
          data_aquisicao: string | null
          valor: number | null
          condicao: string | null
          marca: string | null
          modelo: string | null
          numero_serie: string | null
          foto_url: string | null
          observacoes: string | null
          criado_em: string | null
        }
        Insert: {
          id?: string
          igreja_id?: string | null
          categoria_id?: string | null
          nome: string
          forma_aquisicao?: string | null
          localizacao?: string | null
          responsavel?: string | null
          data_aquisicao?: string | null
          valor?: number | null
          condicao?: string | null
          marca?: string | null
          modelo?: string | null
          numero_serie?: string | null
          foto_url?: string | null
          observacoes?: string | null
          criado_em?: string | null
        }
        Update: {
          id?: string
          igreja_id?: string | null
          categoria_id?: string | null
          nome?: string
          forma_aquisicao?: string | null
          localizacao?: string | null
          responsavel?: string | null
          data_aquisicao?: string | null
          valor?: number | null
          condicao?: string | null
          marca?: string | null
          modelo?: string | null
          numero_serie?: string | null
          foto_url?: string | null
          observacoes?: string | null
          criado_em?: string | null
        }
        Relationships: []
      }
      receitas: {
        Row: {
          id: string
          igreja_id: string | null
          conta_id: string | null
          categoria_id: string | null
          subcategoria_id: string | null
          descricao: string | null
          valor: number
          data_recebimento: string
          recebido: boolean | null
          criado_em: string | null
        }
        Insert: {
          id?: string
          igreja_id?: string | null
          conta_id?: string | null
          categoria_id?: string | null
          subcategoria_id?: string | null
          descricao?: string | null
          valor: number
          data_recebimento: string
          recebido?: boolean | null
          criado_em?: string | null
        }
        Update: {
          id?: string
          igreja_id?: string | null
          conta_id?: string | null
          categoria_id?: string | null
          subcategoria_id?: string | null
          descricao?: string | null
          valor?: number
          data_recebimento?: string
          recebido?: boolean | null
          criado_em?: string | null
        }
      }
      despesas: {
        Row: {
          id: string
          igreja_id: string | null
          conta_id: string | null
          categoria_id: string | null
          subcategoria_id: string | null
          cartao_id: string | null
          descricao: string | null
          valor: number
          data_pagamento: string
          pago: boolean | null
          grupo_id: string | null
          criado_em: string | null
        }
        Insert: {
          id?: string
          igreja_id?: string | null
          conta_id?: string | null
          categoria_id?: string | null
          subcategoria_id?: string | null
          cartao_id?: string | null
          descricao?: string | null
          valor: number
          data_pagamento: string
          pago?: boolean | null
          grupo_id?: string | null
          criado_em?: string | null
        }
        Update: {
          id?: string
          igreja_id?: string | null
          conta_id?: string | null
          categoria_id?: string | null
          subcategoria_id?: string | null
          cartao_id?: string | null
          descricao?: string | null
          valor?: number
          data_pagamento?: string
          pago?: boolean | null
          grupo_id?: string | null
          criado_em?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
