import * as XLSX from 'xlsx';
import { StorageService } from './storage';

export const BackupExportService = {
  /**
   * Generates and downloads a complete Excel file (.xlsx) containing all company datasets
   * separated into clear, structured worksheets.
   */
  exportCompleteBackupToExcel: (companyName?: string) => {
    const nameSanitized = (companyName || 'Olaria_do_Zico').replace(/[^a-zA-Z0-9]/g, '_');
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `Backup_Completo_${nameSanitized}_${dateStr}.xlsx`;

    const wb = XLSX.utils.book_new();

    // 1. Produtos & Catálogo de Peças
    const products = StorageService.getProducts();
    const productsData = products.map((p) => ({
      'Código': p.code || p.id,
      'Nome da Peça': p.name,
      'Categoria': p.category,
      'Dimensões / Tamanho': p.size,
      'Acabamento': p.finish || 'Padrão',
      'Custo de Produção (R$)': p.cost || 0,
      'Preço de Venda (R$)': p.price,
      'Estoque Atual': p.stock,
      'Estoque Mínimo': p.minStock,
      'Status Estoque': p.stock <= p.minStock ? 'CRÍTICO' : 'NORMAL'
    }));
    const wsProducts = XLSX.utils.json_to_sheet(productsData.length > 0 ? productsData : [{ 'Aviso': 'Nenhum produto cadastrado' }]);
    XLSX.utils.book_append_sheet(wb, wsProducts, 'Produtos e Estoque');

    // 2. Vendas
    const sales = StorageService.getSales();
    const salesData = sales.map((s) => ({
      'Código Venda': s.code || s.id,
      'Data': new Date(s.date).toLocaleDateString('pt-BR'),
      'Cliente': s.customerName || 'Cliente Balcão',
      'Forma de Pagamento': s.paymentMethod,
      'Valor Total (R$)': s.totalValue,
      'Valor Pago (R$)': s.paidValue,
      'Valor Pendente (R$)': s.pendingValue,
      'Status': s.status,
      'Observações': s.notes || ''
    }));
    const wsSales = XLSX.utils.json_to_sheet(salesData.length > 0 ? salesData : [{ 'Aviso': 'Nenhuma venda registrada' }]);
    XLSX.utils.book_append_sheet(wb, wsSales, 'Vendas');

    // 3. Clientes
    const customers = StorageService.getCustomers();
    const customersData = customers.map((c) => ({
      'ID Cliente': c.id,
      'Nome / Razão Social': c.name,
      'Telefone': c.phone || '',
      'WhatsApp': c.whatsapp || '',
      'CPF/CNPJ': c.cpfCnpj || '',
      'Endereço': c.address || '',
      'Cidade': c.city || '',
      'Tipo': c.type,
      'Observações': c.notes || ''
    }));
    const wsCustomers = XLSX.utils.json_to_sheet(customersData.length > 0 ? customersData : [{ 'Aviso': 'Nenhum cliente cadastrado' }]);
    XLSX.utils.book_append_sheet(wb, wsCustomers, 'Clientes');

    // 4. Pedidos Sob Encomenda
    const customOrders = StorageService.getCustomOrders();
    const ordersData = customOrders.map((o) => ({
      'Código Pedido': o.code || o.id,
      'Data Solicitação': new Date(o.createdAt).toLocaleDateString('pt-BR'),
      'Cliente': o.customerName,
      'Descrição do Produto': o.productDescription,
      'Especificação Cor/Acabamento': o.colorSpecs || '',
      'Valor Total (R$)': o.totalPrice,
      'Sinal / Entrada Pago (R$)': o.depositPaid,
      'Status': o.status,
      'Data Prometida': new Date(o.targetDate).toLocaleDateString('pt-BR')
    }));
    const wsOrders = XLSX.utils.json_to_sheet(ordersData.length > 0 ? ordersData : [{ 'Aviso': 'Nenhum pedido sob encomenda' }]);
    XLSX.utils.book_append_sheet(wb, wsOrders, 'Pedidos Sob Encomenda');

    // 5. Entregas & Frete
    const deliveries = StorageService.getDeliveries();
    const deliveriesData = deliveries.map((d) => ({
      'ID Entrega': d.id,
      'Cliente': d.customerName,
      'Telefone': d.customerPhone || '',
      'Endereço': d.address,
      'Data Prevista': new Date(d.deliveryDate).toLocaleDateString('pt-BR'),
      'Frete (R$)': d.shippingFee,
      'Entregador / Transporte': d.deliveryPerson || 'Não informado',
      'Status': d.status
    }));
    const wsDeliveries = XLSX.utils.json_to_sheet(deliveriesData.length > 0 ? deliveriesData : [{ 'Aviso': 'Nenhuma entrega registrada' }]);
    XLSX.utils.book_append_sheet(wb, wsDeliveries, 'Entregas');

    // 6. Despesas & Lançamentos Financeiros
    const expenses = StorageService.getExpenses();
    const expensesData = expenses.map((e) => ({
      'ID': e.id,
      'Descrição': e.description,
      'Categoria': e.category,
      'Valor (R$)': e.amount,
      'Fornecedor': e.supplier || '',
      'Vencimento': new Date(e.dueDate).toLocaleDateString('pt-BR'),
      'Status': e.status
    }));
    const wsExpenses = XLSX.utils.json_to_sheet(expensesData.length > 0 ? expensesData : [{ 'Aviso': 'Nenhuma despesa registrada' }]);
    XLSX.utils.book_append_sheet(wb, wsExpenses, 'Despesas');

    // 7. Lotes de Produção
    const production = StorageService.getProduction();
    const productionData = production.map((p) => ({
      'Código Lote': p.code || p.id,
      'Produto': p.productName,
      'Qtd Planejada': p.quantityPlanned,
      'Qtd Produzida': p.quantityProduced,
      'Qtd Perdas': p.quantityLost,
      'Qtd Aproveitada': p.quantityGood,
      'Etapa': p.stage,
      'Data Início': new Date(p.startDate).toLocaleDateString('pt-BR')
    }));
    const wsProduction = XLSX.utils.json_to_sheet(productionData.length > 0 ? productionData : [{ 'Aviso': 'Nenhuma produção registrada' }]);
    XLSX.utils.book_append_sheet(wb, wsProduction, 'Produção');

    // Write file to user's browser
    XLSX.writeFile(wb, filename);
  }
};
