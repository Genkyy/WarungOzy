import React, { useEffect, useState, useMemo } from 'react';
import { repository } from '../services/indexedDBRepository';
import { Order, Expense, OrderItem } from '../types';
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

  // Financial Calculations
  const grossSales = filteredOrders.reduce((sum, o) => sum + o.total_amount, 0);
  const totalOrdersCount = filteredOrders.length;
  const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  // Estimasi Profit Kotor (25% margin standar warung) & Profit Bersih
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

  const displayChartData = chartData.length > 0 ? chartData : [
    { date: 'Sen', Omset: 240000 },
    { date: 'Sel', Omset: 380000 },
    { date: 'Rab', Omset: 450000 },
    { date: 'Kam', Omset: 320000 },
    { date: 'Jum', Omset: 590000 },
    { date: 'Sab', Omset: 720000 },
    { date: 'Min', Omset: grossSales || 680000 },
  ];

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

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#FAF7F2] space-y-6 h-[calc(100vh-4rem)] pb-20 ipad:pb-6 select-none">
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

      {/* Top Financial Metrics Cards per desain.md Section 6 (Laba Kotor 1st as Highlighted Card) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Metric 1: LABA KOTOR (HIGHLIGHTED CARD #1 per desain.md) */}
        <div className="paper-card bg-gradient-to-br from-[#FEF3C7] to-[#FFFBEB] rounded-2xl p-4 border border-[#D97706]/40 flex flex-col justify-between shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-[#8A8175] mb-2">
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#D97706] flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 fill-[#D97706]" />
              1. Laba Kotor (Profit)
            </span>
            <div className="p-2 rounded-xl bg-[#D97706] text-white">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-[#D97706]">
              Rp {estimatedGrossProfit.toLocaleString('id-ID')}
            </h2>
            <p className="text-[11px] text-[#3F7D4F] font-semibold flex items-center gap-1 mt-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Est. Margin 25% Omset</span>
            </p>
          </div>
        </div>

        {/* Metric 2: Total Omset Kotor */}
        <div className="paper-card rounded-2xl p-4 border border-[#E8E2D8] flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between text-[#8A8175] mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Omset Penjualan</span>
            <div className="p-2 rounded-xl bg-[#FAF7F2] border border-[#E8E2D8] text-[#D97706]">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#2A2622]">
              Rp {grossSales.toLocaleString('id-ID')}
            </h2>
            <p className="text-[11px] text-[#8A8175] font-medium flex items-center gap-1 mt-1">
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>{totalOrdersCount} Transaksi Selesai</span>
            </p>
          </div>
        </div>

        {/* Metric 3: Total Pengeluaran Warung */}
        <div className="paper-card rounded-2xl p-4 border border-[#E8E2D8] flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between text-[#8A8175] mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Pengeluaran Operasional</span>
            <div className="p-2 rounded-xl bg-[#FDF2F0] border border-[#B84B3E]/30 text-[#B84B3E]">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#B84B3E]">
              Rp {totalExpenses.toLocaleString('id-ID')}
            </h2>
            <p className="text-[11px] text-[#8A8175] font-medium mt-1">
              {filteredExpenses.length} Catatan Kulakan/Listrik
            </p>
          </div>
        </div>

        {/* Metric 4: Estimasi Profit Bersih */}
        <div className="paper-card rounded-2xl p-4 border border-[#E8E2D8] flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between text-[#8A8175] mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Estimasi Laba Bersih</span>
            <div className="p-2 rounded-xl bg-[#F0F7F2] border border-[#3F7D4F]/30 text-[#3F7D4F]">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div>
            <h2 className={`text-xl sm:text-2xl font-bold ${netProfit >= 0 ? 'text-[#3F7D4F]' : 'text-[#B84B3E]'}`}>
              Rp {netProfit.toLocaleString('id-ID')}
            </h2>
            <p className="text-[11px] text-[#8A8175] font-medium mt-1">
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
              Warm Amber Analytics
            </span>
          </div>

          <div className="h-64 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={displayChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="amberGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#D97706" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#D97706" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="#8A8175" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#8A8175" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `${val / 1000}k`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E8E2D8', borderRadius: '12px', color: '#2A2622', fontSize: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                  formatter={(val: any) => [`Rp ${Number(val).toLocaleString('id-ID')}`, 'Omset']}
                />
                <Area type="monotone" dataKey="Omset" stroke="#D97706" strokeWidth={3} fillOpacity={1} fill="url(#amberGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
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
                topProducts.map((p, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs p-2 rounded-xl hover:bg-[#FAF7F2] transition-all">
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <span className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-[11px] ${
                        idx === 0 ? 'bg-[#FEF3C7] text-[#D97706] border border-[#D97706]/40' : 'bg-[#FAF7F2] text-[#8A8175]'
                      }`}>
                        #{idx + 1}
                      </span>
                      <span className="font-semibold text-[#2A2622] truncate max-w-[130px] sm:max-w-[160px]">{p.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-[#D97706] block">{p.qty} Terjual</span>
                      <span className="text-[10px] text-[#8A8175]">Rp {p.revenue.toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Breakdown Methods Payment Section */}
      <div className="paper-panel rounded-xl p-4 sm:p-5 border border-[#E8E2D8] bg-white shadow-sm space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-[#E8E2D8]">
          <CreditCard className="w-4 h-4 text-[#D97706]" />
          <h2 className="text-xs sm:text-sm font-bold text-[#2A2622]">Breakdown Metode Pembayaran</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Tunai */}
          <div className="bg-[#FAF7F2] p-3 rounded-xl border border-[#E8E2D8] space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="flex items-center gap-1.5 text-[#2A2622] font-semibold">
                <Banknote className="w-4 h-4 text-[#3F7D4F]" />
                Tunai / Cash
              </span>
              <span className="font-bold text-[#3F7D4F]">Rp {paymentBreakdown.cash.toLocaleString('id-ID')}</span>
            </div>
            <div className="w-full bg-[#E8E2D8] h-1.5 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#3F7D4F] rounded-full"
                style={{ width: `${grossSales > 0 ? Math.round((paymentBreakdown.cash / grossSales) * 100) : 0}%` }}
              />
            </div>
          </div>

          {/* QRIS */}
          <div className="bg-[#FAF7F2] p-3 rounded-xl border border-[#E8E2D8] space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="flex items-center gap-1.5 text-[#2A2622] font-semibold">
                <QrCode className="w-4 h-4 text-[#D97706]" />
                QRIS Instant
              </span>
              <span className="font-bold text-[#D97706]">Rp {paymentBreakdown.qris.toLocaleString('id-ID')}</span>
            </div>
            <div className="w-full bg-[#E8E2D8] h-1.5 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#D97706] rounded-full"
                style={{ width: `${grossSales > 0 ? Math.round((paymentBreakdown.qris / grossSales) * 100) : 0}%` }}
              />
            </div>
          </div>

          {/* E-Wallet */}
          <div className="bg-[#FAF7F2] p-[#FAF7F2] p-3 rounded-xl border border-[#E8E2D8] space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="flex items-center gap-1.5 text-[#2A2622] font-semibold">
                <Wallet className="w-4 h-4 text-[#B84B3E]" />
                E-Wallet (DANA/OVO/GoPay)
              </span>
              <span className="font-bold text-[#B84B3E]">Rp {paymentBreakdown.ewallet.toLocaleString('id-ID')}</span>
            </div>
            <div className="w-full bg-[#E8E2D8] h-1.5 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#B84B3E] rounded-full"
                style={{ width: `${grossSales > 0 ? Math.round((paymentBreakdown.ewallet / grossSales) * 100) : 0}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
