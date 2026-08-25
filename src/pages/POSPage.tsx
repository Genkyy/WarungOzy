import React, { useState, useEffect, useRef } from 'react';
import { usePOSStore } from '../store/usePOSStore';
import { CategoryIcon } from '../components/CategoryIcon';
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Tag,
  ArrowRight,
  User,
  ChevronLeft,
  ChevronRight,
  Barcode,
  X,
  ChevronUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const POSPage: React.FC = () => {
  const {
    products,
    categories,
    selectedCategoryId,
    setSelectedCategoryId,
    addToCart,
    cart,
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
  const [failedImageIds, setFailedImageIds] = useState<Record<number, boolean>>({});
  const categoryScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMasterData();
  }, []);

  const displayCategories = categories.length > 0 ? categories : [
    { id: 1, name: 'Makanan', icon: '🍜' },
    { id: 2, name: 'Minuman', icon: '🥤' },
    { id: 3, name: 'Sembako', icon: '🌾' },
    { id: 4, name: 'Top Up', icon: '⚡' },
    { id: 5, name: 'Rokok', icon: '🚬' },
  ];

  const scrollCategories = (direction: 'left' | 'right') => {
    if (categoryScrollRef.current) {
      const scrollAmount = direction === 'left' ? -200 : 200;
      categoryScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchesCategory = selectedCategoryId === 0 || p.category_id === selectedCategoryId;
    return matchesCategory;
  });

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
    <div className="flex-1 flex flex-col ipad:flex-row overflow-hidden bg-[#FAF7F2] h-[calc(100vh-4rem)] relative">
      {/* LEFT SECTION: Catalog & Categories */}
      <div className="flex-1 flex flex-col h-full overflow-hidden p-3 sm:p-4 border-r border-[#E8E2D8]">
        
        {/* Category Pills Bar */}
        <div className="relative mb-3 shrink-0 w-full flex items-center bg-white rounded-xl p-1.5 border border-[#E8E2D8] shadow-sm">
          <button
            onClick={() => scrollCategories('left')}
            className="p-1.5 rounded-lg bg-[#FAF7F2] text-[#8A8175] hover:text-[#2A2622] border border-[#E8E2D8] shrink-0 mr-1 hidden sm:flex items-center justify-center transition-all"
            title="Scroll Kategori Kiri"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div
            ref={categoryScrollRef}
            className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto scroll-smooth touch-pan-x py-1 w-full"
          >
            <button
              onClick={() => setSelectedCategoryId(0)}
              className={`px-4 py-2 rounded-xl font-medium text-xs transition-all whitespace-nowrap min-h-[40px] flex items-center gap-2 shrink-0 ${
                selectedCategoryId === 0
                  ? 'bg-[#D97706] text-white shadow-sm font-bold'
                  : 'bg-[#FAF7F2] text-[#8A8175] hover:text-[#2A2622] border border-[#E8E2D8]'
              }`}
            >
              <span>Semua Kategori</span>
              <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono ${selectedCategoryId === 0 ? 'bg-black/20 text-white' : 'bg-[#E8E2D8] text-[#8A8175]'}`}>
                {products.length}
              </span>
            </button>

            {displayCategories.map((cat) => {
              const isSelected = selectedCategoryId === cat.id;
              const catItemCount = products.filter(p => p.category_id === cat.id).length;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategoryId(cat.id!)}
                  className={`px-3.5 py-2 rounded-xl font-medium text-xs transition-all whitespace-nowrap min-h-[40px] flex items-center gap-2 shrink-0 ${
                    isSelected
                      ? 'bg-[#D97706] text-white shadow-sm font-bold'
                      : 'bg-[#FAF7F2] text-[#8A8175] hover:text-[#2A2622] border border-[#E8E2D8]'
                  }`}
                >
                  <CategoryIcon iconName={cat.icon} categoryName={cat.name} className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-[#D97706]'}`} />
                  <span>{cat.name}</span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${isSelected ? 'bg-black/20 text-white' : 'bg-[#E8E2D8] text-[#8A8175]'}`}>
                    {catItemCount}
                  </span>
                </button>
              );
            })}
          </div>

          <button
            onClick={() => scrollCategories('right')}
            className="p-1.5 rounded-lg bg-[#FAF7F2] text-[#8A8175] hover:text-[#2A2622] border border-[#E8E2D8] shrink-0 ml-1 hidden sm:flex items-center justify-center transition-all"
            title="Scroll Kategori Kanan"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Product Cards Grid */}
        <div className="flex-1 overflow-y-auto pr-1 pb-28 ipad:pb-4">
          {filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-[#8A8175]">
              <ShoppingCart className="w-12 h-12 mb-3 text-[#E8E2D8]" />
              <p className="text-sm font-medium text-[#2A2622]">Tidak ada produk dalam kategori ini</p>
              <p className="text-xs text-[#8A8175] mt-1">Coba pilih kategori lain atau kata kunci pencarian</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 align-start">
              {filteredProducts.map((product) => {
                const catObj = displayCategories.find(c => c.id === product.category_id);
                const isDigital = catObj?.name.toLowerCase().includes('top up') ||
                                  catObj?.name.toLowerCase().includes('pulsa') ||
                                  catObj?.name.toLowerCase().includes('digital') ||
                                  product.unit === 'Top Up' ||
                                  product.unit === 'Voucher';

                const isOutOfStock = !isDigital && product.stock <= 0;
                const isLowStock = !isDigital && product.stock > 0 && product.stock <= lowStockThreshold;

                return (
                  <motion.div
                    key={product.id}
                    whileTap={{ scale: isOutOfStock ? 1 : 0.97 }}
                    onClick={() => !isOutOfStock && addToCart(product)}
                    className={`paper-card rounded-2xl p-3 flex flex-col justify-between cursor-pointer relative overflow-hidden group border ${
                      isOutOfStock
                        ? 'opacity-70 bg-[#FAF7F2] border-[#E8E2D8] cursor-not-allowed'
                        : 'bg-white hover:border-[#D97706]'
                    }`}
                  >
                    {!isDigital && (
                      <div className="absolute top-2.5 right-2.5 z-20">
                        {isOutOfStock ? (
                          <span className="px-2 py-0.5 rounded-md bg-[#B84B3E] text-white font-bold text-[10px] shadow-sm">
                            HABIS
                          </span>
                        ) : isLowStock ? (
                          <span className="px-2 py-0.5 rounded-md bg-[#D4A017] text-white font-bold text-[10px] shadow-sm">
                            Sisa {product.stock}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md bg-[#3F7D4F] text-white font-medium text-[10px] shadow-sm">
                            {product.stock} {product.unit}
                          </span>
                        )}
                      </div>
                    )}

                    <div className="w-full aspect-square rounded-xl bg-[#FAF7F2] overflow-hidden mb-2.5 relative flex items-center justify-center border border-[#E8E2D8]">
                      {product.image_path && !failedImageIds[product.id!] ? (
                        <img
                          src={product.image_path}
                          alt={product.name}
                          onError={() => setFailedImageIds(prev => ({ ...prev, [product.id!]: true }))}
                          className={`w-full h-full object-cover transition-transform duration-300 ${
                            isOutOfStock ? 'grayscale opacity-50' : 'group-hover:scale-105'
                          }`}
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-center p-2">
                          <div className="w-10 h-10 rounded-xl bg-[#FEF3C7] border border-[#D97706]/30 flex items-center justify-center text-[#D97706] mb-1.5 shadow-sm">
                            <CategoryIcon iconName={catObj?.icon} categoryName={catObj?.name} className="w-5 h-5 text-[#D97706]" />
                          </div>
                          <span className="text-[10px] text-[#8A8175] font-semibold">{product.unit}</span>
                        </div>
                      )}

                      {isOutOfStock && (
                        <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center z-10">
                          <span className="px-3 py-1 bg-[#B84B3E] text-white font-black text-xs rounded-md shadow-md tracking-wider">
                            HABIS
                          </span>
                        </div>
                      )}

                      {product.barcode && !isOutOfStock && (
                        <div className="absolute bottom-1.5 left-1.5 bg-white/90 backdrop-blur-sm text-[#2A2622] text-[9px] px-1.5 py-0.5 rounded flex items-center gap-1 font-mono border border-[#E8E2D8]">
                          <Barcode className="w-3 h-3 text-[#D97706]" />
                          <span className="truncate max-w-[70px]">{product.barcode}</span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-1">
                      <h3 className="font-semibold text-sm text-[#2A2622] line-clamp-2 leading-snug">
                        {product.name}
                      </h3>
                      <div className="flex items-baseline justify-between pt-1">
                        <span className="font-bold text-base text-[#D97706]">
                          Rp {product.price.toLocaleString('id-ID')}
                        </span>
                        <span className="text-xs text-[#8A8175] font-normal">
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

      {/* RIGHT SECTION: Cart Drawer */}
      <div className="hidden ipad:flex w-80 lg:w-96 bg-white border-l border-[#E8E2D8] flex-col justify-between h-full z-10 shadow-sm shrink-0 overflow-hidden">
        <CartContent
          cart={cart}
          customerName={customerName}
          setCustomerName={setCustomerName}
          updateQuantity={updateQuantity}
          removeFromCart={removeFromCart}
          clearCart={clearCart}
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
          <div className="bg-white border border-[#D97706] rounded-2xl p-3 shadow-xl flex items-center justify-between gap-3 text-[#2A2622]">
            <button
              onClick={() => setIsMobileCartOpen(true)}
              className="flex items-center gap-3 flex-1 text-left"
            >
              <div className="w-10 h-10 rounded-xl bg-[#FEF3C7] text-[#D97706] border border-[#D97706]/30 flex items-center justify-center font-bold text-xs relative">
                <ShoppingCart className="w-5 h-5" />
                <span className="absolute -top-1.5 -right-1.5 bg-[#B84B3E] text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">
                  {totalCartCount}
                </span>
              </div>
              <div>
                <p className="text-[11px] text-[#8A8175] font-medium flex items-center gap-1">
                  <span>Lihat Keranjang</span>
                  <ChevronUp className="w-3.5 h-3.5 text-[#D97706] animate-bounce" />
                </p>
                <p className="text-sm font-bold text-[#2A2622]">
                  Rp {totalAmount.toLocaleString('id-ID')}
                </p>
              </div>
            </button>

            <button
              onClick={() => setPaymentModalOpen(true)}
              className="px-5 py-2.5 rounded-xl bg-[#D97706] hover:bg-[#B45309] text-white font-bold text-xs shadow-md flex items-center gap-1.5 active:scale-95 min-h-[44px]"
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
          <div className="ipad:hidden fixed inset-0 z-50 flex flex-col justify-end bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className="bg-white border-t border-[#E8E2D8] rounded-t-2xl overflow-hidden max-h-[85vh] flex flex-col shadow-2xl"
            >
              <div className="p-3.5 border-b border-[#E8E2D8] flex items-center justify-between bg-[#FAF7F2]">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-[#D97706]" />
                  <h2 className="font-bold text-sm text-[#2A2622]">Keranjang Belanja ({totalCartCount})</h2>
                </div>
                <button
                  onClick={() => setIsMobileCartOpen(false)}
                  className="p-1.5 rounded-xl text-[#8A8175] hover:text-[#2A2622] bg-white border border-[#E8E2D8]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto">
                <CartContent
                  cart={cart}
                  customerName={customerName}
                  setCustomerName={setCustomerName}
                  updateQuantity={updateQuantity}
                  removeFromCart={removeFromCart}
                  clearCart={clearCart}
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

interface CartContentProps {
  cart: any[];
  customerName: string;
  setCustomerName: (name: string) => void;
  updateQuantity: (id: number, qty: number) => void;
  removeFromCart: (id: number) => void;
  clearCart: () => void;
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
  updateQuantity,
  removeFromCart,
  clearCart,
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
    <div className="flex flex-col h-full bg-white">
      <div className="p-3 border-b border-[#E8E2D8] bg-[#FAF7F2] flex items-center gap-2 shrink-0">
        <User className="w-4 h-4 text-[#8A8175] shrink-0" />
        <input
          type="text"
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          placeholder="Nama Pelanggan..."
          className="w-full bg-white border border-[#E8E2D8] rounded-lg px-3 py-1.5 text-xs text-[#2A2622] placeholder-[#8A8175] focus:outline-none focus:border-[#D97706]"
        />
        {cart.length > 0 && (
          <button
            onClick={clearCart}
            className="text-xs text-[#B84B3E] hover:opacity-80 p-1 font-medium shrink-0"
            title="Kosongkan Keranjang"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2.5 max-h-[320px] ipad:max-h-none">
        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-[#8A8175] text-center">
            <ShoppingCart className="w-10 h-10 mb-2 text-[#E8E2D8]" />
            <p className="text-xs font-semibold">Keranjang masih kosong</p>
            <p className="text-[11px] text-[#8A8175] mt-0.5">Scan barcode atau tap produk untuk membeli</p>
          </div>
        ) : (
          cart.map((item) => (
            <div
              key={item.product.id}
              className="bg-white border border-[#E8E2D8] rounded-xl p-3 flex flex-col gap-2 shadow-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <h4 className="font-semibold text-xs text-[#2A2622] leading-snug">
                    {item.product.name}
                  </h4>
                  <p className="text-[11px] text-[#D97706] font-bold">
                    Rp {item.product.price.toLocaleString('id-ID')}{' '}
                    <span className="text-[10px] text-[#8A8175] font-normal">/{item.product.unit}</span>
                  </p>
                </div>
                <button
                  onClick={() => removeFromCart(item.product.id!)}
                  className="text-[#8A8175] hover:text-[#B84B3E] p-1 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-[#E8E2D8]">
                <div className="flex items-center gap-1.5 bg-[#FAF7F2] rounded-lg p-1 border border-[#E8E2D8]">
                  <button
                    onClick={() => updateQuantity(item.product.id!, item.quantity - 1)}
                    className="w-7 h-7 rounded-md bg-white hover:bg-[#E8E2D8] text-[#2A2622] flex items-center justify-center text-xs font-bold transition-all border border-[#E8E2D8] active:scale-95"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-8 text-center text-xs font-bold text-[#2A2622]">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.product.id!, item.quantity + 1)}
                    className="w-7 h-7 rounded-md bg-white hover:bg-[#E8E2D8] text-[#2A2622] flex items-center justify-center text-xs font-bold transition-all border border-[#E8E2D8] active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                <span className="font-bold text-xs text-[#2A2622]">
                  Rp {(item.product.price * item.quantity).toLocaleString('id-ID')}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="p-4 border-t border-[#E8E2D8] bg-white space-y-3 shrink-0 shadow-md">
        <div className="flex items-center justify-between text-xs">
          <span className="text-[#8A8175] flex items-center gap-1 font-medium">
            <Tag className="w-3.5 h-3.5 text-[#D97706]" />
            Diskon
          </span>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={discountValue || ''}
              onChange={(e) => setDiscount(parseFloat(e.target.value) || 0, discountType)}
              placeholder="0"
              className="w-20 bg-[#FAF7F2] border border-[#E8E2D8] rounded-lg px-2 py-1 text-right text-xs text-[#2A2622] focus:outline-none focus:border-[#D97706]"
            />
            <select
              value={discountType}
              onChange={(e) => setDiscount(discountValue, e.target.value as any)}
              className="bg-[#FAF7F2] border border-[#E8E2D8] rounded-lg px-1.5 py-1 text-xs text-[#2A2622] focus:outline-none"
            >
              <option value="nominal">Rp</option>
              <option value="percent">%</option>
            </select>
          </div>
        </div>

        <div className="space-y-1.5 pt-2 border-t border-[#E8E2D8] text-xs">
          <div className="flex justify-between text-[#8A8175]">
            <span>Subtotal:</span>
            <span className="font-semibold text-[#2A2622]">Rp {subtotal.toLocaleString('id-ID')}</span>
          </div>
          {discountAmount > 0 && (
            <div className="flex justify-between text-[#B84B3E]">
              <span>Diskon:</span>
              <span className="font-semibold">-Rp {discountAmount.toLocaleString('id-ID')}</span>
            </div>
          )}
          {taxAmount > 0 && (
            <div className="flex justify-between text-[#8A8175]">
              <span>Pajak (PPN {taxRate}%):</span>
              <span className="font-semibold text-[#2A2622]">Rp {taxAmount.toLocaleString('id-ID')}</span>
            </div>
          )}

          <div className="flex justify-between items-center text-[#2A2622] font-bold text-base pt-2 border-t border-[#E8E8D8]">
            <span>TOTAL BAYAR:</span>
            <span className="text-[#D97706] text-xl font-black">Rp {totalAmount.toLocaleString('id-ID')}</span>
          </div>
        </div>

        <button
          disabled={cart.length === 0}
          onClick={onCheckout}
          className="w-full py-3.5 rounded-xl bg-[#D97706] hover:bg-[#B45309] text-white font-extrabold text-sm shadow-md disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all active:scale-[0.98] min-h-[48px]"
        >
          <span>BAYAR SEKARANG</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
