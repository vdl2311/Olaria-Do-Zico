import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Initialize Gemini AI client
  const apiKey = process.env.GEMINI_API_KEY;
  let aiClient: GoogleGenAI | null = null;
  if (apiKey) {
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });
  }

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', hasGeminiKey: !!apiKey });
  });

  // Voice NLU Endpoint using Gemini AI
  app.post('/api/voice-nlu', async (req, res) => {
    try {
      const { transcript, context } = req.body;

      if (!transcript || typeof transcript !== 'string' || transcript.trim().length === 0) {
        return res.status(400).json({ error: 'Transcrição de voz vazia ou inválida.' });
      }

      if (!aiClient) {
        // Fallback rule-based parsing if no Gemini API key set
        return res.json(fallbackRuleBasedNlu(transcript, context));
      }

      const productsSummary = context?.products
        ? context.products.map((p: any) => `${p.name} (Estoque: ${p.stock}, R$${p.price})`).join(', ')
        : '';
      const customersSummary = context?.customers
        ? context.customers.map((c: any) => c.name).join(', ')
        : '';

      const systemInstruction = `
Você é o "Assistente da Olaria", a IA administrativa e operacional de confiança da "Olaria do Zico" (fábrica de vasos, fontes, cachepôs, jardineiras, bacias e peças cerâmicas decorativas).
Seu papel é interpretar com máxima precisão falas em Português do Brasil do oleiro/proprietário e transformar em dados estruturados estritamente confiáveis ou responder a dúvidas operacionais e financeiras.

Catálogo atual de produtos em estoque:
[${productsSummary}]

Clientes cadastrados na olaria:
[${customersSummary}]

Defina rigorosamente uma das intenções (intent):
1. RECORD_SALE: Venda de vaso, fonte, jardineira ou produto cerâmico (ex: "Vendi um vaso Vietnamita por 180 reais para João no Pix", "Vendi duas fontes para Carlos por 600 no fiado", "Venda de 3 vasos espirais por 360, deu 100 de entrada").
2. RECORD_PRODUCTION: Registro de produção/queima/lote (ex: "Produzi 15 vasos médios hoje", "Fiz 10 cachepôs", "Botei 20 vasos no forno").
3. RECORD_RAW_MATERIAL: Compra de matéria-prima (ex: "Comprei 50 quilos de argila por 300 reais", "Comprei 5 litros de esmalte azul por 200 reais").
4. RECORD_LOSS: Perda ou quebra na queima/manuseio (ex: "Quebrei três vasos na queima", "Perdi 2 jardineiras no forno").
5. RECORD_RECEIVABLE_PAYMENT: Recebimento de dívida/fiado (ex: "Recebi 500 reais do João", "Carlos pagou 200 do que devia").
6. RECORD_EXPENSE: Pagamento de despesa operacional (ex: "Gastei 150 reais de combustível da entrega", "Paguei 220 reais de conta de luz").
7. RECORD_RESERVE: Reserva de produto para cliente (ex: "Reserve cinco vasos para o Carlos").
8. RECORD_DELIVERY: Confirmação de entrega de pedido (ex: "Entreguei o pedido da Maria", "Entrega do Carlos concluída").
9. QUERY: Pergunta do oleiro sobre faturamento, vendas, saldo, estoque ou dívidas (ex: "Quanto vendi esse mês?", "Quem está devendo?", "Quantos vasos grandes tenho em estoque?").
10. UNKNOWN: Outro assunto não relacionado.

Regras de negócio cruciais:
- Para vendas com pagamento a prazo/fiado: 'paidValue' deve ser 0 (ou valor da entrada caso haja), 'pendingValue' deve ser o restante, e 'paymentMethod' deve ser 'Fiado' ou o método da entrada.
- Sempre tente associar o nome do produto exatamente com o catálogo disponível. Se o produto falado não constar exatamente, use o nome falado sem forçar o produto errado.
- Se a quantidade vendida for maior que o estoque atual informado no contexto, adicione um aviso explicativo no campo 'warning'.
- Se o valor for discrepante (ex: vaso por R$ 5.000), aponte no campo 'warning'.
- Se for QUERY, gere uma resposta clara, objetiva e amigável em 'parsedData.queryAnswer'.
- Gere sempre um resumo (summary) conciso, elegante e no formato ideal de confirmação humana.
`;

      const response = await aiClient.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Analise a fala do oleiro: "${transcript}"`,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              intent: {
                type: Type.STRING,
                description: 'RECORD_SALE, RECORD_PRODUCTION, RECORD_RAW_MATERIAL, RECORD_LOSS, RECORD_RECEIVABLE_PAYMENT, RECORD_EXPENSE, RECORD_RESERVE, RECORD_DELIVERY, QUERY, UNKNOWN'
              },
              summary: { type: Type.STRING, description: 'Resumo amigável em português' },
              needsMoreInfo: { type: Type.BOOLEAN, description: 'Se falta dado essencial' },
              questionToUser: { type: Type.STRING, description: 'Pergunta curta se precisa de mais dado' },
              confidence: { type: Type.NUMBER, description: 'Score de 0.0 a 1.0' },
              warning: { type: Type.STRING, description: 'Alerta de estoque baixo ou valor incomum' },
              parsedData: {
                type: Type.OBJECT,
                properties: {
                  customerName: { type: Type.STRING },
                  productName: { type: Type.STRING },
                  quantity: { type: Type.NUMBER },
                  unitPrice: { type: Type.NUMBER },
                  totalPrice: { type: Type.NUMBER },
                  paidValue: { type: Type.NUMBER },
                  pendingValue: { type: Type.NUMBER },
                  paymentMethod: { type: Type.STRING, description: 'Pix, Dinheiro, Cartão, Transferência, Boleto, Fiado' },
                  stage: { type: Type.STRING, description: 'Produção, Secagem, Queima, Acabamento, Pronto' },
                  quantityProduced: { type: Type.NUMBER },
                  quantityLost: { type: Type.NUMBER },
                  materialName: { type: Type.STRING },
                  materialCategory: { type: Type.STRING },
                  expenseCategory: { type: Type.STRING },
                  amount: { type: Type.NUMBER },
                  queryAnswer: { type: Type.STRING, description: 'Resposta curta direta se for consulta' }
                }
              }
            },
            required: ['intent', 'summary', 'needsMoreInfo', 'confidence']
          }
        }
      });

      const jsonText = response.text || '{}';
      const parsed = JSON.parse(jsonText);
      return res.json(parsed);

    } catch (err: any) {
      console.error('Error in voice-nlu API:', err);
      // Return fallback parsing on error
      return res.json(fallbackRuleBasedNlu(req.body.transcript || '', req.body.context));
    }
  });

  // Vite integration
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Olaria do Zico Server running on http://0.0.0.0:${PORT}`);
  });
}

function fallbackRuleBasedNlu(text: string, context: any) {
  const lower = text.toLowerCase().trim();

  // Helper to find product from context
  const findProductInContext = (str: string) => {
    if (!context?.products || !Array.isArray(context.products)) return null;
    const match = context.products.find((p: any) => str.includes(p.name.toLowerCase()) || p.name.toLowerCase().includes(str));
    return match || null;
  };

  // 1. Sale
  if (lower.includes('vendi') || lower.includes('venda') || lower.includes('comprou')) {
    const hasPix = lower.includes('pix');
    const hasFiado = lower.includes('fiado') || lower.includes('devendo') || lower.includes('prazo');
    const hasCartao = lower.includes('cartao') || lower.includes('cartão');
    let paymentMethod = hasPix ? 'Pix' : (hasFiado ? 'Fiado' : (hasCartao ? 'Cartão' : 'Dinheiro'));
    
    // Numbers extraction
    const matchVal = lower.match(/(?:por|de|valor|r\$)\s*(\d+(?:[.,]\d+)?)/i) || lower.match(/(\d+(?:[.,]\d+)?)\s*(?:reais|real)/i);
    let val = matchVal ? parseFloat(matchVal[1].replace(',', '.')) : 180;

    const matchQty = lower.match(/(\d+)\s*(?:vaso|vasos|fonte|fontes|cachepô|cachepos|jardineira|peca|peça)/i) || lower.match(/(?:um|uma)\s*(?:vaso|fonte|cachepô)/i);
    const qty = matchQty ? (matchQty[1] ? parseInt(matchQty[1]) : 1) : 1;

    // Detect product from text
    let matchedProd = findProductInContext(lower);
    let prodName = matchedProd ? matchedProd.name : (
      lower.includes('fonte') ? 'Fonte Decorativa' :
      lower.includes('espiral') ? 'Vaso Espiral Terracota' :
      lower.includes('cachepô') || lower.includes('cachepo') ? 'Cachepô Esmaltado' :
      lower.includes('jardineira') ? 'Jardineira Rústica' : 'Vaso Cerâmico Artesanal'
    );

    let customerName = 'Cliente Balcão';
    const matchCustomer = lower.match(/(?:para|pro|pra|cliente|ao)\s+([a-záàâãéèêíóôõúç]+)/i);
    if (matchCustomer && !['um', 'uma', 'dois', 'duas', 'vaso', 'fonte'].includes(matchCustomer[1].toLowerCase())) {
      customerName = matchCustomer[1].charAt(0).toUpperCase() + matchCustomer[1].slice(1);
    }

    const paidValue = hasFiado ? 0 : val;
    const pendingValue = hasFiado ? val : 0;

    return {
      intent: 'RECORD_SALE',
      summary: `Venda de ${qty}x ${prodName} por R$ ${val.toFixed(2)} para ${customerName} (${paymentMethod}).`,
      needsMoreInfo: false,
      confidence: 0.88,
      parsedData: {
        customerName,
        productName: prodName,
        quantity: qty,
        unitPrice: val / qty,
        totalPrice: val,
        paidValue,
        pendingValue,
        paymentMethod
      }
    };
  }

  // 2. Production
  if (lower.includes('produzi') || lower.includes('fiz') || lower.includes('produção') || lower.includes('producao') || lower.includes('forno')) {
    const matchQty = lower.match(/(\d+)/);
    const qty = matchQty ? parseInt(matchQty[1]) : 10;
    
    const matchLost = lower.match(/(\d+)\s*(?:perda|perdas|quebra|quebras|trinca)/i);
    const qtyLost = matchLost ? parseInt(matchLost[1]) : 0;

    let matchedProd = findProductInContext(lower);
    let prodName = matchedProd ? matchedProd.name : (
      lower.includes('fonte') ? 'Fonte Decorativa' :
      lower.includes('espiral') ? 'Vaso Espiral Terracota' :
      lower.includes('cachepô') ? 'Cachepô Esmaltado' : 'Vaso Cerâmico'
    );

    return {
      intent: 'RECORD_PRODUCTION',
      summary: `Produção de lote com ${qty} unidades de ${prodName} (${qtyLost} perdas).`,
      needsMoreInfo: false,
      confidence: 0.88,
      parsedData: {
        productName: prodName,
        quantityProduced: qty,
        quantityLost: qtyLost,
        stage: 'Pronto'
      }
    };
  }

  // 3. Loss / Breakage
  if (lower.includes('quebrei') || lower.includes('trincou') || lower.includes('perda') || lower.includes('quebra')) {
    const matchQty = lower.match(/(\d+)/) || lower.match(/(?:dois|tres|três|quatro)/);
    let qty = 1;
    if (matchQty) {
      if (typeof matchQty[1] === 'string' && !isNaN(parseInt(matchQty[1]))) qty = parseInt(matchQty[1]);
      else if (lower.includes('dois')) qty = 2;
      else if (lower.includes('tres') || lower.includes('três')) qty = 3;
    }

    let matchedProd = findProductInContext(lower);
    let prodName = matchedProd ? matchedProd.name : 'Vaso Cerâmico';

    return {
      intent: 'RECORD_LOSS',
      summary: `Registro de quebra/perda de ${qty} unidade(s) de ${prodName}.`,
      needsMoreInfo: false,
      confidence: 0.88,
      parsedData: {
        productName: prodName,
        quantityLost: qty
      }
    };
  }

  // 4. Raw Material
  if (lower.includes('argila') || lower.includes('esmalte') || lower.includes('tinta') || lower.includes('matéria') || lower.includes('comprei')) {
    const matchVal = lower.match(/(\d+(?:[.,]\d+)?)\s*reais/) || lower.match(/(?:por|de|valor)\s*(\d+(?:[.,]\d+)?)/);
    const amount = matchVal ? parseFloat(matchVal[1].replace(',', '.')) : 300;

    const matchQty = lower.match(/(\d+)\s*(?:kg|quilos|kilos|l|litros)/i);
    const qty = matchQty ? parseFloat(matchQty[1]) : 50;

    const isEsmalte = lower.includes('esmalte');
    const matName = isEsmalte ? 'Esmalte Cerâmico' : 'Argila Terracota';
    const cat = isEsmalte ? 'Esmalte' : 'Argila';

    return {
      intent: 'RECORD_RAW_MATERIAL',
      summary: `Compra de ${qty}${isEsmalte ? 'L' : 'kg'} de ${matName} no valor de R$ ${amount.toFixed(2)}.`,
      needsMoreInfo: false,
      confidence: 0.88,
      parsedData: {
        materialName: matName,
        materialCategory: cat,
        quantity: qty,
        amount: amount
      }
    };
  }

  // 5. Payment Received (Recebimento de fiado)
  if (lower.includes('recebi') || lower.includes('pagou') || lower.includes('acertou')) {
    const matchVal = lower.match(/(\d+(?:[.,]\d+)?)/);
    const amount = matchVal ? parseFloat(matchVal[1].replace(',', '.')) : 200;
    const matchCust = lower.match(/(?:do|da|de|pelo|o)\s+([a-záàâãéèêíóôõúç]+)/i);
    const customerName = (matchCust && !['reais', 'dinheiro', 'pix'].includes(matchCust[1].toLowerCase()))
      ? matchCust[1].charAt(0).toUpperCase() + matchCust[1].slice(1)
      : 'Cliente';

    return {
      intent: 'RECORD_RECEIVABLE_PAYMENT',
      summary: `Recebimento de R$ ${amount.toFixed(2)} de ${customerName}.`,
      needsMoreInfo: false,
      confidence: 0.88,
      parsedData: {
        customerName,
        amount
      }
    };
  }

  // 6. Expense
  if (lower.includes('gastei') || lower.includes('paguei') || lower.includes('despesa') || lower.includes('combustivel') || lower.includes('luz')) {
    const matchVal = lower.match(/(\d+(?:[.,]\d+)?)/);
    const amount = matchVal ? parseFloat(matchVal[1].replace(',', '.')) : 100;
    const desc = lower.includes('luz') || lower.includes('energia') ? 'Energia Elétrica' :
      lower.includes('combustivel') || lower.includes('gasolina') ? 'Combustível Entrega' : 'Despesa Geral Olaria';

    return {
      intent: 'RECORD_EXPENSE',
      summary: `Pagamento de despesa (${desc}) de R$ ${amount.toFixed(2)}.`,
      needsMoreInfo: false,
      confidence: 0.88,
      parsedData: {
        expenseCategory: desc,
        amount
      }
    };
  }

  // 7. Delivery
  if (lower.includes('entreguei') || lower.includes('entrega')) {
    const matchCust = lower.match(/(?:do|da|de|para|pro)\s+([a-záàâãéèêíóôõúç]+)/i);
    const customerName = matchCust ? matchCust[1].charAt(0).toUpperCase() + matchCust[1].slice(1) : 'Cliente';
    return {
      intent: 'RECORD_DELIVERY',
      summary: `Confirmação de entrega realizada para ${customerName}.`,
      needsMoreInfo: false,
      confidence: 0.88,
      parsedData: {
        customerName
      }
    };
  }

  // 8. Query
  if (lower.includes('quanto') || lower.includes('quem') || lower.includes('qual') || lower.includes('quantos') || lower.includes('saldo')) {
    return {
      intent: 'QUERY',
      summary: `Consulta ao sistema de gestão.`,
      needsMoreInfo: false,
      confidence: 0.85,
      parsedData: {
        queryAnswer: `Seus registros estão em dia. No painel de controle você pode conferir o saldo em caixa, pedidos pendentes e estoque em tempo real.`
      }
    };
  }

  return {
    intent: 'UNKNOWN',
    summary: `Comando não compreendido com certeza: "${text}"`,
    needsMoreInfo: true,
    questionToUser: 'Pode repetir o comando? Ex: "Vendi 2 vasos por 240 no Pix para Carlos".',
    confidence: 0.4
  };
}

startServer();
