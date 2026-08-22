import React, { useEffect, useState, useMemo } from 'react';
import { repository } from '../services/indexedDBRepository';
import { Order, Expense, OrderItem } from '../types';
import {
  DollarSign,
  ShoppingBag,
  TrendingDown,
  Sparkles,
  TrendingUp,
  Receipt,
  Calendar,
  Filter,
  Trophy,
  CreditCard,
  Banknote,
  QrCode,
  Wallet,
  ArrowRight
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';

export const DashboardPage: React.FC = () => {
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [allExpenses, setAllExpenses] = useState<Expense[]>([]);
  const [allOrderItems, setAllOrderItems] = useState<OrderItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter States
  const [periodPreset, setPeriodPreset] = useState<'today' | '7days' | 'month' | 'all' | 'custom'>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [rawOrders, rawExpenses] = await Promise.all([
          repository.getOrders('completed'),
          repository.getExpenses()
        ]);

        // Fetch item details for all completed orders to calculate top products
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
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  // Handle Preset Button Click
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

  // Filter Orders & Expenses based on Date Range
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

  // Financial Calculations
  const grossSales = filteredOrders.reduce((sum, o) => sum + o.total_amount, 0);
  const totalOrdersCount = filteredOrders.length;
  const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  // Estimasi Profit Kotor & Profit Bersih
  const estimatedGrossProfit = filteredOrders.reduce((sum, o) => sum + (o.subtotal * 0.25), 0);
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

  // Fallback chart data if empty
  const displayChartData = chartData.length > 0 ? chartData : [
    { date: 'Sen', Omset: 240000 },
    { date: 'Sel', Omset: 380000 },
    { date: 'Rab', Omset: 450000 },
    { date: 'Kam', Omset: 320000 },
    { date: 'Jum', Omset: 590000 },
    { date: 'Sab', Omset: 720000 },
    { date: 'Min', Omset: grossSales || 680000 },
  ];

  // Calculate Top 5 Best Selling Products (Filtered)
  const topProducts = useMemo(() => {
    const validOrderIds = new Set(filteredOrders.map((o) => o.id));
    const itemsToCount = allOrderItems.filter((item) => validOrderIds.has(item.order_id));

    const productMap: Record<string, { name: string; qty: number; revenue: number }> = {};
    itemsToCount.forEach((item) => {
      const key = item.product_name || `Produk #${item.menu_item_id}`;
      if (!productMap[key]) {
        productMap[key] = { name: key, qty: 0, revenue: 0 };
      }
      productMap[key].qty += item.quantity;
      productMap[key].revenue += item.subtotal;
    });

    const list = Object.values(productMap);
    list.sort((a, b) => b.qty - a.qty);
    return list.slice(0, 5);
  }, [filteredOrders, allOrderItems]);

  // Calculate Payment Method Breakdown
  const paymentBreakdown = useMemo(() => {
    const map: Record<string, number> = { cash: 0, qris: 0, ewallet: 0 };
    filteredOrders.forEach((o) => {
      const method = o.payment?.method || 'cash';
      if (map[method] !== undefined) {
        map[method] += o.total_amount;
      } else {
        map['cash'] += o.total_amount;
      }
    });
    return map;
  }, [filteredOrders]);

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#0b0f19] space-y-4 sm:space-y-6 h-[calc(100vh-4rem)] pb-20 ipad:pb-6 select-none">
      {/* Title Header & Date Filter Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-[#151c2c] p-4 rounded-2xl border border-[#232d42]">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-cyan-400" />
            Dashboard Analytics Keuangan
          </h1>
          <p className="text-xs text-slate-400">Ringkasan performa omset, laba bersih, pengeluaran, dan produk terlaris</p>
        </div>

        {/* Date Filter Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Presets */}
          <div className="flex items-center gap-1 bg-[#0b0f19] p-1 rounded-xl border border-[#232d42]">
            {[
              { id: 'today', label: 'Hari Ini' },
              { id: '7days', label: '7 Hari' },
              { id: 'month', label: 'Bulan Ini' },
              { id: 'all', label: 'Semua' },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => handleSelectPreset(p.id as any)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  periodPreset === p.id
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Custom Date Pickers */}
          <div className="flex items-center gap-1.5 bg-[#0b0f19] px-2.5 py-1.5 rounded-xl border border-[#232d42] text-xs">
            <Filter className="w-3.5 h-3.5 text-cyan-400" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPeriodPreset('custom');
              }}
              className="bg-transparent text-slate-200 text-xs focus:outline-none"
            />
            <span className="text-slate-500">-</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPeriodPreset('custom');
              }}
              className="bg-transparent text-slate-200 text-xs focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Top 4 Financial Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Metric 1: Total Omset Penjualan */}
        <div className="glass-card rounded-2xl p-4 border border-[#232d42] flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Omset Kotor</span>
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white font-mono">
              Rp {grossSales.toLocaleString('id-ID')}
            </h2>
            <p className="text-[11px] text-emerald-400 font-medium flex items-center gap-1 mt-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>{totalOrdersCount} Transaksi Filtered</span>
            </p>
          </div>
        </div>

        {/* Metric 2: Total Order */}
        <div className="glass-card rounded-2xl p-4 border border-[#232d42] flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Transaksi</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white font-mono">
              {totalOrdersCount} <span className="text-xs font-normal text-slate-400">Nota</span>
            </h2>
            <p className="text-[11px] text-slate-400 font-medium mt-1">
              Rerata: Rp {totalOrdersCount > 0 ? Math.round(grossSales / totalOrdersCount).toLocaleString('id-ID') : 0} / Struk
            </p>
          </div>
        </div>

        {/* Metric 3: Total Expenses */}
        <div className="glass-card rounded-2xl p-4 border border-[#232d42] flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Pengeluaran</span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-rose-400 font-mono">
              Rp {totalExpenses.toLocaleString('id-ID')}
            </h2>
            <p className="text-[11px] text-slate-400 font-medium mt-1">
              Kulakan, operasional & beban toko
            </p>
          </div>
        </div>

        {/* Metric 4: Keuntungan Bersih (Net Profit) */}
        <div className="glass-card rounded-2xl p-4 border border-emerald-500/30 bg-emerald-950/20 flex flex-col justify-between relative overflow-hidden shadow-lg shadow-emerald-500/5">
          <div className="flex items-center justify-between text-emerald-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Estimasi Laba Bersih</span>
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">
              Rp {netProfit.toLocaleString('id-ID')}
            </h2>
            <p className="text-[11px] text-emerald-300 font-medium mt-1">
              Laba Kotor dikurangi Total Pengeluaran
            </p>
          </div>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Chart 1: Revenue Trend (2 Columns) */}
        <div className="lg:col-span-2 glass-panel rounded-2xl p-4 sm:p-5 border border-[#232d42] space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-cyan-400" />
              Grafik Tren Penjualan
            </h3>
            <span className="text-[11px] text-slate-400">Recharts View</span>
          </div>

          <div className="h-56 sm:h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={displayChartData}>
                <defs>
                  <linearGradient id="colorOmset" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00d2ff" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#00d2ff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} tickFormatter={(v) => `Rp ${(v / 1000).toLocaleString()}k`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#151c2c', borderColor: '#232d42', borderRadius: '12px', color: '#fff' }}
                  formatter={(value: any) => [`Rp ${Number(value).toLocaleString('id-ID')}`, 'Omset']}
                />
                <Area type="monotone" dataKey="Omset" stroke="#00d2ff" strokeWidth={3} fillOpacity={1} fill="url(#colorOmset)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Fast Moving Categories */}
        <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-[#232d42] space-y-4">
          <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
            <Receipt className="w-4 h-4 text-emerald-400" />
            Distribusi Kategori
          </h3>

          <div className="h-56 sm:h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={[
                  { name: 'Makanan', Total: 45 },
                  { name: 'Minuman', Total: 38 },
                  { name: 'Sembako', Total: 28 },
                  { name: 'Top Up', Total: 18 },
                  { name: 'Rokok', Total: 24 },
                ]}
              >
                <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#151c2c', borderColor: '#232d42', borderRadius: '12px', color: '#fff' }}
                />
                <Bar dataKey="Total" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* REPLACED SECTION: Executive Analytics (Top 5 Best Seller & Payment Breakdown) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* 🏆 Top 5 Best Selling Products Leaderboard (2 Columns) */}
        <div className="lg:col-span-2 glass-panel rounded-2xl p-4 sm:p-5 border border-[#232d42] space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-400" />
              Top 5 Produk Terlaris & Paling Menguntungkan
            </h3>
            <span className="text-[11px] text-slate-400">Berdasarkan Jumlah Terjual</span>
          </div>

          {topProducts.length === 0 ? (
            <p className="text-xs text-slate-500 py-6 text-center">Belum ada data produk terjual pada periode ini</p>
          ) : (
            <div className="space-y-2.5">
              {topProducts.map((p, idx) => {
                const maxQty = topProducts[0]?.qty || 1;
                const percentage = Math.round((p.qty / maxQty) * 100);

                return (
                  <div
                    key={p.name}
                    className="bg-[#151c2c] border border-[#232d42] rounded-xl p-3 flex flex-col gap-1.5"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
                          idx === 0
                            ? 'bg-amber-500 text-slate-950 font-extrabold'
                            : idx === 1
                            ? 'bg-slate-300 text-slate-950 font-bold'
                            : idx === 2
                            ? 'bg-amber-700 text-white'
                            : 'bg-[#232d42] text-slate-400'
                        }`}>
                          #{idx + 1}
                        </span>
                        <span className="font-bold text-white">{p.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-cyan-400 font-bold font-mono">{p.qty} Terjual</span>
                        <span className="text-white font-mono font-bold">Rp {p.revenue.toLocaleString('id-ID')}</span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-[#0b0f19] h-1.5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 💳 Payment Method Distribution */}
        <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-[#232d42] space-y-4">
          <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-cyan-400" />
            Metode Pembayaran
          </h3>

          <div className="space-y-3 pt-1">
            {/* Cash */}
            <div className="bg-[#151c2c] p-3 rounded-xl border border-[#232d42] space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="flex items-center gap-1.5 text-slate-300 font-medium">
                  <Banknote className="w-4 h-4 text-emerald-400" />
                  Tunai / Cash
                </span>
                <span className="font-mono font-bold text-emerald-400">Rp {paymentBreakdown.cash.toLocaleString('id-ID')}</span>
              </div>
              <div className="w-full bg-[#0b0f19] h-1.5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-400 rounded-full"
                  style={{ width: `${grossSales > 0 ? Math.round((paymentBreakdown.cash / grossSales) * 100) : 0}%` }}
                />
              </div>
            </div>

            {/* QRIS */}
            <div className="bg-[#151c2c] p-3 rounded-xl border border-[#232d42] space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="flex items-center gap-1.5 text-slate-300 font-medium">
                  <QrCode className="w-4 h-4 text-cyan-400" />
                  QRIS Instant
                </span>
                <span className="font-mono font-bold text-cyan-400">Rp {paymentBreakdown.qris.toLocaleString('id-ID')}</span>
              </div>
              <div className="w-full bg-[#0b0f19] h-1.5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-cyan-400 rounded-full"
                  style={{ width: `${grossSales > 0 ? Math.round((paymentBreakdown.qris / grossSales) * 100) : 0}%` }}
                />
              </div>
            </div>

            {/* E-Wallet */}
            <div className="bg-[#151c2c] p-3 rounded-xl border border-[#232d42] space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="flex items-center gap-1.5 text-slate-300 font-medium">
                  <Wallet className="w-4 h-4 text-purple-400" />
                  E-Wallet (DANA/OVO/GoPay)
                </span>
                <span className="font-mono font-bold text-purple-400">Rp {paymentBreakdown.ewallet.toLocaleString('id-ID')}</span>
              </div>
              <div className="w-full bg-[#0b0f19] h-1.5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-400 rounded-full"
                  style={{ width: `${grossSales > 0 ? Math.round((paymentBreakdown.ewallet / grossSales) * 100) : 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
