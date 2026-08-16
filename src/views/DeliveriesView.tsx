import React, { useState, useEffect } from 'react';
import { Truck, CheckCircle2, Clock, MapPin, Mic, Plus, X } from 'lucide-react';
import { StorageService, subscribeStorage } from '../services/storage';
import { Delivery } from '../types';

interface DeliveriesViewProps {
  onOpenVoiceModal: () => void;
}

export const DeliveriesView: React.FC<DeliveriesViewProps> = ({ onOpenVoiceModal }) => {
  const [deliveries, setDeliveries] = useState<Delivery[]>(() => StorageService.getDeliveries());
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New Delivery Form
  const [customerName, setCustomerName] = useState('');
  const [address, setAddress] = useState('');
  const [deliveryDate, setDeliveryDate] = useState(new Date().toISOString().split('T')[0]);
  const [shippingFee, setShippingFee] = useState(0);
  const [deliveryPerson, setDeliveryPerson] = useState('');
  const [notes, setNotes] = useState('');

  const refreshData = () => {
    setDeliveries(StorageService.getDeliveries());
  };

  useEffect(() => {
    const unsub = subscribeStorage(() => {
      refreshData();
    });
    return () => unsub();
  }, []);

  const handleMarkDelivered = (delivery: Delivery) => {
    const updated: Delivery = {
      ...delivery,
      status: 'Entregue',
      completedAt: new Date().toISOString()
    };
    StorageService.saveDelivery(updated);
    refreshData();
  };

  const handleCreateDelivery = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !address.trim()) return;

    const newDel: Delivery = {
      id: `del-${Date.now()}`,
      customerName,
      address,
      deliveryDate,
      shippingFee,
      status: 'Pendente',
      deliveryPerson,
      notes
    };

    StorageService.saveDelivery(newDel);
    refreshData();
    setIsModalOpen(false);

    setCustomerName('');
    setAddress('');
    setNotes('');
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-amber-950 flex items-center gap-2">
            <Truck className="w-6 h-6 text-amber-800" />
            <span>Logística e Organização de Entregas</span>
          </h2>
          <p className="text-xs text-amber-800/80">Acompanhe entregas pendentes e confirme conclusões por voz ("Entreguei o pedido do Carlos").</p>
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <button
            onClick={onOpenVoiceModal}
            className="flex-1 sm:flex-none flex items-center justify-center space-x-2 bg-amber-600 hover:bg-amber-500 text-white font-bold px-4 py-2.5 rounded-xl shadow-xs transition-all text-xs sm:text-sm"
          >
            <Mic className="w-4 h-4 animate-pulse" />
            <span>Confirmar por Voz</span>
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex-1 sm:flex-none flex items-center justify-center space-x-2 bg-amber-900 hover:bg-amber-800 text-amber-50 font-bold px-4 py-2.5 rounded-xl shadow-xs transition-all text-xs sm:text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Entrega</span>
          </button>
        </div>
      </div>

      {/* Deliveries List Cards */}
      {deliveries.length === 0 ? (
        <div className="bg-white border border-amber-200 rounded-2xl p-10 text-center space-y-4 shadow-xs">
          <Truck className="w-12 h-12 text-amber-400 mx-auto" />
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="font-bold text-amber-950 text-base">Nenhuma entrega agendada</h3>
            <p className="text-xs text-amber-700">
              Agende o transporte e entrega de peças para clientes ou use comandos de voz ao finalizar um pedido.
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center space-x-2 bg-amber-900 hover:bg-amber-800 text-amber-50 font-bold px-4 py-2.5 rounded-xl shadow-xs transition-all text-xs sm:text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Agendar Primeira Entrega</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {deliveries.map((del) => (
            <div key={del.id} className="bg-white border border-amber-200 rounded-2xl p-5 shadow-xs space-y-3">
              <div className="flex items-start justify-between border-b border-amber-100 pb-2">
                <div>
                  <span className="text-xs font-bold text-amber-700">Data Prevista: {del.deliveryDate}</span>
                  <h3 className="font-black text-amber-950 text-base">{del.customerName}</h3>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                  del.status === 'Entregue' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-200 text-amber-900'
                }`}>
                  {del.status}
                </span>
              </div>

              <div className="text-xs text-amber-900 space-y-1 bg-amber-50/60 p-3 rounded-xl border border-amber-100">
                <p className="flex items-center gap-1.5 font-medium">
                  <MapPin className="w-4 h-4 text-amber-700 shrink-0" />
                  <span><strong>Endereço:</strong> {del.address}</span>
                </p>
                {del.shippingFee > 0 && <p><strong>Frete:</strong> R$ {del.shippingFee.toFixed(2)}</p>}
                {del.deliveryPerson && <p><strong>Entregador:</strong> {del.deliveryPerson}</p>}
                {del.notes && <p className="italic text-amber-800">Obs: {del.notes}</p>}
              </div>

              {del.status !== 'Entregue' ? (
                <button
                  onClick={() => handleMarkDelivered(del)}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-2 transition-all shadow-xs"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>MARCAR COMO ENTREGUE</span>
                </button>
              ) : (
                <div className="text-center py-1 text-xs text-emerald-800 font-bold bg-emerald-50 rounded-xl border border-emerald-200">
                  ✓ Entregue em {del.completedAt ? new Date(del.completedAt).toLocaleDateString('pt-BR') : del.deliveryDate}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* New Delivery Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-amber-200 space-y-4">
            <div className="flex items-center justify-between border-b border-amber-100 pb-3">
              <h3 className="font-bold text-amber-950 text-base">Agendar Nova Entrega</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-amber-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDelivery} className="space-y-3 text-xs sm:text-sm">
              <div>
                <label className="block font-bold text-amber-900 mb-1">Cliente:</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Carlos Mendes"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full bg-amber-50/50 border border-amber-300 rounded-xl p-2.5 text-amber-950"
                />
              </div>

              <div>
                <label className="block font-bold text-amber-900 mb-1">Endereço de Entrega:</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Av. das Flores, 1200 - Campinas"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-amber-50/50 border border-amber-300 rounded-xl p-2.5 text-amber-950"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-amber-900 mb-1">Data:</label>
                  <input
                    type="date"
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                    className="w-full bg-amber-50/50 border border-amber-300 rounded-xl p-2.5 text-amber-950"
                  />
                </div>

                <div>
                  <label className="block font-bold text-amber-900 mb-1">Valor do Frete (R$):</label>
                  <input
                    type="number"
                    value={shippingFee}
                    onChange={(e) => setShippingFee(parseFloat(e.target.value) || 0)}
                    className="w-full bg-amber-50/50 border border-amber-300 rounded-xl p-2.5 text-amber-950"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-amber-900 mb-1">Responsável / Entregador:</label>
                <input
                  type="text"
                  placeholder="Ex: Furgão do Zico / Mário"
                  value={deliveryPerson}
                  onChange={(e) => setDeliveryPerson(e.target.value)}
                  className="w-full bg-amber-50/50 border border-amber-300 rounded-xl p-2.5 text-amber-950"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-amber-300 rounded-xl text-amber-900 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-800 text-amber-50 rounded-xl font-bold"
                >
                  Salvar Entrega
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
