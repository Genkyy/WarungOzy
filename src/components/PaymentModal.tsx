import React, { useState } from 'react';
import { usePOSStore } from '../store/usePOSStore';
import { repository } from '../services/indexedDBRepository';
import { X, Banknote, QrCode, Wallet, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';

import { formatRupiah, parseRupiah } from '../utils/formatCurrency';

export const PaymentModal: React.FC = () => {
  const {
    isPaymentModalOpen,
    setPaymentModalOpen,
    cart,
    discountValue,
    discountType,
    taxRate,
    customerName,
    orderNotes,
    clearCart,
    setLastCompletedOrder,
    setReceiptModalOpen,
    showToast,
    fetchMasterData,
    settings
  } = usePOSStore();

  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'qris' | 'ewallet'>('cash');
  const [cashAmountInput, setCashAmountInput] = useState<string>('');
  const [refNumber, setRefNumber] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isPaymentModalOpen) return null;

  // Calculate Subtotal, Tax, Discount, Total
  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  const discountAmount =
    discountType === 'percent'
      ? Math.round((subtotal * discountValue) / 100)
      : discountValue;

  const taxableAmount = Math.max(0, subtotal - discountAmount);
  const taxAmount = Math.round((taxableAmount * taxRate) / 100);
  const totalAmount = taxableAmount + taxAmount;

  const cashGiven = paymentMethod === 'cash' ? parseRupiah(cashAmountInput) : totalAmount;
  const changeAmount = Math.max(0, cashGiven - totalAmount);
  const isCashInsufficient = paymentMethod === 'cash' && cashGiven < totalAmount;

  const handleQuickCash = (amount: number) => {
    setCashAmountInput(formatRupiah(amount, false));
  };

  const handleProcessPayment = async () => {
    if (isCashInsufficient) {
      showToast('Uang tunai yang diserahkan kurang dari total tagihan!', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const orderData = {
        customer_name: customerName,
        order_type: 'retail' as const,
        items: cart.map((item) => ({
          menu_item_id: item.product.id!,
          quantity: item.quantity,
          unit_price: item.product.price,
          notes: item.notes || ''
        })),
        tax_amount: taxAmount,
        discount_amount: discountAmount,
        notes: orderNotes,
        payment: {
          method: paymentMethod,
          amount: cashGiven,
          reference_number: refNumber
        }
      };

      const completedOrder = await repository.createOrder(orderData);

      // Trigger Confetti Celebration FX
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });

      // Refresh master data to reflect updated product stocks
      await fetchMasterData();

      setLastCompletedOrder(completedOrder);
      clearCart();
      setPaymentModalOpen(false);
      setReceiptModalOpen(true);
      showToast('Transaksi Berhasil Disimpan!', 'success');
    } catch (err) {
      console.error('Payment Error:', err);
      showToast('Gagal memproses transaksi', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white border border-[#E8E2D8] rounded-t-2xl sm:rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#E8E2D8] flex items-center justify-between bg-[#FAF7F2]">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-[#2A2622] flex items-center gap-2">
              <Banknote className="w-5 h-5 text-[#D97706]" />
              Pembayaran & Settlement Transaksi
            </h2>
            <p className="text-xs text-[#8A8175]">Total Tagihan: <span className="text-[#D97706] font-bold">Rp {totalAmount.toLocaleString('id-ID')}</span></p>
          </div>
          <button
            onClick={() => setPaymentModalOpen(false)}
            className="p-2 rounded-xl text-[#8A8175] hover:text-[#2A2622] bg-white border border-[#E8E2D8] transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 overflow-y-auto flex-1 bg-white">
          {/* Payment Method Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#8A8175] mb-2.5">
              Metode Pembayaran
            </label>
            <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
              {[
                { id: 'cash', label: 'Tunai / Cash', icon: Banknote },
                { id: 'qris', label: 'QRIS', icon: QrCode },
                { id: 'ewallet', label: 'E-Wallet', icon: Wallet },
              ].map((m) => {
                const Icon = m.icon;
                const isSelected = paymentMethod === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      setPaymentMethod(m.id as any);
                      if (m.id === 'cash' && !cashAmountInput) {
                        setCashAmountInput(formatRupiah(totalAmount, false));
                      }
                    }}
                    className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 text-center transition-all min-h-[68px] ${
                      isSelected
                        ? 'bg-[#FEF3C7] border-[#D97706] text-[#D97706] font-bold shadow-sm'
                        : 'bg-[#FAF7F2] border-[#E8E2D8] text-[#8A8175] hover:text-[#2A2622]'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-xs">{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Cash Payment Details */}
          {paymentMethod === 'cash' && (
            <div className="space-y-3.5 bg-[#FAF7F2] p-4 rounded-xl border border-[#E8E2D8]">
              <div>
                <label className="block text-xs font-semibold text-[#2A2622] mb-1.5">
                  Nominal Uang Diserahkan (Rp)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8A8175] font-bold text-sm">
                    Rp
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={cashAmountInput}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/\D/g, '');
                      setCashAmountInput(raw ? formatRupiah(raw, false) : '');
                    }}
                    placeholder="0"
                    className="w-full bg-white border border-[#E8E2D8] rounded-xl pl-10 pr-4 py-3 text-base sm:text-lg font-bold text-[#2A2622] focus:outline-none focus:border-[#D97706] select-text"
                    autoFocus
                  />
                </div>
              </div>

              {/* Quick Cash Presets */}
              <div>
                <label className="block text-[11px] text-[#8A8175] mb-1.5 font-medium">Nominal Cepat:</label>
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickCash(totalAmount)}
                    className="px-3 py-2 bg-[#D97706] text-white font-bold text-xs rounded-xl shadow-sm hover:bg-[#B45309] transition-all min-h-[38px]"
                  >
                    Uang Pas (Rp {totalAmount.toLocaleString('id-ID')})
                  </button>
                  {[10000, 20000, 50000, 100000, 200000].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => handleQuickCash(preset)}
                      className="px-3 py-2 bg-white hover:bg-[#E8E2D8] border border-[#E8E2D8] text-[#2A2622] font-semibold text-xs rounded-xl transition-all min-h-[38px]"
                    >
                      Rp {preset.toLocaleString('id-ID')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Kembalian Banner */}
              <div className={`p-3.5 rounded-xl border ${
                isCashInsufficient
                  ? 'bg-[#FDF2F0] border-[#B84B3E]/30 text-[#B84B3E]'
                  : 'bg-[#F0F7F2] border-[#3F7D4F]/30 text-[#3F7D4F]'
              }`}>
                <div className="flex justify-between items-center">
                  <span className="text-xs uppercase font-bold tracking-wider">
                    {isCashInsufficient ? 'Kurang Bayar' : 'Uang Kembalian'}
                  </span>
                  <span className="text-lg sm:text-xl font-extrabold">
                    Rp {Math.abs(changeAmount).toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* QRIS / E-Wallet Reference Input & Display */}
          {(paymentMethod === 'qris' || paymentMethod === 'ewallet') && (
            <div className="space-y-3 bg-[#FAF7F2] p-4 rounded-xl border border-[#E8E2D8]">
              {paymentMethod === 'qris' && (
                <div className="flex flex-col items-center justify-center p-3.5 bg-white rounded-xl text-[#2A2622] text-center border border-[#E8E2D8] space-y-2">
                  {settings.qris_image_url ? (
                    <div className="w-48 h-48 bg-white border-2 border-[#2A2622] rounded-xl flex items-center justify-center p-1.5 overflow-hidden shadow-sm">
                      <img src={settings.qris_image_url} alt="QRIS Warung" className="w-full h-full object-contain" />
                    </div>
                  ) : (
                    <div className="w-36 h-36 bg-white border-2 border-[#2A2622] rounded-lg flex items-center justify-center p-1.5 shadow-sm">
                      <QrCode className="w-28 h-28 text-[#2A2622]" />
                    </div>
                  )}
                  <p className="text-xs font-bold uppercase tracking-wider text-[#2A2622]">Scan QRIS {settings.outlet_name || 'Warung Ozy'}</p>
                  <p className="text-[10px] text-[#8A8175]">BCA, Mandiri, GoPay, OVO, DANA, ShopeePay, Mobile Banking</p>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-[#2A2622] mb-1.5">
                  Nomor Referensi Transaksi (Opsional)
                </label>
                <input
                  type="text"
                  value={refNumber}
                  onChange={(e) => setRefNumber(e.target.value)}
                  placeholder="Misal: 9921408..."
                  className="w-full bg-white border border-[#E8E2D8] rounded-xl px-3.5 py-2.5 text-xs text-[#2A2622] focus:outline-none focus:border-[#D97706]"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer Payment Action (Solid Amber Primary Button per desain.md 5.2) */}
        <div className="p-4 border-t border-[#E8E2D8] bg-[#FAF7F2] flex items-center justify-between gap-3">
          <div>
            <span className="text-[10px] text-[#8A8175] block font-medium">Total Akhir Tagihan</span>
            <span className="text-base sm:text-lg font-black text-[#D97706]">Rp {totalAmount.toLocaleString('id-ID')}</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => setPaymentModalOpen(false)}
              className="px-4 py-2.5 rounded-xl border border-[#E8E2D8] bg-white text-[#8A8175] hover:text-[#2A2622] font-semibold text-xs transition-all min-h-[44px]"
            >
              Batal
            </button>
            <button
              type="button"
              disabled={isSubmitting || isCashInsufficient}
              onClick={handleProcessPayment}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#D97706] hover:bg-[#B45309] text-white font-extrabold text-xs sm:text-sm shadow-md disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95 min-h-[44px]"
            >
              <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>{isSubmitting ? 'Memproses...' : 'SELESAIKAN'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
