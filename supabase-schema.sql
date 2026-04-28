-- Tabela: igrejas
CREATE TABLE igrejas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(150) NOT NULL,
    endereco VARCHAR(255),
    cidade VARCHAR(100),
    bairro VARCHAR(100),
    estado VARCHAR(50),
    cep VARCHAR(20),
    cnpj VARCHAR(20),
    criado_em TIMESTAMP DEFAULT NOW()
);

-- Tabela: usuarios
CREATE TABLE usuarios (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    igreja_id UUID REFERENCES igrejas(id),
    nome VARCHAR(120),
    email VARCHAR(255) UNIQUE,
    criado_em TIMESTAMP DEFAULT NOW()
);

-- Tabela: contas_bancarias
CREATE TABLE contas_bancarias (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    igreja_id UUID REFERENCES igrejas(id),
    nome_conta VARCHAR(120) NOT NULL,
    banco VARCHAR(120),
    saldo_inicial DECIMAL(12,2) DEFAULT 0.00,
    criado_em TIMESTAMP DEFAULT NOW()
);

-- Tabela: categorias
CREATE TABLE categorias (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    igreja_id UUID REFERENCES igrejas(id),
    nome VARCHAR(150) NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    criado_em TIMESTAMP DEFAULT NOW()
);

-- Tabela: subcategorias
CREATE TABLE subcategorias (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    categoria_id UUID REFERENCES categorias(id) ON DELETE CASCADE,
    nome VARCHAR(150) NOT NULL,
    criado_em TIMESTAMP DEFAULT NOW()
);

-- Tabela: cartoes_credito
CREATE TABLE cartoes_credito (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    igreja_id UUID REFERENCES igrejas(id),
    nome VARCHAR(120) NOT NULL,
    bandeira VARCHAR(50),
    limite DECIMAL(12,2) DEFAULT 0.00,
    dia_fechamento INTEGER,
    dia_vencimento INTEGER,
    ativo BOOLEAN DEFAULT true,
    observacoes TEXT,
    criado_em TIMESTAMP DEFAULT NOW()
);

-- Tabela: receitas
CREATE TABLE receitas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    igreja_id UUID REFERENCES igrejas(id),
    conta_id UUID REFERENCES contas_bancarias(id),
    categoria_id UUID REFERENCES categorias(id),
    subcategoria_id UUID REFERENCES subcategorias(id),
    descricao VARCHAR(200),
    valor DECIMAL(12,2) NOT NULL CHECK (valor > 0),
    data_recebimento DATE NOT NULL,
    criado_em TIMESTAMP DEFAULT NOW()
);

-- Tabela: despesas
CREATE TABLE despesas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    igreja_id UUID REFERENCES igrejas(id),
    conta_id UUID REFERENCES contas_bancarias(id),
    categoria_id UUID REFERENCES categorias(id),
    subcategoria_id UUID REFERENCES subcategorias(id),
    cartao_id UUID REFERENCES cartoes_credito(id),
    descricao VARCHAR(200),
    valor DECIMAL(12,2) NOT NULL CHECK (valor > 0),
    data_pagamento DATE NOT NULL,
    pago BOOLEAN DEFAULT true,
    grupo_id UUID,
    criado_em TIMESTAMP DEFAULT NOW()
);

-- RLS (Row Level Security)
ALTER TABLE igrejas ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE contas_bancarias ENABLE ROW LEVEL SECURITY;
ALTER TABLE cartoes_credito ENABLE ROW LEVEL SECURITY;
ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE subcategorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE receitas ENABLE ROW LEVEL SECURITY;
ALTER TABLE despesas ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Usuários podem ver sua própria igreja" ON igrejas
    FOR SELECT USING (id IN (SELECT igreja_id FROM usuarios WHERE id = auth.uid()));

CREATE POLICY "Usuários podem ver usuários da mesma igreja" ON usuarios
    FOR SELECT USING (igreja_id IN (SELECT igreja_id FROM usuarios WHERE id = auth.uid()));

CREATE POLICY "Usuários podem ver contas da sua igreja" ON contas_bancarias
    FOR ALL USING (igreja_id IN (SELECT igreja_id FROM usuarios WHERE id = auth.uid()));

CREATE POLICY "Usuários podem ver cartoes da sua igreja" ON cartoes_credito
    FOR ALL USING (igreja_id IN (SELECT igreja_id FROM usuarios WHERE id = auth.uid()));

CREATE POLICY "Usuários podem ver categorias da sua igreja" ON categorias
    FOR ALL USING (igreja_id IN (SELECT igreja_id FROM usuarios WHERE id = auth.uid()));

CREATE POLICY "Usuários podem ver subcategorias da sua igreja" ON subcategorias
    FOR ALL USING (categoria_id IN (SELECT id FROM categorias WHERE igreja_id IN (SELECT igreja_id FROM usuarios WHERE id = auth.uid())));

CREATE POLICY "Usuários podem ver receitas da sua igreja" ON receitas
    FOR ALL USING (igreja_id IN (SELECT igreja_id FROM usuarios WHERE id = auth.uid()));

CREATE POLICY "Usuários podem ver despesas da sua igreja" ON despesas
    FOR ALL USING (igreja_id IN (SELECT igreja_id FROM usuarios WHERE id = auth.uid()));

-- Functions and Triggers (Optional, for managing user creation)
-- This assumes you create the user in the 'usuarios' table after they sign up in auth.users.
