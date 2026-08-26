import React, { useEffect, useState } from 'react';
import { usePOSStore } from '../store/usePOSStore';
import { repository } from '../services/supabaseRepository';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn select-none">
      <div className="bg-white border border-[#E8E2D8] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-[#E8E2D8] flex items-center justify-between bg-[#FAF7F2]">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-[#3F7D4F]" />
            <h2 className="text-sm font-bold text-[#2A2622]">Struk Pembelian Warung</h2>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-xl text-[#8A8175] hover:text-[#2A2622] bg-white border border-[#E8E2D8]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Thermal Receipt Printable Container */}
        <div className="p-6 overflow-y-auto flex-1 flex justify-center bg-[#FAF7F2]">
          <div
            id="thermal-receipt-printable"
            className="w-full max-w-[280px] bg-white text-[#2A2622] p-4 font-mono text-xs shadow-md rounded border border-[#E8E2D8]"
          >
            {/* Store Title Header */}
            <div className="text-center pb-3 mb-3 border-b border-dashed border-[#8A8175]">
              <h1 className="font-bold text-sm uppercase tracking-wider text-[#2A2622]">{settings.outlet_name}</h1>
              <p className="text-[10px] text-[#8A8175]">KasirKu POS Kelontong</p>
              <p className="text-[10px] text-[#8A8175] mt-1">Nota: {order.order_number}</p>
              <p className="text-[10px] text-[#8A8175]">{new Date(order.created_at).toLocaleString('id-ID')}</p>
            </div>

            {/* Customer Info */}
            <div className="mb-3 text-[10px] space-y-0.5 border-b border-dashed border-[#8A8175] pb-2 text-[#2A2622]">
              <div className="flex justify-between">
                <span>Pelanggan:</span>
                <span className="font-bold text-[#2A2622]">{order.customer_name || 'Umum'}</span>
              </div>
              <div className="flex justify-between">
                <span>Kasir:</span>
                <span className="font-bold text-[#2A2622]">Ozy</span>
              </div>
            </div>

            {/* Items List */}
            <div className="space-y-1.5 mb-3 border-b border-dashed border-[#8A8175] pb-3">
              {items.map((item, idx) => (
                <div key={idx} className="text-[11px]">
                  <div className="font-bold text-[#2A2622] truncate">{item.product_name}</div>
                  <div className="flex justify-between text-[#8A8175] pl-2">
                    <span>{item.quantity} x Rp {item.unit_price.toLocaleString('id-ID')}</span>
                    <span className="font-bold text-[#2A2622]">Rp {item.subtotal.toLocaleString('id-ID')}</span>
                  </div>
                  {item.notes && <div className="text-[9px] text-[#8A8175] italic pl-2">({item.notes})</div>}
                </div>
              ))}
            </div>

            {/* Totals Summary */}
            <div className="space-y-1 text-[11px] mb-4 text-[#2A2622]">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>Rp {order.subtotal.toLocaleString('id-ID')}</span>
              </div>
              {order.discount_amount > 0 && (
                <div className="flex justify-between text-[#B84B3E] font-semibold">
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
              <div className="flex justify-between font-bold text-sm border-t border-[#2A2622] pt-1.5 mt-1 text-[#2A2622]">
                <span>TOTAL:</span>
                <span>Rp {order.total_amount.toLocaleString('id-ID')}</span>
              </div>

              {/* Payment Detail */}
              {payment && (
                <div className="pt-2 border-t border-dashed border-[#8A8175] space-y-0.5 text-[10px]">
                  <div className="flex justify-between text-[#2A2622]">
                    <span className="uppercase font-bold">Bayar ({payment.method}):</span>
                    <span>Rp {payment.amount.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between text-[#2A2622]">
                    <span>Kembali:</span>
                    <span>Rp {payment.change_amount.toLocaleString('id-ID')}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Receipt Footer */}
            <div className="text-center pt-2 border-t border-dashed border-[#8A8175] text-[10px] text-[#8A8175]">
              <p>{settings.receipt_footer}</p>
              <p className="text-[9px] text-[#8A8175] mt-1">~ Terima Kasih ~</p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-[#E8E2D8] bg-[#FAF7F2] flex items-center justify-between gap-3">
          <button
            onClick={handleClose}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-[#E8E2D8] bg-white text-[#8A8175] hover:text-[#2A2622] font-semibold text-xs transition-all min-h-[44px]"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Transaksi Baru</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-[#D97706] hover:bg-[#B45309] text-white font-bold text-xs shadow-sm transition-all min-h-[44px]"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Struk</span>
          </button>
        </div>
      </div>
    </div>
  );
};
