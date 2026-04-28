-- Tabela: patrimonio_categorias
CREATE TABLE patrimonio_categorias (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    igreja_id UUID REFERENCES igrejas(id),
    nome VARCHAR(150) NOT NULL,
    criado_em TIMESTAMP DEFAULT NOW()
);

-- Tabela: patrimonios
CREATE TABLE patrimonios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    igreja_id UUID REFERENCES igrejas(id),
    categoria_id UUID REFERENCES patrimonio_categorias(id),
    nome VARCHAR(200) NOT NULL,
    forma_aquisicao VARCHAR(50), -- Compra, Doação, Transferência
    localizacao VARCHAR(200),
    responsavel VARCHAR(150),
    data_aquisicao DATE,
    valor DECIMAL(12,2),
    condicao VARCHAR(50), -- Novo, Bom, Regular, Precisa manutenção, Inutilizado
    marca VARCHAR(100),
    modelo VARCHAR(100),
    numero_serie VARCHAR(100),
    foto_url TEXT,
    observacoes TEXT,
    criado_em TIMESTAMP DEFAULT NOW()
);

-- RLS (Row Level Security)
ALTER TABLE patrimonio_categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE patrimonios ENABLE ROW LEVEL SECURITY;

-- Políticas de Segurança
CREATE POLICY "Acesso total as categorias de patrimonio da propria igreja" ON patrimonio_categorias
    FOR ALL USING (igreja_id IN (SELECT igreja_id FROM usuarios WHERE id = auth.uid()));

CREATE POLICY "Acesso total aos patrimonios da propria igreja" ON patrimonios
    FOR ALL USING (igreja_id IN (SELECT igreja_id FROM usuarios WHERE id = auth.uid()));
