import React, { useEffect, useState } from 'react';
import { repository } from '../services/indexedDBRepository';
import { Order, OrderItem, Payment } from '../types';
import { usePOSStore } from '../store/usePOSStore';
import {
  Receipt,
  Search,
  Eye,
  RotateCcw,
  Printer,
  X,
  AlertTriangle,
  User,
  Calendar
} from 'lucide-react';

export const OrdersPage: React.FC = () => {
  const { setLastCompletedOrder, setReceiptModalOpen, showToast, fetchMasterData, showConfirm } = usePOSStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<{
    order: Order;
    items: OrderItem[];
    payment?: Payment;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadOrders = async () => {
    setIsLoading(true);
    try {
      const data = await repository.getOrders();
      setOrders(data);
    } catch (err) {
      console.error('Failed to load orders history:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleViewDetails = async (orderId: number) => {
    const details = await repository.getOrderDetails(orderId);
    if (details) {
      setSelectedOrderDetails(details);
    }
  };

  const handleVoidOrder = (orderId: number) => {
    showConfirm({
      title: 'Pembatalan Transaksi (Void)',
      message: 'Apakah Anda yakin ingin membatalkan transaksi ini? Stok barang yang terjual akan dikembalikan otomatis ke inventaris warung.',
      type: 'danger',
      confirmText: 'Ya, Batalkan Transaksi',
      cancelText: 'Kembali',
      onConfirm: async () => {
        try {
          await repository.voidOrder(orderId);
          showToast('Transaksi berhasil dibatalkan dan stok telah dikembalikan!', 'success');
          await loadOrders();
          await fetchMasterData();
          setSelectedOrderDetails(null);
        } catch (err) {
          console.error(err);
          showToast('Gagal membatalkan transaksi', 'error');
        }
      }
    });
  };

  const handleReprintReceipt = (order: Order) => {
    setLastCompletedOrder(order);
    setReceiptModalOpen(true);
  };

  const filteredOrders = orders.filter((o) => {
    const q = searchQuery.toLowerCase().trim();
    return (
      !q ||
      o.order_number.toLowerCase().includes(q) ||
      (o.customer_name && o.customer_name.toLowerCase().includes(q))
    );
  });

  return (
    <div className="flex-1 overflow-y-auto p-3.5 sm:p-6 bg-[#0b0f19] space-y-4 sm:space-y-6 h-[calc(100vh-4rem)] pb-28 ipad:pb-6 select-none">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
            <Receipt className="w-5 h-5 text-cyan-400" />
            Riwayat Nota & Transaksi
          </h1>
          <p className="text-xs text-slate-400">Daftar seluruh nota penjualan, pembatalan (void), dan cetak ulang struk</p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari no. nota / pelanggan..."
            className="w-full bg-[#151c2c] border border-[#232d42] rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* 1. MOBILE VIEW (< 768px): Responsive Order Cards */}
      <div className="block md:hidden space-y-3">
        {filteredOrders.length === 0 ? (
          <div className="glass-panel p-8 rounded-2xl border border-[#232d42] text-center text-slate-500 text-xs">
            Tidak ada riwayat transaksi ditemukan
          </div>
        ) : (
          filteredOrders.map((order) => {
            const isCancelled = order.status === 'cancelled';
            return (
              <div
                key={order.id}
                className="bg-[#151c2c] border border-[#232d42] rounded-2xl p-4 space-y-3 shadow-lg"
              >
                {/* Header Row: Order Number & Status */}
                <div className="flex items-center justify-between pb-2 border-b border-[#232d42]">
                  <span className="font-mono font-extrabold text-xs text-cyan-400">
                    {order.order_number}
                  </span>
                  {isCancelled ? (
                    <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold text-[10px]">
                      Void / Batal
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold text-[10px]">
                      Selesai
                    </span>
                  )}
                </div>

                {/* Details Row: Customer Name & Date */}
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-slate-300 font-medium">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>{order.customer_name || 'Pelanggan Umum'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    <span>{new Date(order.created_at).toLocaleString('id-ID')}</span>
                  </div>
                </div>

                {/* Total & Action Row */}
                <div className="flex items-center justify-between pt-2 border-t border-[#232d42]/60">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Total Tagihan</span>
                    <span className="font-extrabold text-sm text-white font-mono">
                      Rp {order.total_amount.toLocaleString('id-ID')}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleViewDetails(order.id!)}
                      className="px-3 py-2 rounded-xl bg-[#0b0f19] hover:bg-[#232d42] border border-[#232d42] text-slate-300 text-xs font-semibold flex items-center gap-1 transition-all active:scale-95"
                    >
                      <Eye className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Detail</span>
                    </button>

                    {!isCancelled && (
                      <button
                        onClick={() => handleReprintReceipt(order)}
                        className="px-3 py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 text-xs font-bold flex items-center gap-1 transition-all active:scale-95"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Cetak</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 2. TABLET & DESKTOP VIEW (>= 768px): Full HTML Table */}
      <div className="hidden md:block glass-panel rounded-2xl border border-[#232d42] overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#151c2c] text-slate-400 font-semibold border-b border-[#232d42]">
              <tr>
                <th className="p-4">No. Struk Nota</th>
                <th className="p-4">Nama Pelanggan</th>
                <th className="p-4">Tanggal & Waktu</th>
                <th className="p-4">Total Pembayaran</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#232d42]/60 text-slate-300">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    Tidak ada riwayat transaksi ditemukan
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const isCancelled = order.status === 'cancelled';
                  return (
                    <tr key={order.id} className="hover:bg-[#151c2c]/50 transition-all">
                      <td className="p-4 font-mono font-bold text-cyan-400">{order.order_number}</td>
                      <td className="p-4 font-medium text-white">{order.customer_name || 'Pelanggan Umum'}</td>
                      <td className="p-4 text-slate-400">
                        {new Date(order.created_at).toLocaleString('id-ID')}
                      </td>
                      <td className="p-4 font-extrabold text-white">
                        Rp {order.total_amount.toLocaleString('id-ID')}
                      </td>
                      <td className="p-4">
                        {isCancelled ? (
                          <span className="px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold text-[10px]">
                            Dibatalkan (Void)
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold text-[10px]">
                            Selesai
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-right space-x-2">
                        <button
                          onClick={() => handleViewDetails(order.id!)}
                          className="px-3 py-1.5 rounded-lg bg-[#151c2c] hover:bg-slate-700 border border-[#232d42] text-slate-300 text-[11px] font-medium transition-all"
                        >
                          <Eye className="w-3.5 h-3.5 inline mr-1" />
                          Detail
                        </button>
                        {!isCancelled && (
                          <button
                            onClick={() => handleReprintReceipt(order)}
                            className="px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 text-[11px] font-medium transition-all"
                          >
                            <Printer className="w-3.5 h-3.5 inline mr-1" />
                            Cetak
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Order Detail Modal */}
      {selectedOrderDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#151c2c] border border-[#232d42] rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col">
            <div className="p-4 border-b border-[#232d42] flex items-center justify-between bg-[#0f172a]">
              <div>
                <h3 className="font-bold text-sm text-white">Detail Transaksi {selectedOrderDetails.order.order_number}</h3>
                <p className="text-xs text-slate-400">{new Date(selectedOrderDetails.order.created_at).toLocaleString('id-ID')}</p>
              </div>
              <button
                onClick={() => setSelectedOrderDetails(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-[#232d42]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto max-h-[70vh] bg-[#0b0f19]">
              <div className="space-y-2 border-b border-[#232d42] pb-3">
                {selectedOrderDetails.items.map((item, i) => (
                  <div key={i} className="flex justify-between items-center text-xs">
                    <div>
                      <p className="font-semibold text-white">{item.product_name}</p>
                      <p className="text-[11px] text-slate-400">{item.quantity} x Rp {item.unit_price.toLocaleString('id-ID')}</p>
                    </div>
                    <span className="font-bold text-cyan-400">Rp {item.subtotal.toLocaleString('id-ID')}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-1 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Subtotal:</span>
                  <span>Rp {selectedOrderDetails.order.subtotal.toLocaleString('id-ID')}</span>
                </div>
                {selectedOrderDetails.order.discount_amount > 0 && (
                  <div className="flex justify-between text-rose-400">
                    <span>Diskon:</span>
                    <span>-Rp {selectedOrderDetails.order.discount_amount.toLocaleString('id-ID')}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-sm text-white border-t border-[#232d42] pt-2">
                  <span>TOTAL:</span>
                  <span className="text-cyan-400">Rp {selectedOrderDetails.order.total_amount.toLocaleString('id-ID')}</span>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-[#232d42] bg-[#0f172a] flex justify-between items-center">
              {selectedOrderDetails.order.status !== 'cancelled' ? (
                <button
                  onClick={() => handleVoidOrder(selectedOrderDetails.order.id!)}
                  className="px-4 py-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 text-rose-400 font-bold text-xs flex items-center gap-1.5"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Batalkan Transaksi (Void)</span>
                </button>
              ) : (
                <span className="text-xs text-rose-400 font-bold flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4" /> Transaksi Dibatalkan
                </span>
              )}

              <button
                onClick={() => setSelectedOrderDetails(null)}
                className="px-4 py-2.5 rounded-xl border border-[#232d42] text-slate-400 hover:text-white text-xs font-medium"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
