import React, { useEffect, useState } from 'react';
import { usePOSStore } from '../store/usePOSStore';
import { repository } from '../services/indexedDBRepository';
import { Order, OrderItem, Payment } from '../types';
import { X, Printer, PlusCircle, CheckCircle } from 'lucide-react';

export const ReceiptModal: React.FC = () => {
  const {
    isReceiptModalOpen,
    setReceiptModalOpen,
    lastCompletedOrder,
    setLastCompletedOrder,
    settings
  } = usePOSStore();

  const [orderDetails, setOrderDetails] = useState<{
    order: Order;
    items: OrderItem[];
    payment?: Payment;
  } | null>(null);

  useEffect(() => {
    if (lastCompletedOrder && lastCompletedOrder.id) {
      repository.getOrderDetails(lastCompletedOrder.id).then((details) => {
        if (details) {
          setOrderDetails(details);
        }
      });
    }
  }, [lastCompletedOrder]);

  if (!isReceiptModalOpen || !orderDetails) return null;

  const { order, items, payment } = orderDetails;

  const handlePrint = () => {
    window.print();
  };

  const handleClose = () => {
    setReceiptModalOpen(false);
    setLastCompletedOrder(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#151c2c] border border-[#232d42] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-[#232d42] flex items-center justify-between bg-[#0f172a]">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-cyan-400" />
            <h2 className="text-sm font-bold text-white">Struk Pembelian Official</h2>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-[#232d42]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Thermal Receipt Printable Container */}
        <div className="p-6 overflow-y-auto flex-1 flex justify-center bg-[#0b0f19]">
          <div
            id="thermal-receipt-printable"
            className="w-full max-w-[280px] bg-white text-slate-900 p-4 font-mono text-xs shadow-2xl rounded border border-slate-300"
          >
            {/* Store Title Header */}
            <div className="text-center pb-3 mb-3 border-b border-dashed border-slate-400">
              <h1 className="font-extrabold text-sm uppercase tracking-wider text-slate-900">{settings.outlet_name}</h1>
              <p className="text-[10px] text-slate-600">POS & Kasir iPad Web</p>
              <p className="text-[10px] text-slate-600 mt-1">Nota: {order.order_number}</p>
              <p className="text-[10px] text-slate-600">{new Date(order.created_at).toLocaleString('id-ID')}</p>
            </div>

            {/* Customer Info */}
            <div className="mb-3 text-[10px] space-y-0.5 border-b border-dashed border-slate-400 pb-2 text-slate-700">
              <div className="flex justify-between">
                <span>Pelanggan:</span>
                <span className="font-bold text-slate-900">{order.customer_name || 'Umum'}</span>
              </div>
              <div className="flex justify-between">
                <span>Kasir:</span>
                <span className="font-bold text-slate-900">Ozy</span>
              </div>
            </div>

            {/* Items List */}
            <div className="space-y-1.5 mb-3 border-b border-dashed border-slate-400 pb-3">
              {items.map((item, idx) => (
                <div key={idx} className="text-[11px]">
                  <div className="font-bold text-slate-900 truncate">{item.product_name}</div>
                  <div className="flex justify-between text-slate-600 pl-2">
                    <span>{item.quantity} x Rp {item.unit_price.toLocaleString('id-ID')}</span>
                    <span className="font-bold text-slate-900">Rp {item.subtotal.toLocaleString('id-ID')}</span>
                  </div>
                  {item.notes && <div className="text-[9px] text-slate-500 italic pl-2">({item.notes})</div>}
                </div>
              ))}
            </div>

            {/* Totals Summary */}
            <div className="space-y-1 text-[11px] mb-4 text-slate-700">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>Rp {order.subtotal.toLocaleString('id-ID')}</span>
              </div>
              {order.discount_amount > 0 && (
                <div className="flex justify-between text-red-600 font-semibold">
                  <span>Diskon:</span>
                  <span>-Rp {order.discount_amount.toLocaleString('id-ID')}</span>
                </div>
              )}
              {order.tax_amount > 0 && (
                <div className="flex justify-between">
                  <span>Pajak (PPN):</span>
                  <span>Rp {order.tax_amount.toLocaleString('id-ID')}</span>
                </div>
              )}
              <div className="flex justify-between font-extrabold text-sm border-t border-slate-900 pt-1.5 mt-1 text-slate-900">
                <span>TOTAL:</span>
                <span>Rp {order.total_amount.toLocaleString('id-ID')}</span>
              </div>

              {/* Payment Detail */}
              {payment && (
                <div className="pt-2 border-t border-dashed border-slate-400 space-y-0.5 text-[10px]">
                  <div className="flex justify-between text-slate-800">
                    <span className="uppercase font-bold">Bayar ({payment.method}):</span>
                    <span>Rp {payment.amount.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between text-slate-800">
                    <span>Kembali:</span>
                    <span>Rp {payment.change_amount.toLocaleString('id-ID')}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Receipt Footer */}
            <div className="text-center pt-2 border-t border-dashed border-slate-400 text-[10px] text-slate-600">
              <p>{settings.receipt_footer}</p>
              <p className="text-[9px] text-slate-400 mt-1">~ Terima Kasih ~</p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-[#232d42] bg-[#0f172a] flex items-center justify-between gap-3">
          <button
            onClick={handleClose}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-[#232d42] bg-[#151c2c] text-slate-300 hover:text-white font-semibold text-xs transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Transaksi Baru</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-cyan-500/20 transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Struk</span>
          </button>
        </div>
      </div>
    </div>
  );
};
