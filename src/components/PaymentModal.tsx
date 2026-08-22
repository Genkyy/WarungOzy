import React, { useState } from 'react';
import { usePOSStore } from '../store/usePOSStore';
import { repository } from '../services/indexedDBRepository';
import { X, Banknote, QrCode, Wallet, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';

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
    fetchMasterData
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

  const cashGiven = paymentMethod === 'cash' ? parseFloat(cashAmountInput) || 0 : totalAmount;
  const changeAmount = Math.max(0, cashGiven - totalAmount);
  const isCashInsufficient = paymentMethod === 'cash' && cashGiven < totalAmount;

  const handleQuickCash = (amount: number) => {
    setCashAmountInput(amount.toString());
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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn select-none">
      <div className="bg-[#151c2c] border border-[#232d42] rounded-t-3xl sm:rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#232d42] flex items-center justify-between bg-[#0f172a]">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <Banknote className="w-5 h-5 text-cyan-400" />
              Pembayaran & Settlement
            </h2>
            <p className="text-xs text-slate-400">Total Tagihan: <span className="text-cyan-400 font-bold font-mono">Rp {totalAmount.toLocaleString('id-ID')}</span></p>
          </div>
          <button
            onClick={() => setPaymentModalOpen(false)}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-[#232d42] transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 overflow-y-auto flex-1">
          {/* Payment Method Selector (Strictly 3 methods: Cash, QRIS, E-Wallet) */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2.5">
              Pilih Metode Pembayaran
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
                        setCashAmountInput(totalAmount.toString());
                      }
                    }}
                    className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 text-center transition-all min-h-[68px] ${
                      isSelected
                        ? 'bg-cyan-500/10 border-cyan-500 text-cyan-400 shadow-md shadow-cyan-500/10 font-bold ring-1 ring-cyan-400'
                        : 'bg-[#1e293b]/50 border-[#232d42] text-slate-400 hover:border-slate-600 hover:text-slate-200'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-[11px]">{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Cash Payment Details */}
          {paymentMethod === 'cash' && (
            <div className="space-y-3.5 bg-[#1e293b]/40 p-3.5 sm:p-4 rounded-xl border border-[#232d42]">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Nominal Uang Diserahkan (Rp)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-sm">
                    Rp
                  </span>
                  <input
                    type="number"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={cashAmountInput}
                    onChange={(e) => setCashAmountInput(e.target.value)}
                    placeholder="Masukkan nominal..."
                    className="w-full bg-[#151c2c] border border-[#232d42] rounded-xl pl-10 pr-4 py-2.5 sm:py-3 text-base sm:text-lg font-bold text-white focus:outline-none focus:border-cyan-500 font-mono"
                    autoFocus
                  />
                </div>
              </div>

              {/* Quick Cash Presets */}
              <div>
                <label className="block text-[10px] sm:text-[11px] text-slate-400 mb-1.5 font-medium">Nominal Cepat:</label>
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickCash(totalAmount)}
                    className="px-3 py-2 bg-[#232d42] hover:bg-cyan-600 hover:text-white border border-slate-700 text-cyan-400 font-semibold text-xs rounded-xl transition-all min-h-[38px]"
                  >
                    Uang Pas (Rp {totalAmount.toLocaleString('id-ID')})
                  </button>
                  {[10000, 20000, 50000, 100000, 200000].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => handleQuickCash(preset)}
                      className="px-3 py-2 bg-[#151c2c] hover:bg-slate-700 border border-[#232d42] text-slate-300 font-medium text-xs rounded-xl transition-all font-mono min-h-[38px]"
                    >
                      Rp {preset.toLocaleString('id-ID')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Kembalian Banner */}
              <div className={`p-3.5 rounded-xl border ${
                isCashInsufficient
                  ? 'bg-rose-950/30 border-rose-500/30 text-rose-400'
                  : 'bg-emerald-950/30 border-emerald-500/30 text-emerald-400'
              }`}>
                <div className="flex justify-between items-center">
                  <span className="text-xs uppercase font-bold tracking-wider">
                    {isCashInsufficient ? 'Kurang Bayar' : 'Uang Kembalian'}
                  </span>
                  <span className="text-lg sm:text-xl font-black font-mono">
                    Rp {Math.abs(changeAmount).toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* QRIS / E-Wallet Reference Input & Display */}
          {(paymentMethod === 'qris' || paymentMethod === 'ewallet') && (
            <div className="space-y-3 bg-[#1e293b]/40 p-4 rounded-xl border border-[#232d42]">
              {paymentMethod === 'qris' && (
                <div className="flex flex-col items-center justify-center p-3.5 bg-white rounded-xl text-slate-900 text-center">
                  <div className="w-36 h-36 bg-slate-100 border-2 border-slate-900 rounded-lg flex items-center justify-center p-1.5">
                    <QrCode className="w-28 h-28 text-slate-900" />
                  </div>
                  <p className="mt-1.5 text-xs font-bold uppercase tracking-wider text-slate-700">Scan QRIS Warung Ozy</p>
                  <p className="text-[10px] text-slate-500">BCA, Mandiri, GoPay, OVO, DANA, ShopeePay</p>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Nomor Referensi Transaksi (Opsional)
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={refNumber}
                  onChange={(e) => setRefNumber(e.target.value)}
                  placeholder="Misal: 9921408..."
                  className="w-full bg-[#151c2c] border border-[#232d42] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer Payment Action */}
        <div className="p-4 border-t border-[#232d42] bg-[#0f172a] flex items-center justify-between gap-3">
          <div>
            <span className="text-[10px] text-slate-400 block font-medium">Total Akhir Tagihan</span>
            <span className="text-base sm:text-lg font-black text-white font-mono">Rp {totalAmount.toLocaleString('id-ID')}</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => setPaymentModalOpen(false)}
              className="px-3.5 py-2.5 rounded-xl border border-[#232d42] text-slate-400 hover:text-white font-medium text-xs transition-all min-h-[44px]"
            >
              Batal
            </button>
            <button
              type="button"
              disabled={isSubmitting || isCashInsufficient}
              onClick={handleProcessPayment}
              className="flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 min-h-[44px]"
            >
              <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>{isSubmitting ? 'Memproses...' : 'Selesaikan'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
