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

  const loadOrders = async () => {
    try {
      const data = await repository.getOrders();
      setOrders(data);
    } catch (err) {
      console.error('Failed to load orders history:', err);
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
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#FAF7F2] space-y-4 sm:space-y-6 h-[calc(100vh-4rem)] pb-28 ipad:pb-6">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-[#2A2622] flex items-center gap-2">
            <Receipt className="w-5 h-5 text-[#D97706]" />
            Riwayat Nota & Transaksi
          </h1>
          <p className="text-xs text-[#8A8175]">Daftar seluruh nota penjualan, pembatalan (void), dan cetak ulang struk</p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-[#8A8175] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari no. nota / pelanggan..."
            className="w-full bg-white border border-[#E8E2D8] rounded-xl pl-9 pr-4 py-2 text-xs text-[#2A2622] placeholder-[#8A8175] focus:outline-none focus:border-[#D97706]"
          />
        </div>
      </div>

      {/* MOBILE VIEW (< 768px): Cards */}
      <div className="block md:hidden space-y-3">
        {filteredOrders.length === 0 ? (
          <div className="paper-panel p-8 rounded-xl border border-[#E8E2D8] text-center text-[#8A8175] text-xs">
            Tidak ada riwayat transaksi ditemukan
          </div>
        ) : (
          filteredOrders.map((order) => {
            const isCancelled = order.status === 'cancelled';
            return (
              <div
                key={order.id}
                className="bg-white border border-[#E8E2D8] rounded-xl p-4 space-y-3 shadow-sm"
              >
                <div className="flex items-center justify-between pb-2 border-b border-[#E8E2D8]">
                  <span className="font-bold text-xs text-[#D97706]">
                    {order.order_number}
                  </span>
                  {isCancelled ? (
                    <span className="px-2 py-0.5 rounded-[6px] bg-[#B84B3E] text-white font-bold text-[10px]">
                      Void / Batal
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-[6px] bg-[#3F7D4F] text-white font-bold text-[10px]">
                      Selesai
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-[#2A2622] font-semibold">
                    <User className="w-3.5 h-3.5 text-[#8A8175]" />
                    <span>{order.customer_name || 'Pelanggan Umum'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[#8A8175] text-[11px]">
                    <Calendar className="w-3.5 h-3.5 text-[#8A8175]" />
                    <span>{new Date(order.created_at).toLocaleString('id-ID')}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[#E8E2D8]">
                  <div>
                    <span className="text-[10px] text-[#8A8175] block font-medium">Total Tagihan</span>
                    <span className="font-bold text-sm text-[#2A2622]">
                      Rp {order.total_amount.toLocaleString('id-ID')}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleViewDetails(order.id!)}
                      className="px-3 py-2 rounded-xl bg-[#FAF7F2] hover:bg-[#E8E2D8] border border-[#E8E2D8] text-[#2A2622] text-xs font-semibold flex items-center gap-1 transition-all"
                    >
                      <Eye className="w-3.5 h-3.5 text-[#D97706]" />
                      <span>Detail</span>
                    </button>

                    {!isCancelled && (
                      <button
                        onClick={() => handleReprintReceipt(order)}
                        className="px-3 py-2 rounded-xl bg-[#FEF3C7] hover:bg-[#D97706] hover:text-white border border-[#D97706]/30 text-[#D97706] text-xs font-bold flex items-center gap-1 transition-all"
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

      {/* TABLET & DESKTOP VIEW (>= 768px): Full Table */}
      <div className="hidden md:block paper-panel rounded-xl border border-[#E8E2D8] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF7F2] text-[#8A8175] font-bold border-b border-[#E8E2D8]">
              <tr>
                <th className="p-4">No. Struk Nota</th>
                <th className="p-4">Nama Pelanggan</th>
                <th className="p-4">Tanggal & Waktu</th>
                <th className="p-4">Total Pembayaran</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E2D8] text-[#2A2622]">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-[#8A8175]">
                    Tidak ada riwayat transaksi ditemukan
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const isCancelled = order.status === 'cancelled';
                  return (
                    <tr key={order.id} className="hover:bg-[#FAF7F2] transition-all">
                      <td className="p-4 font-bold text-[#D97706]">{order.order_number}</td>
                      <td className="p-4 font-semibold text-[#2A2622]">{order.customer_name || 'Pelanggan Umum'}</td>
                      <td className="p-4 text-[#8A8175]">
                        {new Date(order.created_at).toLocaleString('id-ID')}
                      </td>
                      <td className="p-4 font-bold text-[#2A2622]">
                        Rp {order.total_amount.toLocaleString('id-ID')}
                      </td>
                      <td className="p-4">
                        {isCancelled ? (
                          <span className="px-2.5 py-1 rounded-[6px] bg-[#B84B3E] text-white font-bold text-[10px]">
                            Dibatalkan (Void)
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-[6px] bg-[#3F7D4F] text-white font-bold text-[10px]">
                            Selesai
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-right space-x-2">
                        <button
                          onClick={() => handleViewDetails(order.id!)}
                          className="px-3 py-1.5 rounded-lg bg-[#FAF7F2] hover:bg-[#E8E2D8] border border-[#E8E2D8] text-[#2A2622] text-[11px] font-medium transition-all"
                        >
                          <Eye className="w-3.5 h-3.5 inline mr-1 text-[#D97706]" />
                          Detail
                        </button>
                        {!isCancelled && (
                          <button
                            onClick={() => handleReprintReceipt(order)}
                            className="px-3 py-1.5 rounded-lg bg-[#FEF3C7] hover:bg-[#D97706] hover:text-white border border-[#D97706]/30 text-[#D97706] text-[11px] font-bold transition-all"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white border border-[#E8E2D8] rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col">
            <div className="p-4 border-b border-[#E8E2D8] flex items-center justify-between bg-[#FAF7F2]">
              <div>
                <h3 className="font-bold text-sm text-[#2A2622]">Detail Transaksi {selectedOrderDetails.order.order_number}</h3>
                <p className="text-xs text-[#8A8175]">{new Date(selectedOrderDetails.order.created_at).toLocaleString('id-ID')}</p>
              </div>
              <button
                onClick={() => setSelectedOrderDetails(null)}
                className="p-1.5 rounded-xl text-[#8A8175] hover:text-[#2A2622] bg-white border border-[#E8E2D8]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto max-h-[70vh] bg-white">
              <div className="space-y-2 border-b border-[#E8E2D8] pb-3">
                {selectedOrderDetails.items.map((item, i) => (
                  <div key={i} className="flex justify-between items-center text-xs">
                    <div>
                      <p className="font-semibold text-[#2A2622]">{item.product_name}</p>
                      <p className="text-[11px] text-[#8A8175]">{item.quantity} x Rp {item.unit_price.toLocaleString('id-ID')}</p>
                    </div>
                    <span className="font-bold text-[#D97706]">Rp {item.subtotal.toLocaleString('id-ID')}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-1 text-xs">
                <div className="flex justify-between text-[#8A8175]">
                  <span>Subtotal:</span>
                  <span className="font-semibold text-[#2A2622]">Rp {selectedOrderDetails.order.subtotal.toLocaleString('id-ID')}</span>
                </div>
                {selectedOrderDetails.order.discount_amount > 0 && (
                  <div className="flex justify-between text-[#B84B3E]">
                    <span>Diskon:</span>
                    <span className="font-semibold">-Rp {selectedOrderDetails.order.discount_amount.toLocaleString('id-ID')}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-sm text-[#2A2622] border-t border-[#E8E2D8] pt-2">
                  <span>TOTAL:</span>
                  <span className="text-[#D97706]">Rp {selectedOrderDetails.order.total_amount.toLocaleString('id-ID')}</span>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-[#E8E2D8] bg-[#FAF7F2] flex justify-between items-center">
              {selectedOrderDetails.order.status !== 'cancelled' ? (
                <button
                  onClick={() => handleVoidOrder(selectedOrderDetails.order.id!)}
                  className="px-4 py-2.5 rounded-xl bg-[#FDF2F0] hover:bg-[#B84B3E] text-[#B84B3E] hover:text-white border border-[#B84B3E]/30 font-bold text-xs flex items-center gap-1.5 transition-all"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Batalkan Transaksi (Void)</span>
                </button>
              ) : (
                <span className="text-xs text-[#B84B3E] font-bold flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4" /> Transaksi Dibatalkan
                </span>
              )}

              <button
                onClick={() => setSelectedOrderDetails(null)}
                className="px-4 py-2.5 rounded-xl border border-[#E8E2D8] bg-white text-[#8A8175] hover:text-[#2A2622] text-xs font-semibold"
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
