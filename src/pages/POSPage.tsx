import React, { useEffect, useState, useRef } from 'react';
import { usePOSStore } from '../store/usePOSStore';
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Tag,
  User,
  ArrowRight,
  Barcode,
  ChevronUp,
  ChevronRight,
  ChevronLeft,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const POSPage: React.FC = () => {
  const {
    products,
    categories,
    selectedCategoryId,
    setSelectedCategoryId,
    searchQuery,
    cart,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    discountValue,
    discountType,
    setDiscount,
    taxRate,
    customerName,
    setCustomerName,
    setPaymentModalOpen,
    settings,
    fetchMasterData
  } = usePOSStore();

  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);
  const categoryScrollRef = useRef<HTMLDivElement>(null);

  // Fetch master data on mount to guarantee fresh categories
  useEffect(() => {
    fetchMasterData();
  }, []);

  // Display strictly 5 exact categories requested
  const displayCategories = categories.length === 5 ? categories : [
    { id: 1, name: 'Makanan', icon: '🍜' },
    { id: 2, name: 'Minuman', icon: '🥤' },
    { id: 3, name: 'Sembako', icon: '🌾' },
    { id: 4, name: 'Top Up', icon: '⚡' },
    { id: 5, name: 'Rokok', icon: '🚬' }
  ];

  // Horizontal scroll helpers for category bar
  const scrollCategories = (direction: 'left' | 'right') => {
    if (categoryScrollRef.current) {
      const scrollAmount = direction === 'left' ? -180 : 180;
      categoryScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Filter products by Category & Search Query
  const filteredProducts = products.filter((p) => {
    const matchesCategory = selectedCategoryId === 0 || p.category_id === selectedCategoryId;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      p.name.toLowerCase().includes(q) ||
      (Boolean(p.barcode) && p.barcode!.includes(q)) ||
      (Boolean(p.description) && p.description!.toLowerCase().includes(q));
    return matchesCategory && matchesSearch;
  });

  // Cart Calculations
  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  const discountAmount =
    discountType === 'percent'
      ? Math.round((subtotal * discountValue) / 100)
      : discountValue;

  const taxableAmount = Math.max(0, subtotal - discountAmount);
  const taxAmount = Math.round((taxableAmount * taxRate) / 100);
  const totalAmount = taxableAmount + taxAmount;

  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const lowStockThreshold = parseInt(settings.low_stock_threshold, 10) || 5;

  return (
    <div className="flex-1 flex flex-col ipad:flex-row overflow-hidden bg-[#0b0f19] h-[calc(100vh-4rem)] relative select-none">
      {/* LEFT SECTION: Catalog & Categories */}
      <div className="flex-1 flex flex-col h-full overflow-hidden p-2.5 sm:p-4 border-r border-[#232d42]">
        
        {/* Category Pills Container with Clear Scroll Indicators */}
        <div className="relative mb-3 shrink-0 w-full flex items-center bg-[#151c2c]/40 rounded-2xl p-1.5 border border-[#232d42]">
          {/* Scroll Left Button */}
          <button
            onClick={() => scrollCategories('left')}
            className="p-1.5 rounded-lg bg-[#151c2c] text-slate-400 hover:text-cyan-400 border border-[#232d42] shrink-0 mr-1 hidden sm:flex items-center justify-center transition-all"
            title="Scroll Kategori Kiri"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Scrollable Pills Container */}
          <div
            ref={categoryScrollRef}
            className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto scroll-smooth touch-pan-x scrollbar-thin scrollbar-thumb-cyan-500/40 py-1 w-full"
          >
            <button
              onClick={() => setSelectedCategoryId(0)}
              className={`px-3.5 py-2 rounded-xl font-bold text-xs transition-all whitespace-nowrap min-h-[40px] flex items-center gap-1.5 shrink-0 ${
                selectedCategoryId === 0
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20 ring-1 ring-cyan-400'
                  : 'bg-[#151c2c] text-slate-300 hover:text-white border border-[#232d42]'
              }`}
            >
              <span>Semua</span>
              <span className="bg-black/40 px-2 py-0.5 rounded-md text-[10px] font-mono text-cyan-300">{products.length}</span>
            </button>

            {displayCategories.map((cat) => {
              const isSelected = selectedCategoryId === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategoryId(cat.id!)}
                  className={`px-3.5 py-2 rounded-xl font-semibold text-xs transition-all whitespace-nowrap min-h-[40px] flex items-center gap-1.5 shrink-0 ${
                    isSelected
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20 font-bold ring-1 ring-cyan-400'
                      : 'bg-[#151c2c] text-slate-300 hover:text-white border border-[#232d42]'
                  }`}
                >
                  <span className="text-sm">{cat.icon}</span>
                  <span>{cat.name}</span>
                </button>
              );
            })}
          </div>

          {/* Scroll Right Button */}
          <button
            onClick={() => scrollCategories('right')}
            className="p-1.5 rounded-lg bg-[#151c2c] text-slate-400 hover:text-cyan-400 border border-[#232d42] shrink-0 ml-1 hidden sm:flex items-center justify-center transition-all"
            title="Scroll Kategori Kanan"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Product Cards Grid — Responsive columns for iPad & Mobile */}
        <div className="flex-1 overflow-y-auto pr-1 pb-28 ipad:pb-4">
          {filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-500">
              <ShoppingCart className="w-12 h-12 mb-3 text-slate-600" />
              <p className="text-sm font-medium text-slate-300">Tidak ada produk dalam kategori ini</p>
              <p className="text-xs text-slate-500 mt-1">Coba pilih kategori lain atau kata kunci pencarian</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-3.5 align-start">
              {filteredProducts.map((product) => {
                const isOutOfStock = product.stock <= 0;
                const isLowStock = product.stock > 0 && product.stock <= lowStockThreshold;

                return (
                  <motion.div
                    key={product.id}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => !isOutOfStock && addToCart(product)}
                    className={`glass-card rounded-2xl p-2.5 sm:p-3 flex flex-col justify-between cursor-pointer border relative overflow-hidden group ${
                      isOutOfStock
                        ? 'opacity-50 grayscale cursor-not-allowed border-rose-900/30'
                        : 'border-[#232d42]'
                    }`}
                  >
                    {/* Stock Badge */}
                    <div className="absolute top-2 right-2 z-10">
                      {isOutOfStock ? (
                        <span className="px-1.5 py-0.5 rounded-md bg-rose-500/20 border border-rose-500/40 text-rose-400 font-bold text-[9px] sm:text-[10px]">
                          Habis
                        </span>
                      ) : isLowStock ? (
                        <span className="px-1.5 py-0.5 rounded-md bg-amber-500/20 border border-amber-500/40 text-amber-400 font-bold text-[9px] sm:text-[10px]">
                          Stok {product.stock}
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-medium text-[9px] sm:text-[10px]">
                          {product.stock} {product.unit}
                        </span>
                      )}
                    </div>

                    {/* Image Thumbnail */}
                    <div className="w-full h-24 sm:h-28 rounded-xl bg-[#0b0f19] overflow-hidden mb-2 relative flex items-center justify-center shrink-0">
                      {product.image_path ? (
                        <img
                          src={product.image_path}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <ShoppingCart className="w-7 h-7 text-slate-600" />
                      )}
                      {product.barcode && (
                        <div className="absolute bottom-1 left-1 bg-black/70 backdrop-blur-sm text-slate-300 text-[8px] sm:text-[9px] px-1.5 py-0.5 rounded flex items-center gap-1 font-mono">
                          <Barcode className="w-3 h-3 text-cyan-400" />
                          <span className="truncate max-w-[80px]">{product.barcode}</span>
                        </div>
                      )}
                    </div>

                    {/* Title & Price */}
                    <div className="space-y-1">
                      <h3 className="font-semibold text-xs text-white line-clamp-2 leading-tight">
                        {product.name}
                      </h3>
                      <div className="flex items-center justify-between pt-1">
                        <span className="font-bold text-xs sm:text-sm text-cyan-400 font-mono">
                          Rp {product.price.toLocaleString('id-ID')}
                        </span>
                        <span className="text-[9px] sm:text-[10px] text-slate-400 font-medium bg-[#151c2c] px-1 py-0.5 rounded border border-[#232d42]">
                          /{product.unit}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT SECTION: Cart Drawer for iPad 10 & Desktop */}
      <div className="hidden ipad:flex w-72 lg:w-80 xl:w-96 bg-[#0f172a] border-l border-[#232d42] flex-col justify-between h-full z-10 shadow-2xl shrink-0 overflow-hidden">
        <CartContent
          cart={cart}
          customerName={customerName}
          setCustomerName={setCustomerName}
          clearCart={clearCart}
          removeFromCart={removeFromCart}
          updateQuantity={updateQuantity}
          discountValue={discountValue}
          discountType={discountType}
          setDiscount={setDiscount}
          taxRate={taxRate}
          subtotal={subtotal}
          discountAmount={discountAmount}
          taxAmount={taxAmount}
          totalAmount={totalAmount}
          onCheckout={() => setPaymentModalOpen(true)}
        />
      </div>

      {/* MOBILE PHONE: Floating Sticky Cart Bar */}
      {cart.length > 0 && (
        <div className="ipad:hidden fixed bottom-16 left-3 right-3 z-30">
          <div className="bg-[#151c2c] border border-cyan-500/40 rounded-2xl p-2.5 shadow-2xl flex items-center justify-between gap-3 text-white backdrop-blur-xl">
            <button
              onClick={() => setIsMobileCartOpen(true)}
              className="flex items-center gap-2.5 flex-1 text-left"
            >
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center font-bold text-xs relative">
                <ShoppingCart className="w-5 h-5" />
                <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">
                  {totalCartCount}
                </span>
              </div>
              <div>
                <p className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                  <span>Lihat Keranjang</span>
                  <ChevronUp className="w-3.5 h-3.5 text-cyan-400 animate-bounce" />
                </p>
                <p className="text-sm font-extrabold text-white font-mono">
                  Rp {totalAmount.toLocaleString('id-ID')}
                </p>
              </div>
            </button>

            <button
              onClick={() => setPaymentModalOpen(true)}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-xs shadow-lg shadow-cyan-500/20 flex items-center gap-1.5 active:scale-95"
            >
              <span>BAYAR</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* MOBILE PHONE: Sliding Bottom Sheet Cart Drawer */}
      <AnimatePresence>
        {isMobileCartOpen && (
          <div className="ipad:hidden fixed inset-0 z-50 flex flex-col justify-end bg-black/75 backdrop-blur-sm">
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className="bg-[#0f172a] border-t border-[#232d42] rounded-t-3xl overflow-hidden max-h-[85vh] flex flex-col shadow-2xl"
            >
              <div className="p-3.5 border-b border-[#232d42] flex items-center justify-between bg-[#151c2c]">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-cyan-400" />
                  <h2 className="font-bold text-sm text-white">Keranjang Belanja ({totalCartCount})</h2>
                </div>
                <button
                  onClick={() => setIsMobileCartOpen(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-white bg-[#232d42]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto">
                <CartContent
                  cart={cart}
                  customerName={customerName}
                  setCustomerName={setCustomerName}
                  clearCart={clearCart}
                  removeFromCart={removeFromCart}
                  updateQuantity={updateQuantity}
                  discountValue={discountValue}
                  discountType={discountType}
                  setDiscount={setDiscount}
                  taxRate={taxRate}
                  subtotal={subtotal}
                  discountAmount={discountAmount}
                  taxAmount={taxAmount}
                  totalAmount={totalAmount}
                  onCheckout={() => {
                    setIsMobileCartOpen(false);
                    setPaymentModalOpen(true);
                  }}
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Reusable Cart Drawer Content Component
interface CartContentProps {
  cart: any[];
  customerName: string;
  setCustomerName: (name: string) => void;
  clearCart: () => void;
  removeFromCart: (id: number) => void;
  updateQuantity: (id: number, qty: number) => void;
  discountValue: number;
  discountType: 'nominal' | 'percent';
  setDiscount: (val: number, type: 'nominal' | 'percent') => void;
  taxRate: number;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  onCheckout: () => void;
}

const CartContent: React.FC<CartContentProps> = ({
  cart,
  customerName,
  setCustomerName,
  clearCart,
  removeFromCart,
  updateQuantity,
  discountValue,
  discountType,
  setDiscount,
  taxRate,
  subtotal,
  discountAmount,
  taxAmount,
  totalAmount,
  onCheckout
}) => {
  return (
    <div className="flex flex-col justify-between h-full">
      {/* Customer Input Row */}
      <div className="p-3 border-b border-[#232d42] bg-[#0b0f19]/60 flex items-center gap-2 shrink-0">
        <User className="w-4 h-4 text-slate-400 shrink-0" />
        <input
          type="text"
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          placeholder="Nama Pelanggan..."
          className="w-full bg-[#151c2c] border border-[#232d42] rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
        />
        {cart.length > 0 && (
          <button
            onClick={clearCart}
            className="text-xs text-rose-400 hover:text-rose-300 p-1 font-medium shrink-0"
            title="Kosongkan Keranjang"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Cart Items List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5 max-h-[300px] ipad:max-h-none">
        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-500 text-center">
            <ShoppingCart className="w-10 h-10 mb-2 text-slate-600" />
            <p className="text-xs font-semibold">Keranjang masih kosong</p>
          </div>
        ) : (
          cart.map((item) => (
            <div
              key={item.product.id}
              className="bg-[#151c2c] border border-[#232d42] rounded-xl p-3 flex flex-col gap-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <h4 className="font-semibold text-xs text-white leading-snug">
                    {item.product.name}
                  </h4>
                  <p className="text-[11px] text-cyan-400 font-bold font-mono">
                    Rp {item.product.price.toLocaleString('id-ID')}{' '}
                    <span className="text-[10px] text-slate-400 font-normal">/{item.product.unit}</span>
                  </p>
                </div>
                <button
                  onClick={() => removeFromCart(item.product.id!)}
                  className="text-slate-500 hover:text-rose-400 p-1 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Quantity Stepper & Line Item Subtotal */}
              <div className="flex items-center justify-between pt-1 border-t border-[#232d42]/60">
                <div className="flex items-center gap-1.5 bg-[#0b0f19] rounded-lg p-1 border border-[#232d42]">
                  <button
                    onClick={() => updateQuantity(item.product.id!, item.quantity - 1)}
                    className="w-7 h-7 rounded-md bg-[#151c2c] hover:bg-[#232d42] text-white flex items-center justify-center text-xs font-bold transition-all active:scale-95"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-8 text-center text-xs font-bold text-white font-mono">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.product.id!, item.quantity + 1)}
                    className="w-7 h-7 rounded-md bg-[#151c2c] hover:bg-[#232d42] text-white flex items-center justify-center text-xs font-bold transition-all active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                <span className="font-extrabold text-xs text-slate-100 font-mono">
                  Rp {(item.product.price * item.quantity).toLocaleString('id-ID')}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Cart Calculation Footer & Checkout Action */}
      <div className="p-4 border-t border-[#232d42] bg-[#151c2c] space-y-3 shrink-0">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400 flex items-center gap-1">
            <Tag className="w-3.5 h-3.5 text-cyan-400" />
            Diskon
          </span>
          <div className="flex items-center gap-2">
            <input
              type="number"
              inputMode="numeric"
              pattern="[0-9]*"
              value={discountValue || ''}
              onChange={(e) => setDiscount(parseFloat(e.target.value) || 0, discountType)}
              placeholder="0"
              className="w-20 bg-[#0b0f19] border border-[#232d42] rounded-lg px-2 py-1 text-right text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
            />
            <select
              value={discountType}
              onChange={(e) => setDiscount(discountValue, e.target.value as any)}
              className="bg-[#0b0f19] border border-[#232d42] rounded-lg px-1.5 py-1 text-xs text-white focus:outline-none"
            >
              <option value="nominal">Rp</option>
              <option value="percent">%</option>
            </select>
          </div>
        </div>

        <div className="space-y-1.5 pt-2 border-t border-[#232d42]/60 text-xs">
          <div className="flex justify-between text-slate-400">
            <span>Subtotal:</span>
            <span className="font-mono">Rp {subtotal.toLocaleString('id-ID')}</span>
          </div>
          {discountAmount > 0 && (
            <div className="flex justify-between text-rose-400">
              <span>Diskon:</span>
              <span className="font-mono">-Rp {discountAmount.toLocaleString('id-ID')}</span>
            </div>
          )}
          {taxAmount > 0 && (
            <div className="flex justify-between text-slate-400">
              <span>Pajak (PPN {taxRate}%):</span>
              <span className="font-mono">Rp {taxAmount.toLocaleString('id-ID')}</span>
            </div>
          )}

          <div className="flex justify-between items-center text-white font-extrabold text-base pt-2 border-t border-[#232d42]">
            <span>TOTAL BAYAR:</span>
            <span className="text-cyan-400 text-lg font-mono">Rp {totalAmount.toLocaleString('id-ID')}</span>
          </div>
        </div>

        <button
          disabled={cart.length === 0}
          onClick={onCheckout}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-extrabold text-sm shadow-xl shadow-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all active:scale-[0.98] min-h-[48px]"
        >
          <span>BAYAR SEKARANG</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
