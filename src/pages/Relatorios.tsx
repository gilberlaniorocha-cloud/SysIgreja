import { useEffect, useState } from 'react';
import { useAuth } from '../lib/auth';
import { getReceitas, getDespesas, getContas, getCategorias, getSubcategorias, getIgreja } from '../lib/queries';
import { Database } from '../types/database';
import { format, parseISO, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { Printer, FileText, Table as TableIcon } from 'lucide-react';

type Conta = Database['public']['Tables']['contas_bancarias']['Row'];
type Categoria = Database['public']['Tables']['categorias']['Row'];
type Subcategoria = Database['public']['Tables']['subcategorias']['Row'];

export default function Relatorios() {
  const { igrejaId } = useAuth();
  const [contas, setContas] = useState<Conta[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [subcategorias, setSubcategorias] = useState<Subcategoria[]>([]);
  const [igreja, setIgreja] = useState<any>(null);
  const [receitas, setReceitas] = useState<any[]>([]);
  const [despesas, setDespesas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [tipoRelatorio, setTipoRelatorio] = useState('geral'); // geral, receitas, despesas
  const [contaId, setContaId] = useState('');
  const [categoriaId, setCategoriaId] = useState('');
  const [subcategoriaId, setSubcategoriaId] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [filtroAno, setFiltroAno] = useState('');
  const [filtroMes, setFiltroMes] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [showPrintWarning, setShowPrintWarning] = useState(false);
  const [saldoAnterior, setSaldoAnterior] = useState(0);

  useEffect(() => {
    if (!igrejaId) return;
    const loadData = async () => {
      try {
        const [contasData, receitasData, despesasData, categoriasData, igrejaData] = await Promise.all([
          getContas(igrejaId),
          getReceitas(igrejaId),
          getDespesas(igrejaId),
          getCategorias(igrejaId),
          getIgreja(igrejaId)
        ]);
        setContas(contasData);
        setReceitas(receitasData);
        setDespesas(despesasData);
        setCategorias(categoriasData);
        setIgreja(igrejaData);
      } catch (error) {
        console.error('Error loading data for reports:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [igrejaId]);

  useEffect(() => {
    if (categoriaId) {
      getSubcategorias(categoriaId).then(setSubcategorias).catch(console.error);
    } else {
      setSubcategorias([]);
      setSubcategoriaId('');
    }
  }, [categoriaId]);

  const filterData = (data: any[], dateField: string) => {
    return data.filter(item => {
      let match = true;
      if (contaId && item.conta_id !== contaId) match = false;
      if (categoriaId && item.categoria_id !== categoriaId) match = false;
      if (subcategoriaId && item.subcategoria_id !== subcategoriaId) match = false;
      
      const itemDate = parseISO(item[dateField]);

      if (filtroAno && itemDate.getFullYear().toString() !== filtroAno) match = false;
      if (filtroMes && (itemDate.getMonth() + 1).toString() !== filtroMes) match = false;

      if (filtroStatus !== 'todos') {
        if (item.hasOwnProperty('pago')) {
          const isPago = filtroStatus === 'pago';
          if (item.pago !== isPago) match = false;
        } else if (filtroStatus === 'pendente') {
          match = false;
        }
      }
      
      if (dataInicio && dataFim) {
        const start = parseISO(dataInicio);
        const end = parseISO(dataFim);
        if (!isWithinInterval(itemDate, { start, end })) {
          match = false;
        }
      }
      return match;
    });
  };

  const anos = Array.from(new Set([
    ...receitas.map(r => parseISO(r.data_recebimento).getFullYear()),
    ...despesas.map(d => parseISO(d.data_pagamento).getFullYear())
  ])).sort((a, b) => b - a);

  const meses = [
    { value: '1', label: 'Janeiro' },
    { value: '2', label: 'Fevereiro' },
    { value: '3', label: 'Março' },
    { value: '4', label: 'Abril' },
    { value: '5', label: 'Maio' },
    { value: '6', label: 'Junho' },
    { value: '7', label: 'Julho' },
    { value: '8', label: 'Agosto' },
    { value: '9', label: 'Setembro' },
    { value: '10', label: 'Outubro' },
    { value: '11', label: 'Novembro' },
    { value: '12', label: 'Dezembro' },
  ];

  const filteredReceitas = filterData(receitas, 'data_recebimento');
  const filteredDespesas = filterData(despesas, 'data_pagamento');

  // Calculate Saldo Anterior for Extrato por Conta
  useEffect(() => {
    if (tipoRelatorio === 'extrato_conta' && contaId && dataInicio) {
      const conta = contas.find(c => c.id === contaId);
      let saldo = conta?.saldo_inicial || 0;

      const start = parseISO(dataInicio);

      receitas.forEach(r => {
        if (r.conta_id === contaId && parseISO(r.data_recebimento) < start) {
          saldo += Number(r.valor);
        }
      });

      despesas.forEach(d => {
        if (d.conta_id === contaId && parseISO(d.data_pagamento) < start) {
          saldo -= Number(d.valor);
        }
      });

      setSaldoAnterior(saldo);
    } else {
      setSaldoAnterior(0);
    }
  }, [tipoRelatorio, contaId, dataInicio, contas, receitas, despesas]);

  const totalReceitas = filteredReceitas.reduce((acc, curr) => acc + Number(curr.valor), 0);
  const totalDespesas = filteredDespesas.reduce((acc, curr) => acc + Number(curr.valor), 0);
  const saldo = totalReceitas - totalDespesas;

  const getBalancoMensal = () => {
    const mesesMap = new Map<string, {
      receitas: { [categoria: string]: number },
      despesas: { [categoria: string]: number },
      totalReceitas: number,
      totalDespesas: number,
      saldo: number
    }>();

    filteredReceitas.forEach(r => {
      const mes = format(parseISO(r.data_recebimento), 'MM/yyyy');
      const cat = r.categorias?.nome || 'Sem Categoria';
      if (!mesesMap.has(mes)) {
        mesesMap.set(mes, { receitas: {}, despesas: {}, totalReceitas: 0, totalDespesas: 0, saldo: 0 });
      }
      const data = mesesMap.get(mes)!;
      data.receitas[cat] = (data.receitas[cat] || 0) + Number(r.valor);
      data.totalReceitas += Number(r.valor);
      data.saldo += Number(r.valor);
    });

    filteredDespesas.forEach(d => {
      const mes = format(parseISO(d.data_pagamento), 'MM/yyyy');
      const cat = d.categorias?.nome || 'Sem Categoria';
      if (!mesesMap.has(mes)) {
        mesesMap.set(mes, { receitas: {}, despesas: {}, totalReceitas: 0, totalDespesas: 0, saldo: 0 });
      }
      const data = mesesMap.get(mes)!;
      data.despesas[cat] = (data.despesas[cat] || 0) + Number(d.valor);
      data.totalDespesas += Number(d.valor);
      data.saldo -= Number(d.valor);
    });

    return Array.from(mesesMap.entries()).sort((a, b) => {
      const [mesA, anoA] = a[0].split('/');
      const [mesB, anoB] = b[0].split('/');
      return new Date(Number(anoA), Number(mesA) - 1).getTime() - new Date(Number(anoB), Number(mesB) - 1).getTime();
    });
  };

  const getDespesasPorSubcategoria = () => {
    const subcategoriasMap = new Map<string, {
      total: number,
      itens: any[]
    }>();

    filteredDespesas.forEach(d => {
      const cat = d.categorias?.nome || 'Sem Categoria';
      const sub = d.subcategorias?.nome || 'Sem Subcategoria';
      const key = `${cat} - ${sub}`;
      
      if (!subcategoriasMap.has(key)) {
        subcategoriasMap.set(key, { total: 0, itens: [] });
      }
      const data = subcategoriasMap.get(key)!;
      data.total += Number(d.valor);
      data.itens.push(d);
    });

    return Array.from(subcategoriasMap.entries()).sort((a, b) => b[1].total - a[1].total);
  };

  const balancoMensal = getBalancoMensal();
  const despesasPorSubcategoria = getDespesasPorSubcategoria();

  const getExtratoConta = () => {
    const itens = [
      ...filteredReceitas.map(r => ({ ...r, tipo: 'receita', data: r.data_recebimento })),
      ...filteredDespesas.map(d => ({ ...d, tipo: 'despesa', data: d.data_pagamento }))
    ].sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());

    let saldoAtual = saldoAnterior;
    return itens.map(item => {
      if (item.tipo === 'receita') {
        saldoAtual += Number(item.valor);
      } else {
        saldoAtual -= Number(item.valor);
      }
      return { ...item, saldoApos: saldoAtual };
    });
  };

  const extratoConta = getExtratoConta();

  const getDespesasAgrupadasParaExtrato = () => {
    const agrupadas = new Map<string, { total: number, itens: any[] }>();
    filteredDespesas.forEach(d => {
      const cat = d.categorias?.nome || 'Sem Categoria';
      if (!agrupadas.has(cat)) {
        agrupadas.set(cat, { total: 0, itens: [] });
      }
      const data = agrupadas.get(cat)!;
      data.total += Number(d.valor);
      data.itens.push(d);
    });
    return Array.from(agrupadas.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  };

  const despesasAgrupadasExtrato = getDespesasAgrupadasParaExtrato();

  const handlePrint = () => {
    window.print();
    // Em iframes (como no preview do editor), o window.print() pode ser bloqueado silenciosamente.
    // Mostramos um aviso para o usuário saber o que fazer.
    setShowPrintWarning(true);
    setTimeout(() => setShowPrintWarning(false), 8000);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    
    // Add church details to header
    let startY = 15;
    if (igreja) {
      doc.setFontSize(16);
      doc.text(igreja.nome || 'Relatório Financeiro', 14, startY);
      doc.setFontSize(10);
      startY += 6;
      if (igreja.cnpj) {
        doc.text(`CNPJ: ${igreja.cnpj}`, 14, startY);
        startY += 5;
      }
      const addressParts = [igreja.endereco, igreja.bairro, igreja.cidade, igreja.estado].filter(Boolean);
      if (addressParts.length > 0) {
        doc.text(addressParts.join(' - '), 14, startY);
        startY += 5;
      }
      startY += 5; // Extra space before report title
    }
    
    doc.setFontSize(14);
    doc.text(`Relatório Financeiro - ${tipoRelatorio.toUpperCase()}`, 14, startY);
    startY += 10;
    
    if (tipoRelatorio === 'balanco_mensal') {
      let y = startY;
      balancoMensal.forEach(([mes, dados]) => {
        if (y > 270) {
          doc.addPage();
          y = 20;
        }
        doc.setFontSize(14);
        doc.text(`Balanço - ${mes}`, 14, y);
        doc.setFontSize(10);
        doc.text(`Saldo: R$ ${dados.saldo.toFixed(2)}`, 140, y);
        y += 10;
        
        const receitasData = Object.entries(dados.receitas).map(([cat, val]) => [cat, `R$ ${val.toFixed(2)}`]);
        if (receitasData.length > 0) {
          autoTable(doc, {
            startY: y,
            head: [['Receitas por Categoria', 'Valor']],
            body: receitasData,
            foot: [['Total Receitas', `R$ ${dados.totalReceitas.toFixed(2)}`]],
            theme: 'grid',
            headStyles: { fillColor: [34, 197, 94] }
          });
          y = (doc as any).lastAutoTable.finalY + 10;
        }

        const despesasData = Object.entries(dados.despesas).map(([cat, val]) => [cat, `R$ ${val.toFixed(2)}`]);
        if (despesasData.length > 0) {
          autoTable(doc, {
            startY: y,
            head: [['Despesas por Categoria', 'Valor']],
            body: despesasData,
            foot: [['Total Despesas', `R$ ${dados.totalDespesas.toFixed(2)}`]],
            theme: 'grid',
            headStyles: { fillColor: [239, 68, 68] }
          });
          y = (doc as any).lastAutoTable.finalY + 15;
        }
      });
    } else if (tipoRelatorio === 'despesas_subcategoria') {
      let y = startY;
      despesasPorSubcategoria.forEach(([subcat, dados]) => {
        if (y > 270) {
          doc.addPage();
          y = 20;
        }
        
        const despesasData = dados.itens.map(d => [
          format(parseISO(d.data_pagamento), "dd/MM/yyyy"),
          d.descricao,
          d.contas_bancarias?.nome_conta || '',
          `R$ ${Number(d.valor).toFixed(2)}`
        ]);

        autoTable(doc, {
          startY: y,
          head: [[`Subcategoria: ${subcat}`, 'Descrição', 'Conta', 'Valor']],
          body: despesasData,
          foot: [['Total', '', '', `R$ ${dados.total.toFixed(2)}`]],
          theme: 'grid',
          headStyles: { fillColor: [239, 68, 68] }
        });
        y = (doc as any).lastAutoTable.finalY + 15;
      });
    } else if (tipoRelatorio === 'extrato_conta') {
      let y = startY;
      doc.setFontSize(12);
      const contaNome = contas.find(c => c.id === contaId)?.nome_conta || 'Todas as Contas';
      doc.text(`Conta: ${contaNome}`, 14, y);
      y += 10;
      doc.text(`Saldo Anterior: R$ ${saldoAnterior.toFixed(2)}`, 14, y);
      y += 10;

      // Receitas Block
      const receitasData = filteredReceitas.map(item => [
        format(parseISO(item.data_recebimento), "dd/MM/yyyy"),
        item.descricao,
        `R$ ${Number(item.valor).toFixed(2)}`
      ]);

      if (receitasData.length > 0) {
        autoTable(doc, {
          startY: y,
          head: [['Data', 'Descrição (Receitas)', 'Valor']],
          body: receitasData,
          foot: [['Total Receitas', '', `R$ ${totalReceitas.toFixed(2)}`]],
          theme: 'grid',
          headStyles: { fillColor: [34, 197, 94] }
        });
        y = (doc as any).lastAutoTable.finalY + 10;
      }

      // Despesas Block
      const despesasData = filteredDespesas.map(item => [
        format(parseISO(item.data_pagamento), "dd/MM/yyyy"),
        item.descricao,
        `R$ ${Number(item.valor).toFixed(2)}`
      ]);

      if (despesasData.length > 0) {
        autoTable(doc, {
          startY: y,
          head: [['Data', 'Descrição (Despesas)', 'Valor']],
          body: despesasData,
          foot: [['Total Despesas', '', `R$ ${totalDespesas.toFixed(2)}`]],
          theme: 'grid',
          headStyles: { fillColor: [239, 68, 68] }
        });
        y = (doc as any).lastAutoTable.finalY + 10;
      }

      // Summary Block
      if (y > 250) {
        doc.addPage();
        y = 20;
      }
      doc.setFontSize(14);
      doc.text('Resumo Final', 14, y);
      y += 10;
      doc.setFontSize(11);
      doc.text(`Total Receitas: R$ ${totalReceitas.toFixed(2)}`, 14, y);
      y += 7;
      doc.text(`Total Despesas: R$ ${totalDespesas.toFixed(2)}`, 14, y);
      y += 7;
      doc.setFontSize(12);
      doc.text(`Saldo do Período: R$ ${(totalReceitas - totalDespesas).toFixed(2)}`, 14, y);
      y += 7;
      doc.text(`Saldo Final (com Anterior): R$ ${(saldoAnterior + totalReceitas - totalDespesas).toFixed(2)}`, 14, y);
    } else {
      const tableData: any[] = [];
      if (tipoRelatorio !== 'despesas') {
        filteredReceitas.forEach(r => {
          tableData.push([
            format(parseISO(r.data_recebimento), "dd/MM/yyyy"),
            'Receita',
            r.descricao,
            r.contas_bancarias?.nome_conta || '',
            `R$ ${Number(r.valor).toFixed(2)}`
          ]);
        });
      }
      if (tipoRelatorio !== 'receitas') {
        filteredDespesas.forEach(d => {
          tableData.push([
            format(parseISO(d.data_pagamento), "dd/MM/yyyy"),
            'Despesa',
            d.descricao,
            d.contas_bancarias?.nome_conta || '',
            `R$ ${Number(d.valor).toFixed(2)}`
          ]);
        });
      }

      autoTable(doc, {
        startY: 25,
        head: [['Data', 'Tipo', 'Descrição', 'Conta', 'Valor']],
        body: tableData,
        theme: 'striped'
      });
    }
    
    doc.save(`relatorio_${tipoRelatorio}_${format(new Date(), 'yyyyMMdd')}.pdf`);
  };

  const handleExportExcel = () => {
    let wb = XLSX.utils.book_new();
    
    if (tipoRelatorio === 'balanco_mensal') {
      const wsData: any[] = [];
      balancoMensal.forEach(([mes, dados]) => {
        wsData.push([`Balanço - ${mes}`, '', '']);
        wsData.push(['Tipo', 'Categoria', 'Valor']);
        Object.entries(dados.receitas).forEach(([cat, val]) => {
          wsData.push(['Receita', cat, val]);
        });
        wsData.push(['Total Receitas', '', dados.totalReceitas]);
        Object.entries(dados.despesas).forEach(([cat, val]) => {
          wsData.push(['Despesa', cat, val]);
        });
        wsData.push(['Total Despesas', '', dados.totalDespesas]);
        wsData.push(['Saldo', '', dados.saldo]);
        wsData.push(['', '', '']);
      });
      const ws = XLSX.utils.aoa_to_sheet(wsData);
      XLSX.utils.book_append_sheet(wb, ws, 'Balanço Mensal');
    } else if (tipoRelatorio === 'despesas_subcategoria') {
      const wsData: any[] = [];
      despesasPorSubcategoria.forEach(([subcat, dados]) => {
        wsData.push([`Subcategoria: ${subcat}`, '', '', '']);
        wsData.push(['Data', 'Descrição', 'Conta', 'Valor']);
        dados.itens.forEach(d => {
          wsData.push([
            format(parseISO(d.data_pagamento), "dd/MM/yyyy"),
            d.descricao,
            d.contas_bancarias?.nome_conta || '',
            Number(d.valor)
          ]);
        });
        wsData.push(['Total', '', '', dados.total]);
        wsData.push(['', '', '', '']);
      });
      const ws = XLSX.utils.aoa_to_sheet(wsData);
      XLSX.utils.book_append_sheet(wb, ws, 'Despesas por Subcategoria');
    } else if (tipoRelatorio === 'extrato_conta') {
      const contaNome = contas.find(c => c.id === contaId)?.nome_conta || 'Todas as Contas';
      const wsData: any[] = [
        [`Conta: ${contaNome}`, '', ''],
        [`Saldo Anterior: R$ ${saldoAnterior.toFixed(2)}`, '', ''],
        ['', '', ''],
        ['RECEITAS', '', ''],
        ['Data', 'Descrição', 'Valor']
      ];
      
      filteredReceitas.forEach(item => {
        wsData.push([
          format(parseISO(item.data_recebimento), "dd/MM/yyyy"),
          item.descricao,
          Number(item.valor)
        ]);
      });
      wsData.push(['Total Receitas', '', totalReceitas]);
      wsData.push(['', '', '']);
      
      wsData.push(['DESPESAS', '', '']);
      wsData.push(['Data', 'Descrição', 'Valor']);
      filteredDespesas.forEach(item => {
        wsData.push([
          format(parseISO(item.data_pagamento), "dd/MM/yyyy"),
          item.descricao,
          Number(item.valor)
        ]);
      });
      wsData.push(['Total Despesas', '', totalDespesas]);
      wsData.push(['', '', '']);
      
      wsData.push(['RESUMO FINAL', '', '']);
      wsData.push(['Total Receitas', '', totalReceitas]);
      wsData.push(['Total Despesas', '', totalDespesas]);
      wsData.push(['Saldo do Período', '', totalReceitas - totalDespesas]);
      wsData.push(['Saldo Final (com Anterior)', '', saldoAnterior + totalReceitas - totalDespesas]);

      const ws = XLSX.utils.aoa_to_sheet(wsData);
      XLSX.utils.book_append_sheet(wb, ws, 'Extrato por Conta');
    } else {
      const wsData: any[] = [['Data', 'Tipo', 'Descrição', 'Conta', 'Valor']];
      if (tipoRelatorio !== 'despesas') {
        filteredReceitas.forEach(r => {
          wsData.push([
            format(parseISO(r.data_recebimento), "dd/MM/yyyy"),
            'Receita',
            r.descricao,
            r.contas_bancarias?.nome_conta || '',
            Number(r.valor)
          ]);
        });
      }
      if (tipoRelatorio !== 'receitas') {
        filteredDespesas.forEach(d => {
          wsData.push([
            format(parseISO(d.data_pagamento), "dd/MM/yyyy"),
            'Despesa',
            d.descricao,
            d.contas_bancarias?.nome_conta || '',
            Number(d.valor)
          ]);
        });
      }
      const ws = XLSX.utils.aoa_to_sheet(wsData);
      XLSX.utils.book_append_sheet(wb, ws, 'Lançamentos');
    }
    
    XLSX.writeFile(wb, `relatorio_${tipoRelatorio}_${format(new Date(), 'yyyyMMdd')}.xlsx`);
  };

  if (loading) return <div>Carregando relatórios...</div>;

  return (
    <div className="space-y-6 print:space-y-4 print:block">
      {/* Print Header - Only visible when printing */}
      <div className="hidden print:block mb-8 text-center border-b-2 border-gray-800 pb-4">
        {igreja && (
          <>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{igreja.nome}</h1>
            {igreja.cnpj && <p className="text-gray-600">CNPJ: {igreja.cnpj}</p>}
            <p className="text-gray-600">
              {[igreja.endereco, igreja.bairro, igreja.cidade, igreja.estado].filter(Boolean).join(' - ')}
            </p>
          </>
        )}
        <h2 className="text-xl font-semibold text-gray-800 mt-4 uppercase">
          Relatório Financeiro - {tipoRelatorio === 'balanco_mensal' ? 'Balanço Mensal' : tipoRelatorio}
        </h2>
        {(dataInicio || dataFim) && (
          <p className="text-gray-600 mt-2">
            Período: {dataInicio ? format(parseISO(dataInicio), "dd/MM/yyyy") : 'Início'} até {dataFim ? format(parseISO(dataFim), "dd/MM/yyyy") : 'Hoje'}
          </p>
        )}
      </div>

      <div className="flex justify-between items-center print:hidden">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight print:text-xl">Relatórios Financeiros</h1>
        <div className="flex space-x-3 print:hidden">
          <button
            onClick={handlePrint}
            className="inline-flex items-center px-4 py-2 border border-gray-200 shadow-sm text-sm font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all"
          >
            <Printer className="h-4 w-4 mr-2 text-gray-400" />
            Imprimir
          </button>
          <button
            onClick={handleExportPDF}
            className="inline-flex items-center px-4 py-2 border border-gray-200 shadow-sm text-sm font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all"
          >
            <FileText className="h-4 w-4 mr-2 text-gray-400" />
            PDF
          </button>
          <button
            onClick={handleExportExcel}
            className="inline-flex items-center px-4 py-2 border border-gray-200 shadow-sm text-sm font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all"
          >
            <TableIcon className="h-4 w-4 mr-2 text-gray-400" />
            Excel
          </button>
        </div>
      </div>

      {showPrintWarning && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 print:hidden">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                Se a janela de impressão não abriu, é porque o aplicativo está sendo visualizado dentro do painel de edição. 
                Para imprimir, clique no ícone de <strong>abrir em nova guia</strong> no canto superior direito da tela, ou utilize a opção <strong>PDF</strong>.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-5 print:hidden">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Tipo de Relatório</label>
            <select
              value={tipoRelatorio}
              onChange={(e) => {
                setTipoRelatorio(e.target.value);
                setCategoriaId('');
                setSubcategoriaId('');
              }}
              className="mt-1 block w-full rounded-xl border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2.5 transition-shadow"
            >
              <option value="geral">Geral (Receitas e Despesas)</option>
              <option value="receitas">Apenas Receitas</option>
              <option value="despesas">Apenas Despesas</option>
              <option value="balanco_mensal">Balanço Mensal por Categoria</option>
              <option value="despesas_subcategoria">Despesas por Subcategoria</option>
              <option value="extrato_conta">Extrato por Conta</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Conta Bancária</label>
            <select
              value={contaId}
              onChange={(e) => setContaId(e.target.value)}
              className="mt-1 block w-full rounded-xl border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2.5 transition-shadow"
            >
              <option value="">Todas as contas</option>
              {contas.map(c => (
                <option key={c.id} value={c.id}>{c.nome_conta}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Data Início</label>
            <input
              type="date"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
              className="mt-1 block w-full rounded-xl border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2.5 transition-shadow"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Data Fim</label>
            <input
              type="date"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
              className="mt-1 block w-full rounded-xl border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2.5 transition-shadow"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Ano</label>
            <select
              value={filtroAno}
              onChange={(e) => setFiltroAno(e.target.value)}
              className="mt-1 block w-full rounded-xl border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2.5 transition-shadow"
            >
              <option value="">Todos os anos</option>
              {anos.map(ano => (
                <option key={ano} value={ano.toString()}>{ano}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Mês</label>
            <select
              value={filtroMes}
              onChange={(e) => setFiltroMes(e.target.value)}
              className="mt-1 block w-full rounded-xl border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2.5 transition-shadow"
            >
              <option value="">Todos os meses</option>
              {meses.map(mes => (
                <option key={mes.value} value={mes.value}>{mes.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Status do Pagamento</label>
            <select
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
              className="mt-1 block w-full rounded-xl border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2.5 transition-shadow"
            >
              <option value="todos">Todos</option>
              <option value="pago">Pago / Recebido</option>
              <option value="pendente">Pendente</option>
            </select>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Categoria</label>
            <select
              value={categoriaId}
              onChange={(e) => {
                setCategoriaId(e.target.value);
                setSubcategoriaId('');
              }}
              className="mt-1 block w-full rounded-xl border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2.5 transition-shadow"
            >
              <option value="">Todas as categorias</option>
              {categorias
                .filter(c => {
                  if (tipoRelatorio === 'receitas') return c.tipo === 'receita';
                  if (tipoRelatorio === 'despesas') return c.tipo === 'despesa';
                  return true;
                })
                .map(c => (
                <option key={c.id} value={c.id}>{c.nome} ({c.tipo === 'receita' ? 'Receita' : 'Despesa'})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Subcategoria</label>
            <select
              value={subcategoriaId}
              onChange={(e) => setSubcategoriaId(e.target.value)}
              disabled={!categoriaId || subcategorias.length === 0}
              className="mt-1 block w-full rounded-xl border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2.5 disabled:bg-gray-50 disabled:text-gray-400 transition-shadow"
            >
              <option value="">Todas as subcategorias</option>
              {subcategorias.map(s => (
                <option key={s.id} value={s.id}>{s.nome}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {tipoRelatorio === 'extrato_conta' && (
          <div className="bg-gray-50 p-5 rounded-2xl border-l-4 border-gray-400 shadow-sm">
            <h3 className="text-gray-600 text-sm font-medium mb-1">Saldo Anterior</h3>
            <p className="text-3xl font-bold text-gray-900">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(saldoAnterior)}
            </p>
          </div>
        )}
        {(tipoRelatorio === 'geral' || tipoRelatorio === 'receitas' || tipoRelatorio === 'extrato_conta') && (
          <div className="bg-emerald-50 p-5 rounded-2xl border-l-4 border-emerald-500 shadow-sm">
            <h3 className="text-emerald-800 text-sm font-medium mb-1">Total Receitas</h3>
            <p className="text-3xl font-bold text-emerald-700">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalReceitas)}
            </p>
          </div>
        )}
        {(tipoRelatorio === 'geral' || tipoRelatorio === 'despesas' || tipoRelatorio === 'despesas_subcategoria' || tipoRelatorio === 'extrato_conta') && (
          <div className="bg-rose-50 p-5 rounded-2xl border-l-4 border-rose-500 shadow-sm">
            <h3 className="text-rose-800 text-sm font-medium mb-1">Total Despesas</h3>
            <p className="text-3xl font-bold text-rose-700">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalDespesas)}
            </p>
          </div>
        )}
        {(tipoRelatorio === 'geral' || tipoRelatorio === 'extrato_conta') && (
          <div className="bg-indigo-50 p-5 rounded-2xl border-l-4 border-indigo-500 shadow-sm">
            <h3 className="text-indigo-800 text-sm font-medium mb-1">{tipoRelatorio === 'extrato_conta' ? 'Saldo Atual' : 'Saldo do Período'}</h3>
            <p className="text-3xl font-bold text-indigo-700">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(tipoRelatorio === 'extrato_conta' ? saldoAnterior + saldo : saldo)}
            </p>
          </div>
        )}
      </div>

      {/* Results Table */}
      {tipoRelatorio === 'balanco_mensal' ? (
        <div className="space-y-6">
          {balancoMensal.map(([mes, dados]) => (
            <div key={mes} className="bg-white shadow-sm border border-gray-100 overflow-hidden sm:rounded-2xl">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">Balanço - {mes}</h3>
                <div className="text-sm font-medium">
                  Saldo: <span className={dados.saldo >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(dados.saldo)}
                  </span>
                </div>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-semibold text-emerald-700 uppercase tracking-wider mb-3 border-b border-gray-100 pb-2">Receitas por Categoria</h4>
                  <ul className="space-y-2">
                    {Object.entries(dados.receitas).map(([cat, val]) => (
                      <li key={cat} className="flex justify-between text-sm">
                        <span className="text-gray-600">{cat}</span>
                        <span className="font-medium text-gray-900">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)}</span>
                      </li>
                    ))}
                    {Object.keys(dados.receitas).length === 0 && (
                      <li className="text-sm text-gray-500 italic">Nenhuma receita no período</li>
                    )}
                  </ul>
                  <div className="mt-4 pt-2 border-t border-gray-100 flex justify-between font-semibold text-sm">
                    <span className="text-gray-900">Total Receitas</span>
                    <span className="text-emerald-600">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(dados.totalReceitas)}</span>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-rose-700 uppercase tracking-wider mb-3 border-b border-gray-100 pb-2">Despesas por Categoria</h4>
                  <ul className="space-y-2">
                    {Object.entries(dados.despesas).map(([cat, val]) => (
                      <li key={cat} className="flex justify-between text-sm">
                        <span className="text-gray-600">{cat}</span>
                        <span className="font-medium text-gray-900">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)}</span>
                      </li>
                    ))}
                    {Object.keys(dados.despesas).length === 0 && (
                      <li className="text-sm text-gray-500 italic">Nenhuma despesa no período</li>
                    )}
                  </ul>
                  <div className="mt-4 pt-2 border-t border-gray-100 flex justify-between font-semibold text-sm">
                    <span className="text-gray-900">Total Despesas</span>
                    <span className="text-rose-600">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(dados.totalDespesas)}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {balancoMensal.length === 0 && (
            <div className="bg-white shadow-sm border border-gray-100 sm:rounded-2xl p-8 text-center text-gray-500">
              Nenhum registro encontrado para os filtros selecionados.
            </div>
          )}
        </div>
      ) : tipoRelatorio === 'despesas_subcategoria' ? (
        <div className="space-y-6">
          {despesasPorSubcategoria.map(([subcat, dados]) => (
            <div key={subcat} className="bg-white shadow-sm border border-gray-100 overflow-hidden sm:rounded-2xl">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">{subcat}</h3>
                <div className="text-sm font-medium">
                  Total: <span className="text-rose-600">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(dados.total)}
                  </span>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-100">
                  <thead className="bg-gray-50/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descrição</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Conta</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {dados.itens.map((d, i) => (
                      <tr key={i} className="hover:bg-gray-50/80 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {format(parseISO(d.data_pagamento), "dd/MM/yyyy")}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {d.descricao}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {d.contas_bancarias?.nome_conta || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(d.valor)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
          {despesasPorSubcategoria.length === 0 && (
            <div className="bg-white shadow-sm border border-gray-100 sm:rounded-2xl p-8 text-center text-gray-500">
              Nenhum registro encontrado para os filtros selecionados.
            </div>
          )}
        </div>
      ) : tipoRelatorio === 'extrato_conta' ? (
        <div className="space-y-6">
          {/* Receitas Block */}
          <div className="bg-white shadow-sm border border-gray-100 overflow-hidden sm:rounded-2xl">
            <div className="px-6 py-4 border-b border-gray-100 bg-emerald-50/50 flex justify-between items-center">
              <h3 className="text-lg font-medium text-emerald-900 font-bold uppercase tracking-wider">Receitas do Período</h3>
              <div className="text-sm font-medium text-emerald-700">
                Total: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalReceitas)}
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descrição</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {filteredReceitas.map((item, i) => (
                    <tr key={i} className="hover:bg-gray-50/80 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {format(parseISO(item.data_recebimento), "dd/MM/yyyy", { locale: ptBR })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.descricao}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-emerald-600 font-medium">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.valor)}
                      </td>
                    </tr>
                  ))}
                  {filteredReceitas.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-6 py-8 text-center text-sm text-gray-500">Nenhuma receita encontrada.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Despesas Block */}
          <div className="bg-white shadow-sm border border-gray-100 overflow-hidden sm:rounded-2xl">
            <div className="px-6 py-4 border-b border-gray-100 bg-rose-50/50 flex justify-between items-center">
              <h3 className="text-lg font-medium text-rose-900 font-bold uppercase tracking-wider">Despesas do Período</h3>
              <div className="text-sm font-medium text-rose-700">
                Total: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalDespesas)}
              </div>
            </div>
            <div className="overflow-x-auto">
              {despesasAgrupadasExtrato.length === 0 ? (
                <div className="px-6 py-8 text-center text-sm text-gray-500">Nenhuma despesa encontrada.</div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {despesasAgrupadasExtrato.map(([categoria, dados]) => (
                    <div key={categoria} className="mb-4 last:mb-0">
                      <div className="bg-gray-50/30 px-6 py-2 border-b border-gray-100 flex justify-between items-center text-sm font-medium text-gray-700">
                        <span>{categoria}</span>
                        <span className="text-rose-600">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(dados.total)}</span>
                      </div>
                      <table className="min-w-full divide-y divide-gray-100">
                        <thead className="bg-gray-50/50 hidden md:table-header-group">
                          <tr>
                            <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                            <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descrição</th>
                            <th className="px-6 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-50">
                          {dados.itens.map((item, i) => (
                            <tr key={i} className="hover:bg-gray-50/80 transition-colors">
                              <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900">
                                {format(parseISO(item.data_pagamento), "dd/MM/yyyy", { locale: ptBR })}
                              </td>
                              <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900">{item.descricao}</td>
                              <td className="px-6 py-3 whitespace-nowrap text-sm text-right text-rose-600 font-medium">
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.valor)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Final Summary Block */}
          <div className="bg-white shadow-sm border border-gray-100 overflow-hidden sm:rounded-2xl p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4 border-b border-gray-100 pb-2">Resumo Final</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Receitas:</span>
                <span className="text-lg font-semibold text-emerald-600">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalReceitas)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Despesas:</span>
                <span className="text-lg font-semibold text-rose-600">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalDespesas)}
                </span>
              </div>
              <div className="flex justify-between items-center pt-3 border-t border-gray-100 mt-2">
                <span className="text-gray-900 font-bold">Saldo do Período:</span>
                <span className={`text-xl font-bold ${totalReceitas - totalDespesas >= 0 ? 'text-indigo-600' : 'text-rose-600'}`}>
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalReceitas - totalDespesas)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-900 font-bold">Saldo Final (com Anterior):</span>
                <span className={`text-xl font-bold ${saldoAnterior + totalReceitas - totalDespesas >= 0 ? 'text-indigo-600' : 'text-rose-600'}`}>
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(saldoAnterior + totalReceitas - totalDespesas)}
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white shadow-sm border border-gray-100 overflow-hidden sm:rounded-2xl">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descrição</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Conta</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {tipoRelatorio !== 'despesas' && filteredReceitas.map((r) => (
                <tr key={`rec-${r.id}`} className="hover:bg-gray-50/80 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {format(parseISO(r.data_recebimento), "dd/MM/yyyy", { locale: ptBR })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-emerald-600 font-medium">Receita</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{r.descricao}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{r.contas_bancarias?.nome_conta}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(r.valor)}
                  </td>
                </tr>
              ))}
              {tipoRelatorio !== 'receitas' && filteredDespesas.map((d) => (
                <tr key={`desp-${d.id}`} className="hover:bg-gray-50/80 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {format(parseISO(d.data_pagamento), "dd/MM/yyyy", { locale: ptBR })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-rose-600 font-medium">Despesa</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{d.descricao}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{d.contas_bancarias?.nome_conta}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(d.valor)}
                  </td>
                </tr>
              ))}
              {((tipoRelatorio !== 'despesas' && filteredReceitas.length === 0) && 
                (tipoRelatorio !== 'receitas' && filteredDespesas.length === 0)) && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-500">
                    Nenhum registro encontrado para os filtros selecionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
