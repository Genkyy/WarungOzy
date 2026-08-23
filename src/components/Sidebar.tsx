import React from 'react';
import {
  ShoppingCart,
  Receipt,
  LayoutDashboard,
  PackageCheck,
  TrendingDown,
  Settings,
  Store
} from 'lucide-react';
import { usePOSStore } from '../store/usePOSStore';

export const Sidebar: React.FC = () => {
  const { activeTab, setActiveTab, cart, settings } = usePOSStore();

  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const navItems = [
    { id: 'pos' as const, label: 'Kasir POS', icon: ShoppingCart, badge: totalCartCount > 0 ? totalCartCount : null },
    { id: 'orders' as const, label: 'Order', icon: Receipt },
    { id: 'dashboard' as const, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'stock' as const, label: 'Stok', icon: PackageCheck },
    { id: 'expenses' as const, label: 'Biaya', icon: TrendingDown },
    { id: 'settings' as const, label: 'Pengaturan', icon: Settings },
  ];

  return (
    <>
      {/* 1. IPAD 10 & DESKTOP: Responsive Vertical Sidebar */}
      {/* Compact w-20 on iPad Portrait (< 1024px), Full w-64 on iPad Landscape / Desktop (>= 1024px) */}
      <aside className="hidden ipad:flex w-20 lg:w-64 bg-white border-r border-[#E8E2D8] flex-col justify-between h-screen select-none z-20 shrink-0 transition-all duration-300">
        {/* Brand Header */}
        <div>
          <div className="h-16 flex items-center px-3 lg:px-4 gap-3 border-b border-[#E8E2D8] justify-center lg:justify-start">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#D97706] to-[#B45309] flex items-center justify-center text-white shadow-md shadow-[#D97706]/20 shrink-0">
              <Store className="w-5 h-5 text-white" />
            </div>
            <div className="overflow-hidden hidden lg:block">
              <div className="flex items-center gap-1.5">
                <h1 className="font-bold text-sm text-[#2A2622] tracking-tight truncate">
                  Warung Ozy
                </h1>
                <span className="px-1.5 py-0.2 bg-[#FEF3C7] text-[#D97706] border border-[#D97706]/30 text-[9px] font-bold rounded">
                  POS
                </span>
              </div>
              <p className="text-[11px] text-[#8A8175] font-medium">KasirKu POS System</p>
            </div>
          </div>

          {/* Navigation List */}
          <nav className="p-2 space-y-1.5 mt-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  title={item.label}
                  className={`w-full flex items-center justify-center lg:justify-start gap-3 px-3 py-3 rounded-xl font-medium text-sm transition-all duration-200 min-h-[48px] ${isActive
                      ? 'bg-[#FEF3C7] text-[#D97706] border border-[#D97706]/30 shadow-md shadow-[#D97706]/10 font-bold'
                      : 'text-slate-400 hover:text-slate-800 hover:bg-slate-50'
                    }`}
                >
                  <div className="relative shrink-0">
                    <Icon className={`w-5 h-5 ${isActive ? 'text-[#D97706]' : 'text-slate-400'}`} />
                    {item.badge && (
                      <span className="absolute -top-2 -right-2 bg-gradient-to-r from-pink-500 to-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center shadow">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <span className="truncate hidden lg:inline">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer System Info */}
        <div className="p-2 lg:p-3 border-t border-[#E8E2D8]">
          <div className="bg-slate-50 rounded-xl p-2 lg:p-3 border border-[#E8E2D8]/60 text-xs text-center lg:text-left">
            <div className="flex items-center justify-center lg:justify-between text-slate-400 mb-0.5 lg:mb-1">
              <span className="hidden lg:inline">Status</span>
              <span className="flex items-center gap-1.5 text-emerald-600 font-medium text-[11px]">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="hidden lg:inline">Offline Ready</span>
              </span>
            </div>
            <p className="text-[10px] text-slate-500 hidden lg:block">IndexedDB Local Database</p>
          </div>
        </div>
      </aside>

      {/* 2. MOBILE PHONE: Bottom Navigation Bar (Visible on Mobile < 820px) */}
      <div className="ipad:hidden fixed bottom-0 left-0 right-0 z-40 bg-white backdrop-blur-lg border-t border-[#E8E2D8] px-2 py-1.5 flex items-center justify-around select-none">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all min-w-[54px] min-h-[48px] relative ${isActive ? 'text-[#D97706] font-bold' : 'text-slate-400 hover:text-slate-800'
                }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'text-[#D97706]' : 'text-slate-400'}`} />
                {item.badge && (
                  <span className="absolute -top-1.5 -right-2.5 bg-rose-500 text-white text-[9px] font-extrabold px-1 rounded-full min-w-[15px] text-center">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-0.5 truncate max-w-[60px]">{item.label}</span>
              {isActive && (
                <span className="w-1 h-1 rounded-full bg-[#D97706] absolute bottom-0.5"></span>
              )}
            </button>
          );
        })}
      </div>
    </>
  );
};
