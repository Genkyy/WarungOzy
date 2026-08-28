import React, { useEffect, useState, useMemo } from 'react';
import { repository } from '../services/supabaseRepository';
import { Order, Expense, OrderItem } from '../types';
import { usePOSStore } from '../store/usePOSStore';
import {
  LayoutDashboard,
  DollarSign,
  ShoppingBag,
  TrendingDown,
  Sparkles,
  TrendingUp,
  Calendar,
  Trophy,
  CreditCard,
  Banknote,
  QrCode,
  Wallet
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

export const DashboardPage: React.FC = () => {
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [allExpenses, setAllExpenses] = useState<Expense[]>([]);
  const [allOrderItems, setAllOrderItems] = useState<OrderItem[]>([]);

  // Default filter preset is '7days' per desain.md section 6
  const [periodPreset, setPeriodPreset] = useState<'today' | '7days' | 'month' | 'all' | 'custom'>('7days');
  const [startDate, setStartDate] = useState<string>(() => {
    const past7 = new Date();
    past7.setDate(past7.getDate() - 6);
    return past7.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState<string>(() => new Date().toISOString().split('T')[0]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [rawOrders, rawExpenses] = await Promise.all([
          repository.getOrders('completed'),
          repository.getExpenses()
        ]);

        const orderDetailsPromises = rawOrders.map((o) => repository.getOrderDetails(o.id!));
        const orderDetailsResults = await Promise.all(orderDetailsPromises);

        const itemsAcc: OrderItem[] = [];
        orderDetailsResults.forEach((det) => {
          if (det && det.items) {
            itemsAcc.push(...det.items);
          }
        });

        setAllOrders(rawOrders);
        setAllExpenses(rawExpenses);
        setAllOrderItems(itemsAcc);
      } catch (err) {
        console.error('Failed to load dashboard analytics:', err);
      }
    };
    loadData();
  }, []);

  const handleSelectPreset = (preset: 'today' | '7days' | 'month' | 'all') => {
    setPeriodPreset(preset);
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    if (preset === 'today') {
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (preset === '7days') {
      const past7 = new Date();
      past7.setDate(now.getDate() - 6);
      setStartDate(past7.toISOString().split('T')[0]);
      setEndDate(todayStr);
    } else if (preset === 'month') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      setStartDate(firstDay.toISOString().split('T')[0]);
      setEndDate(todayStr);
    } else if (preset === 'all') {
      setStartDate('');
      setEndDate('');
    }
  };

  const filteredOrders = useMemo(() => {
    if (!startDate && !endDate) return allOrders;
    return allOrders.filter((o) => {
      const orderDateStr = o.created_at.split('T')[0];
      if (startDate && orderDateStr < startDate) return false;
      if (endDate && orderDateStr > endDate) return false;
      return true;
    });
  }, [allOrders, startDate, endDate]);

  const filteredExpenses = useMemo(() => {
    if (!startDate && !endDate) return allExpenses;
    return allExpenses.filter((e) => {
      const expenseDateStr = e.expense_date;
      if (startDate && expenseDateStr < startDate) return false;
      if (endDate && expenseDateStr > endDate) return false;
      return true;
    });
  }, [allExpenses, startDate, endDate]);

  const { products } = usePOSStore();

  // Financial Calculations
  const grossSales = filteredOrders.reduce((sum, o) => sum + o.total_amount, 0);
  const totalOrdersCount = filteredOrders.length;
  const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  // Map product id to cost_price (HPP)
  const productCostMap = useMemo(() => {
    const map: Record<string, number> = {};
    products.forEach((p) => {
      if (p.id !== undefined) map[String(p.id)] = p.cost_price || 0;
    });
    return map;
  }, [products]);

  // Real HPP & Real Gross Profit Calculation
  const totalHPP = useMemo(() => {
    return filteredOrders.reduce((totalHpp, order) => {
      const orderItems = allOrderItems.filter((item) => String(item.order_id) === String(order.id));
      if (orderItems.length > 0) {
        const orderHpp = orderItems.reduce((sum, item) => {
          const cost = productCostMap[String(item.menu_item_id)] || 0;
          return sum + (cost > 0 ? cost * item.quantity : Math.round(item.subtotal * 0.85));
        }, 0);
        return totalHpp + orderHpp;
      }
      return totalHpp + Math.round(order.subtotal * 0.85);
    }, 0);
  }, [filteredOrders, allOrderItems, productCostMap]);

  const estimatedGrossProfit = Math.max(0, grossSales - totalHPP);
  const netProfit = estimatedGrossProfit - totalExpenses;

  // Chart Data preparation (Group by Date)
  const salesByDateMap: Record<string, number> = {};
  filteredOrders.forEach((o) => {
    const dateStr = new Date(o.created_at).toLocaleDateString('id-ID', { month: 'short', day: 'numeric' });
    salesByDateMap[dateStr] = (salesByDateMap[dateStr] || 0) + o.total_amount;
  });

  const chartData = Object.keys(salesByDateMap).map((date) => ({
    date,
    Omset: salesByDateMap[date]
  }));

  // Top Selling Products Calculation
  const productSalesMap: Record<string, { name: string; qty: number; revenue: number }> = {};
  allOrderItems.forEach((item) => {
    const name = item.product_name || `Produk #${item.menu_item_id}`;
    if (!productSalesMap[name]) {
      productSalesMap[name] = { name, qty: 0, revenue: 0 };
    }
    productSalesMap[name].qty += item.quantity;
    productSalesMap[name].revenue += item.subtotal;
  });

  const topProducts = Object.values(productSalesMap)
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);

  const maxProductQty = topProducts[0]?.qty || 1;

  // Payment Breakdown
  const paymentBreakdown = { cash: 0, qris: 0, ewallet: 0 };
  filteredOrders.forEach((o) => {
    if (o.payment) {
      if (o.payment.method === 'cash') paymentBreakdown.cash += o.total_amount;
      else if (o.payment.method === 'qris') paymentBreakdown.qris += o.total_amount;
      else if (o.payment.method === 'ewallet') paymentBreakdown.ewallet += o.total_amount;
    } else {
      paymentBreakdown.cash += o.total_amount;
    }
  });

  // Rank badge styling palette for top products
  const rankStyles = [
    { bg: 'bg-[#FEF3C7]', text: 'text-[#D97706]', border: 'border-[#D97706]/40', bar: 'bg-[#D97706]' },
    { bg: 'bg-[#E6F4EA]', text: 'text-[#059669]', border: 'border-[#A7F3D0]', bar: 'bg-[#059669]' },
    { bg: 'bg-[#EFF6FF]', text: 'text-[#2563EB]', border: 'border-[#BFDBFE]', bar: 'bg-[#2563EB]' },
    { bg: 'bg-[#F0FDFA]', text: 'text-[#0D9488]', border: 'border-[#99F6E4]', bar: 'bg-[#0D9488]' },
    { bg: 'bg-[#F5F3FF]', text: 'text-[#7C3AED]', border: 'border-[#DDD6FE]', bar: 'bg-[#7C3AED]' },
  ];

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#FAF7F2] space-y-6 h-[calc(100vh-4rem)] pb-20 ipad:pb-6">
      {/* Title & Filter Bar Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-[#2A2622] flex items-center gap-2">
            <LayoutDashboard className="w-5 h-5 text-[#D97706]" />
            Dashboard Ringkasan Warung
          </h1>
          <p className="text-xs text-[#8A8175]">Analisis Laba Kotor, Omset Penjualan, & Catatan Pengeluaran Operasional</p>
        </div>

        {/* Date Presets Filter Bar */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex bg-white p-1 rounded-xl border border-[#E8E2D8] shadow-sm">
            {[
              { key: 'today', label: 'Hari Ini' },
              { key: '7days', label: '7 Hari Terakhir' },
              { key: 'month', label: 'Bulan Ini' },
              { key: 'all', label: 'Semua' },
            ].map((p) => (
              <button
                key={p.key}
                onClick={() => handleSelectPreset(p.key as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  periodPreset === p.key
                    ? 'bg-[#D97706] text-white shadow-sm'
                    : 'text-[#8A8175] hover:text-[#2A2622]'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-[#E8E2D8] text-xs shadow-sm">
            <Calendar className="w-4 h-4 text-[#8A8175]" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPeriodPreset('custom');
              }}
              className="bg-transparent text-[#2A2622] text-xs focus:outline-none"
            />
            <span className="text-[#8A8175]">-</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPeriodPreset('custom');
              }}
              className="bg-transparent text-[#2A2622] text-xs focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Top Financial Metrics Cards with Rich Color-Coded Accents (desain.md Section 6) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Metric 1: LABA KOTOR (HIGHLIGHTED CARD #1 per desain.md) */}
        <div className="paper-card bg-gradient-to-br from-[#FEF3C7] via-[#FFFBEB] to-[#FEF3C7] rounded-2xl p-4 border border-[#D97706]/40 flex flex-col justify-between shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-[#8A8175] mb-2">
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#D97706] flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 fill-[#D97706]" />
              1. Laba Kotor (Profit)
            </span>
            <div className="p-2.5 rounded-xl bg-[#D97706] text-white shadow-md shadow-[#D97706]/20">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-[#D97706]">
              Rp {estimatedGrossProfit.toLocaleString('id-ID')}
            </h2>
            <p className="text-[11px] text-[#059669] font-bold flex items-center gap-1 mt-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Est. Margin 10% Omset</span>
            </p>
          </div>
        </div>

        {/* Metric 2: Total Omset Penjualan (Royal Sapphire Blue Accent) */}
        <div className="paper-card bg-gradient-to-br from-[#EFF6FF] via-[#F8FAFC] to-[#EFF6FF] rounded-2xl p-4 border border-[#BFDBFE] flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between text-[#8A8175] mb-2">
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#1D4ED8]">Total Omset Penjualan</span>
            <div className="p-2.5 rounded-xl bg-[#2563EB] text-white shadow-md shadow-[#2563EB]/20">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-[#1D4ED8]">
              Rp {grossSales.toLocaleString('id-ID')}
            </h2>
            <p className="text-[11px] text-[#2563EB] font-bold flex items-center gap-1 mt-1">
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>{totalOrdersCount} Transaksi Selesai</span>
            </p>
          </div>
        </div>

        {/* Metric 3: Pengeluaran Operasional (Terracotta / Brick Red Accent) */}
        <div className="paper-card bg-gradient-to-br from-[#FDF2F0] via-[#FFF8F7] to-[#FDF2F0] rounded-2xl p-4 border border-[#FECACA] flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between text-[#8A8175] mb-2">
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#B84B3E]">Pengeluaran Operasional</span>
            <div className="p-2.5 rounded-xl bg-[#B84B3E] text-white shadow-md shadow-[#B84B3E]/20">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-[#B84B3E]">
              Rp {totalExpenses.toLocaleString('id-ID')}
            </h2>
            <p className="text-[11px] text-[#B84B3E] font-medium mt-1">
              {filteredExpenses.length} Catatan Biaya Terdaftar
            </p>
          </div>
        </div>

        {/* Metric 4: Estimasi Laba Bersih (Emerald Green / Brick Red Accent) */}
        <div className={`paper-card rounded-2xl p-4 border flex flex-col justify-between shadow-sm ${
          netProfit >= 0
            ? 'bg-gradient-to-br from-[#F0F7F2] via-[#F6FBF7] to-[#F0F7F2] border-[#A7F3D0]'
            : 'bg-gradient-to-br from-[#FDF2F0] via-[#FFF8F7] to-[#FDF2F0] border-[#FECACA]'
        }`}>
          <div className="flex items-center justify-between text-[#8A8175] mb-2">
            <span className={`text-xs font-extrabold uppercase tracking-wider ${netProfit >= 0 ? 'text-[#059669]' : 'text-[#B84B3E]'}`}>
              Estimasi Laba Bersih
            </span>
            <div className={`p-2.5 rounded-xl text-white shadow-md ${
              netProfit >= 0 ? 'bg-[#059669] shadow-[#059669]/20' : 'bg-[#B84B3E] shadow-[#B84B3E]/20'
            }`}>
              {netProfit >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
            </div>
          </div>
          <div>
            <h2 className={`text-xl sm:text-2xl font-black ${netProfit >= 0 ? 'text-[#059669]' : 'text-[#B84B3E]'}`}>
              {netProfit < 0 ? `-Rp ${Math.abs(netProfit).toLocaleString('id-ID')}` : `Rp ${netProfit.toLocaleString('id-ID')}`}
            </h2>
            <p className={`text-[11px] font-medium mt-1 ${netProfit >= 0 ? 'text-[#059669]' : 'text-[#B84B3E]'}`}>
              Setelah dikurangi pengeluaran
            </p>
          </div>
        </div>
      </div>

      {/* Main Charts & Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Trend Area Chart (2 Cols) */}
        <div className="lg:col-span-2 paper-panel rounded-xl p-4 sm:p-5 border border-[#E8E2D8] space-y-4 bg-white shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xs sm:text-sm font-bold text-[#2A2622]">Grafik Tren Omset Penjualan</h2>
              <p className="text-[11px] text-[#8A8175]">Visualisasi omset kasir harian dalam periode terpilih</p>
            </div>
            <span className="text-xs font-bold text-[#D97706] bg-[#FEF3C7] px-2.5 py-1 rounded-lg border border-[#D97706]/30">
              Analisis Penjualan
            </span>
          </div>

          {chartData.length === 0 ? (
            <div className="h-64 w-full flex flex-col items-center justify-center text-center p-6 bg-[#FAF7F2] rounded-xl border border-dashed border-[#E8E2D8]">
              <LayoutDashboard className="w-10 h-10 text-[#8A8175] mb-2 opacity-50" />
              <p className="text-xs font-bold text-[#2A2622]">Belum Ada Data Penjualan</p>
              <p className="text-[11px] text-[#8A8175] mt-1 max-w-xs">
                Belum ada transaksi penjualan yang tercatat pada rentang tanggal terpilih ini.
              </p>
            </div>
          ) : (
            <div className="h-64 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="amberGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#D97706" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" stroke="#8A8175" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#8A8175" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `${val / 1000}k`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E8E2D8', borderRadius: '12px', color: '#2A2622', fontSize: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                    formatter={(val: any) => [`Rp ${Number(val).toLocaleString('id-ID')}`, 'Omset']}
                  />
                  <Area type="monotone" dataKey="Omset" stroke="#D97706" strokeWidth={3} fillOpacity={1} fill="url(#amberGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Top Products Rank Card (1 Col) */}
        <div className="paper-panel rounded-xl p-4 sm:p-5 border border-[#E8E2D8] space-y-4 bg-white shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 pb-3 border-b border-[#E8E2D8]">
              <Trophy className="w-4 h-4 text-[#D97706]" />
              <h2 className="text-xs sm:text-sm font-bold text-[#2A2622]">Produk Terlaris (Top 5)</h2>
            </div>

            <div className="space-y-3 mt-3">
              {topProducts.length === 0 ? (
                <p className="text-xs text-[#8A8175] text-center py-6">Belum ada item terjual pada periode ini</p>
              ) : (
                topProducts.map((p, idx) => {
                  const style = rankStyles[idx] || rankStyles[4];
                  const widthPercent = Math.round((p.qty / maxProductQty) * 100);

                  return (
                    <div key={idx} className="space-y-1.5 p-2 rounded-xl hover:bg-[#FAF7F2] transition-all">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2.5 overflow-hidden">
                          <span className={`w-6 h-6 rounded-lg flex items-center justify-center font-extrabold text-[11px] border ${style.bg} ${style.text} ${style.border}`}>
                            #{idx + 1}
                          </span>
                          <span className="font-bold text-[#2A2622] truncate max-w-[130px] sm:max-w-[160px]">{p.name}</span>
                        </div>
                        <div className="text-right">
                          <span className={`font-extrabold block ${style.text}`}>{p.qty} Terjual</span>
                          <span className="text-[10px] text-[#8A8175] font-medium">Rp {p.revenue.toLocaleString('id-ID')}</span>
                        </div>
                      </div>

                      {/* Visual progress bar per rank */}
                      <div className="w-full bg-[#E8E2D8]/60 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${style.bar} rounded-full transition-all duration-500`}
                          style={{ width: `${widthPercent}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Breakdown Methods Payment Section with Color-Coded Badges */}
      <div className="paper-panel rounded-xl p-4 sm:p-5 border border-[#E8E2D8] bg-white shadow-sm space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-[#E8E2D8]">
          <CreditCard className="w-4 h-4 text-[#D97706]" />
          <h2 className="text-xs sm:text-sm font-bold text-[#2A2622]">Breakdown Metode Pembayaran</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Tunai / Cash (Emerald Green) */}
          <div className="bg-gradient-to-br from-[#F0F7F2] to-[#E6F4EA] p-3.5 rounded-xl border border-[#A7F3D0] space-y-2 shadow-xs">
            <div className="flex justify-between items-center text-xs">
              <span className="flex items-center gap-1.5 text-[#059669] font-bold">
                <Banknote className="w-4 h-4 text-[#059669]" />
                Tunai / Cash
              </span>
              <span className="font-extrabold text-[#059669]">Rp {paymentBreakdown.cash.toLocaleString('id-ID')}</span>
            </div>
            <div className="w-full bg-[#A7F3D0]/60 h-2 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#059669] rounded-full transition-all duration-500"
                style={{ width: `${grossSales > 0 ? Math.round((paymentBreakdown.cash / grossSales) * 100) : 0}%` }}
              />
            </div>
          </div>

          {/* QRIS Instant (Sapphire Blue) */}
          <div className="bg-gradient-to-br from-[#EFF6FF] to-[#DBEAFE] p-3.5 rounded-xl border border-[#BFDBFE] space-y-2 shadow-xs">
            <div className="flex justify-between items-center text-xs">
              <span className="flex items-center gap-1.5 text-[#2563EB] font-bold">
                <QrCode className="w-4 h-4 text-[#2563EB]" />
                QRIS Instant
              </span>
              <span className="font-extrabold text-[#2563EB]">Rp {paymentBreakdown.qris.toLocaleString('id-ID')}</span>
            </div>
            <div className="w-full bg-[#BFDBFE]/60 h-2 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#2563EB] rounded-full transition-all duration-500"
                style={{ width: `${grossSales > 0 ? Math.round((paymentBreakdown.qris / grossSales) * 100) : 0}%` }}
              />
            </div>
          </div>

          {/* E-Wallet (Deep Violet) */}
          <div className="bg-gradient-to-br from-[#F5F3FF] to-[#EDE9FE] p-3.5 rounded-xl border border-[#DDD6FE] space-y-2 shadow-xs">
            <div className="flex justify-between items-center text-xs">
              <span className="flex items-center gap-1.5 text-[#7C3AED] font-bold">
                <Wallet className="w-4 h-4 text-[#7C3AED]" />
                E-Wallet (DANA/OVO/GoPay)
              </span>
              <span className="font-extrabold text-[#7C3AED]">Rp {paymentBreakdown.ewallet.toLocaleString('id-ID')}</span>
            </div>
            <div className="w-full bg-[#DDD6FE]/60 h-2 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#7C3AED] rounded-full transition-all duration-500"
                style={{ width: `${grossSales > 0 ? Math.round((paymentBreakdown.ewallet / grossSales) * 100) : 0}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
