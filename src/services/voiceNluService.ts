import { NluActionPayload } from '../types';
import { StorageService } from './storage';

export interface NluContext {
  products?: Array<{ name: string; stock: number; price: number }>;
  customers?: Array<{ name: string }>;
}

export class VoiceNluService {
  static async processVoiceCommand(transcript: string, context?: NluContext): Promise<NluActionPayload> {
    const text = transcript.trim();
    if (!text) {
      throw new Error('Comando de voz vazio.');
    }

    // 1. Try server-side Gemini API first with timeout
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const response = await fetch('/api/voice-nlu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          transcript: text,
          context: context || {
            products: StorageService.getProducts().map(p => ({ name: p.name, stock: p.stock, price: p.price })),
            customers: StorageService.getCustomers().map(c => ({ name: c.name }))
          }
        })
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const result: NluActionPayload = await response.json();
        if (result && result.intent && result.intent !== 'UNKNOWN') {
          return result;
        }
      }
    } catch (err) {
      console.warn('Voice API endpoint not available or timed out. Falling back to local NLU engine.', err);
    }

    // 2. Local Fallback NLU Engine (Runs on Vercel, offline, or when API is unreachable)
    return this.parseVoiceCommandLocal(text, context);
  }

  static parseVoiceCommandLocal(text: string, context?: NluContext): NluActionPayload {
    const lower = text.toLowerCase().trim();

    // Helper to find matching product name
    const products = StorageService.getProducts();
    const findProduct = (str: string) => {
      return products.find(p => str.includes(p.name.toLowerCase()) || p.name.toLowerCase().includes(str));
    };

    // Helper to extract numeric values
    const extractMoney = (str: string): number => {
      const matchVal = str.match(/(?:por|de|valor|r\$)\s*(\d+(?:[.,]\d+)?)/i) || 
                       str.match(/(\d+(?:[.,]\d+)?)\s*(?:reais|real)/i) ||
                       str.match(/(\d+(?:[.,]\d+)?)/);
      return matchVal ? parseFloat(matchVal[1].replace(',', '.')) : 0;
    };

    const extractQuantity = (str: string): number => {
      if (str.includes('um ') || str.includes('uma ')) return 1;
      if (str.includes('dois ') || str.includes('duas ')) return 2;
      if (str.includes('três ') || str.includes('tres ')) return 3;
      if (str.includes('quatro ')) return 4;
      if (str.includes('cinco ')) return 5;
      const match = str.match(/(\d+)\s*(?:vaso|vasos|fonte|fontes|lote|peça|peças|unidade|unidades|cachepô|jardineira)?/i);
      return match ? parseInt(match[1], 10) : 1;
    };

    // --- A. QUERY / CONSULTAS ---
    if (
      lower.includes('qual') || 
      lower.includes('quanto') || 
      lower.includes('quem') || 
      lower.includes('saldo devedor') || 
      lower.includes('devendo') ||
      lower.includes('quanto vendi') ||
      lower.includes('quantos vasos')
    ) {
      // Query 1: Saldo devedor de cliente específico
      const matchCustomer = lower.match(/(?:de|do|da|para|cliente)\s+([a-záàâãéèêíóôõúç]+)/i);
      if (lower.includes('saldo') || lower.includes('devendo') || lower.includes('dívida')) {
        const customerName = matchCustomer ? matchCustomer[1].charAt(0).toUpperCase() + matchCustomer[1].slice(1) : '';
        const receivables = StorageService.getReceivables().filter(r => r.status !== 'Pago');

        let targetRecs = receivables;
        if (customerName) {
          targetRecs = receivables.filter(r => r.customerName.toLowerCase().includes(customerName.toLowerCase()));
        }

        const totalDebt = targetRecs.reduce((acc, r) => acc + (r.amount - r.amountPaid), 0);

        const answer = customerName
          ? (totalDebt > 0 
              ? `O cliente ${customerName} possui um saldo devedor pendente de R$ ${totalDebt.toFixed(2)}.`
              : `O cliente ${customerName} não possui débitos pendentes na olaria.`)
          : (receivables.length > 0 
              ? `Existe um total de R$ ${totalDebt.toFixed(2)} a receber de ${receivables.length} conta(s) pendente(s).`
              : `Não há saldos devedores pendentes no momento.`);

        return {
          intent: 'QUERY',
          summary: answer,
          needsMoreInfo: false,
          confidence: 0.95,
          parsedData: { queryAnswer: answer }
        };
      }

      // Query 2: Vendas do mês / hoje
      if (lower.includes('vendi') || lower.includes('faturamento') || lower.includes('vendas')) {
        const sales = StorageService.getSales().filter(s => s.status !== 'Cancelada');
        const totalVendas = sales.reduce((acc, s) => acc + s.totalValue, 0);
        const answer = `A olaria acumula um total de R$ ${totalVendas.toFixed(2)} em ${sales.length} vendas registradas.`;
        return {
          intent: 'QUERY',
          summary: answer,
          needsMoreInfo: false,
          confidence: 0.92,
          parsedData: { queryAnswer: answer }
        };
      }

      // Query 3: Estoque
      if (lower.includes('estoque') || lower.includes('vasos') || lower.includes('quantos')) {
        const totalStock = products.reduce((acc, p) => acc + p.stock, 0);
        const answer = `O estoque total da olaria conta com ${totalStock} peças cerâmicas disponíveis em catálogo.`;
        return {
          intent: 'QUERY',
          summary: answer,
          needsMoreInfo: false,
          confidence: 0.90,
          parsedData: { queryAnswer: answer }
        };
      }
    }

    // --- B. RECEIVABLE PAYMENT / RECEBIMENTO DE FIADO ---
    if (lower.includes('recebi') || lower.includes('pagou do que devia') || (lower.includes('pagou') && lower.includes('fiado'))) {
      const amount = extractMoney(lower) || 200;
      let customerName = 'Cliente';
      const matchCust = lower.match(/(?:de|do|da|cliente)\s+([a-záàâãéèêíóôõúç]+)/i);
      if (matchCust && !['fiado', 'reais', 'pix', 'dinheiro'].includes(matchCust[1].toLowerCase())) {
        customerName = matchCust[1].charAt(0).toUpperCase() + matchCust[1].slice(1);
      }

      return {
        intent: 'RECORD_RECEIVABLE_PAYMENT',
        summary: `Recebimento de R$ ${amount.toFixed(2)} do cliente ${customerName} (quitação de débito).`,
        needsMoreInfo: false,
        confidence: 0.92,
        parsedData: {
          customerName,
          amount
        }
      };
    }

    // --- C. EXPENSES / DESPESAS ---
    if (lower.includes('paguei') || lower.includes('gastei') || lower.includes('conta de') || lower.includes('despesa')) {
      const amount = extractMoney(lower) || 150;
      let category = 'Operacional';
      if (lower.includes('luz') || lower.includes('energia') || lower.includes('forno')) category = 'Energia / Fornos';
      else if (lower.includes('frete') || lower.includes('combustível') || lower.includes('gasolina')) category = 'Transporte / Entregas';
      else if (lower.includes('argila') || lower.includes('insumo')) category = 'Matéria-Prima';

      return {
        intent: 'RECORD_EXPENSE',
        summary: `Pagamento de despesa de R$ ${amount.toFixed(2)} (${category}).`,
        needsMoreInfo: false,
        confidence: 0.90,
        parsedData: {
          amount,
          expenseCategory: category
        }
      };
    }

    // --- D. PRODUCTION / PRODUÇÃO & QUEIMA ---
    if (lower.includes('produzi') || lower.includes('lote') || lower.includes('queima') || lower.includes('fiz') || lower.includes('forno')) {
      const qty = extractQuantity(lower) || 30;
      const matchLost = lower.match(/(\d+)\s*(?:perda|perdas|quebra|quebras|trinca)/i);
      const qtyLost = matchLost ? parseInt(matchLost[1], 10) : (lower.includes('perda') ? 2 : 0);

      const prod = findProduct(lower);
      const prodName = prod ? prod.name : (lower.includes('fonte') ? 'Fonte Decorativa' : 'Vaso Terracota Artesanal');

      return {
        intent: 'RECORD_PRODUCTION',
        summary: `Produção de lote com ${qty}x ${prodName} (${qtyLost} perdas na queima).`,
        needsMoreInfo: false,
        confidence: 0.90,
        parsedData: {
          productName: prodName,
          quantityProduced: qty,
          quantityLost: qtyLost,
          stage: 'Pronto'
        }
      };
    }

    // --- E. RECORD SALE / VENDA (Default / Fallback Primário) ---
    const hasPix = lower.includes('pix');
    const hasFiado = lower.includes('fiado') || lower.includes('devendo') || lower.includes('prazo');
    const hasCartao = lower.includes('cartão') || lower.includes('cartao');
    const paymentMethod = hasPix ? 'Pix' : (hasFiado ? 'Fiado' : (hasCartao ? 'Cartão' : 'Dinheiro'));

    const qty = extractQuantity(lower) || 1;
    let totalPrice = extractMoney(lower);
    if (!totalPrice || totalPrice === 0) {
      totalPrice = 180 * qty;
    }

    const prod = findProduct(lower);
    const prodName = prod ? prod.name : (
      lower.includes('vaso') ? 'Vaso Terracota' :
      lower.includes('fonte') ? 'Fonte Decorativa' :
      lower.includes('cachepô') ? 'Cachepô Esmaltado' : 'Vaso Cerâmico'
    );

    let customerName = 'Cliente Balcão';
    const matchCustomer = lower.match(/(?:para|pro|pra|cliente|ao)\s+([a-záàâãéèêíóôõúç]+)/i);
    if (matchCustomer) {
      const candidate = matchCustomer[1].toLowerCase();
      if (!['um', 'uma', 'dois', 'duas', 'vaso', 'vasos', 'fonte', 'pix', 'fiado', 'reais'].includes(candidate)) {
        customerName = candidate.charAt(0).toUpperCase() + candidate.slice(1);
      }
    }

    const paidValue = hasFiado ? 0 : totalPrice;
    const pendingValue = hasFiado ? totalPrice : 0;

    return {
      intent: 'RECORD_SALE',
      summary: `Venda de ${qty}x ${prodName} por R$ ${totalPrice.toFixed(2)} para ${customerName} (${paymentMethod}).`,
      needsMoreInfo: false,
      confidence: 0.88,
      parsedData: {
        customerName,
        productName: prodName,
        quantity: qty,
        unitPrice: totalPrice / qty,
        totalPrice,
        paidValue,
        pendingValue,
        paymentMethod
      }
    };
  }
}
