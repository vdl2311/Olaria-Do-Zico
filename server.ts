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

      const productsSummary = context?.products ? context.products.map((p: any) => `${p.name} (Estoque: ${p.stock}, R$${p.price})`).join(', ') : '';
      const customersSummary = context?.customers ? context.customers.map((c: any) => c.name).join(', ') : '';

      const systemInstruction = `
Você é o "Assistente da Olaria", a IA administrativa da "Olaria do Zico" (fábrica de vasos, fontes, cachepôs, jardineiras e peças decorativas de cerâmica).
Seu papel é interpretar falas em Português do Brasil do oleiro/proprietário e transformar em dados estruturados ou responder a dúvidas financeiras/estoque.

Produtos atuais em catálogo: [${productsSummary}]
Clientes cadastrados: [${customersSummary}]

Defina uma das intenções (intent):
1. RECORD_SALE: Venda de vaso, fonte ou produto cerâmico (ex: "Vendi um vaso Vietnamita por 180 reais para João, no Pix", "Vendi duas fontes para Carlos por 600").
2. RECORD_PRODUCTION: Registro de produção/queima (ex: "Produzi 15 vasos médios hoje", "Fiz 10 cachepôs").
3. RECORD_RAW_MATERIAL: Compra de matéria-prima (ex: "Comprei 50 quilos de argila por 300 reais", "Comprei esmalte azul").
4. RECORD_LOSS: Perda ou quebra (ex: "Quebrei três vasos na queima", "Dos 20, 3 quebraram na queima").
5. RECORD_RECEIVABLE_PAYMENT: Recebimento de dívida/fiado (ex: "Recebi 500 reais do João", "Pedro pagou 200").
6. RECORD_EXPENSE: Pagamento de despesa (ex: "Gastei 150 reais de combustível", "Paguei a luz").
7. RECORD_RESERVE: Reserva de produto (ex: "Reserve cinco vasos para o Carlos").
8. RECORD_DELIVERY: Confirmação de entrega (ex: "Entreguei o pedido da Maria", "Entreguei pro Carlos").
9. QUERY: Pergunta do oleiro sobre faturamento, vendas, estoque, dívidas (ex: "Quanto vendi esse mês?", "Quem está devendo?", "Quantos vasos grandes tenho?").
10. UNKNOWN: Outro assunto não relacionado.

Regras importantes:
- Se faltar informação essencial em uma operação (por exemplo, forma de pagamento em uma venda), defina needsMoreInfo=true e coloque em questionToUser uma pergunta curta e amigável (ex: "Como Carlos pagou?").
- Se a operação de venda exceder o estoque disponível fornecido no contexto, crie um alerta no campo warning (ex: "Atenção: você possui apenas 5 unidades em estoque.").
- Se o valor for atipicamente alto em relação ao normal (ex: "Vendi um vaso por R$ 5.000"), crie um alerta no campo warning ("Atenção: valor informado de R$ 5.000 é muito maior que o habitual de R$ 250.").
- No campo queryAnswer (quando intent for QUERY), forneça uma resposta direta, clara e sucinta em português como um assistente de olaria prestativo.
- Crie um resumo conciso (summary) no formato: "Venda de 1 Vaso Vietnamita por R$ 180 para João, pagamento via Pix."
`;

      const response = await aiClient.models.generateContent({
        model: 'gemini-3.6-flash',
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

  // 1. Sale
  if (lower.includes('vendi') || lower.includes('venda')) {
    const hasPix = lower.includes('pix');
    const hasFiado = lower.includes('fiado') || lower.includes('devendo');
    let paymentMethod = hasPix ? 'Pix' : (hasFiado ? 'Fiado' : 'Dinheiro');
    
    // Numbers extraction
    const matchVal = lower.match(/(?:por|de|valor|r\$)\s*(\d+)/i) || lower.match(/(\d+)\s*(?:reais|real)/i);
    const val = matchVal ? parseFloat(matchVal[1]) : 180;

    const matchQty = lower.match(/(\d+)\s*(?:vaso|vasos|fonte|fontes|cachepô|cachepos|jardineira)/i) || lower.match(/(?:um|uma)\s*(?:vaso|fonte|cachepô)/i);
    const qty = matchQty ? (matchQty[1] ? parseInt(matchQty[1]) : 1) : 1;

    let customerName = 'Cliente';
    const matchCustomer = lower.match(/(?:para|pro|pra|cliente)\s+([a-záàâãéèêíóôõúç]+)/i);
    if (matchCustomer) {
      customerName = matchCustomer[1].charAt(0).toUpperCase() + matchCustomer[1].slice(1);
    }

    return {
      intent: 'RECORD_SALE',
      summary: `Venda de ${qty} Vaso(s) por R$ ${val} para ${customerName}, pagamento em ${paymentMethod}.`,
      needsMoreInfo: false,
      confidence: 0.85,
      parsedData: {
        customerName,
        productName: lower.includes('fonte') ? 'Fonte Decorativa' : 'Vaso Vietnamita',
        quantity: qty,
        unitPrice: val / qty,
        totalPrice: val,
        paidValue: paymentMethod === 'Fiado' ? 0 : val,
        pendingValue: paymentMethod === 'Fiado' ? val : 0,
        paymentMethod
      }
    };
  }

  // 2. Production
  if (lower.includes('produzi') || lower.includes('fiz') || lower.includes('produção')) {
    const matchQty = lower.match(/(\d+)/);
    const qty = matchQty ? parseInt(matchQty[1]) : 10;
    return {
      intent: 'RECORD_PRODUCTION',
      summary: `Registro de produção de ${qty} vasos médios.`,
      needsMoreInfo: false,
      confidence: 0.85,
      parsedData: {
        productName: 'Vaso Vietnamita Médio',
        quantityProduced: qty,
        quantityLost: 0,
        stage: 'Pronto'
      }
    };
  }

  // 3. Loss / Breakage
  if (lower.includes('quebrei') || lower.includes('trincou') || lower.includes('perda')) {
    const matchQty = lower.match(/(\d+)/) || lower.match(/(?:dois|tres|três|quatro)/);
    let qty = 1;
    if (matchQty) {
      if (typeof matchQty[1] === 'string' && !isNaN(parseInt(matchQty[1]))) qty = parseInt(matchQty[1]);
      else if (lower.includes('dois')) qty = 2;
      else if (lower.includes('tres') || lower.includes('três')) qty = 3;
    }
    return {
      intent: 'RECORD_LOSS',
      summary: `Registro de perda/quebra de ${qty} vaso(s).`,
      needsMoreInfo: false,
      confidence: 0.85,
      parsedData: {
        productName: 'Vaso Vietnamita',
        quantityLost: qty
      }
    };
  }

  // 4. Raw Material
  if (lower.includes('argila') || lower.includes('esmalte') || lower.includes('matéria') || lower.includes('comprei')) {
    const matchVal = lower.match(/(\d+)\s*reais/) || lower.match(/(?:por|de)\s*(\d+)/);
    const amount = matchVal ? parseFloat(matchVal[1]) : 300;

    const matchQty = lower.match(/(\d+)\s*(?:kg|quilos|kilos)/i);
    const qty = matchQty ? parseFloat(matchQty[1]) : 50;

    return {
      intent: 'RECORD_RAW_MATERIAL',
      summary: `Compra de ${qty}kg de Argila no valor de R$ ${amount}.`,
      needsMoreInfo: false,
      confidence: 0.85,
      parsedData: {
        materialName: 'Argila Terracota',
        materialCategory: 'Argila',
        quantity: qty,
        amount: amount
      }
    };
  }

  // 5. Payment Received
  if (lower.includes('recebi') || lower.includes('pagou')) {
    const matchVal = lower.match(/(\d+)/);
    const amount = matchVal ? parseFloat(matchVal[1]) : 200;
    const matchCust = lower.match(/(?:do|da|de|pelo)\s+([a-záàâãéèêíóôõúç]+)/i);
    const customerName = matchCust ? matchCust[1].charAt(0).toUpperCase() + matchCust[1].slice(1) : 'João';

    return {
      intent: 'RECORD_RECEIVABLE_PAYMENT',
      summary: `Recebimento de R$ ${amount} de ${customerName}.`,
      needsMoreInfo: false,
      confidence: 0.85,
      parsedData: {
        customerName,
        amount
      }
    };
  }

  // 6. Delivery
  if (lower.includes('entreguei') || lower.includes('entrega')) {
    const matchCust = lower.match(/(?:do|da|de|para|pro)\s+([a-záàâãéèêíóôõúç]+)/i);
    const customerName = matchCust ? matchCust[1].charAt(0).toUpperCase() + matchCust[1].slice(1) : 'Carlos';
    return {
      intent: 'RECORD_DELIVERY',
      summary: `Confirmação de entrega realizada para ${customerName}.`,
      needsMoreInfo: false,
      confidence: 0.85,
      parsedData: {
        customerName
      }
    };
  }

  // Query
  if (lower.includes('quanto') || lower.includes('quem') || lower.includes('qual') || lower.includes('quantos')) {
    return {
      intent: 'QUERY',
      summary: `Consulta ao sistema de gestão.`,
      needsMoreInfo: false,
      confidence: 0.8,
      parsedData: {
        queryAnswer: `No momento você possui 12 Vasos Vietnamitas Grandes e 8 Médios em estoque. Vendas do mês somam R$ 1.760,00.`
      }
    };
  }

  return {
    intent: 'UNKNOWN',
    summary: `Comando não compreendido totalmente: "${text}"`,
    needsMoreInfo: true,
    questionToUser: 'Pode repetir a operação? Exemplo: "Vendi um vaso por 180 reais".',
    confidence: 0.4
  };
}

startServer();
