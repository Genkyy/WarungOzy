import { create } from 'zustand';
import { MenuItem, CartItem, Order, Category, StoreSettings, ScannedBarcodeLog, BluetoothScannerStatus } from '../types';
import { repository } from '../services/indexedDBRepository';

interface POSState {
  // Navigation
  activeTab: 'pos' | 'orders' | 'dashboard' | 'stock' | 'expenses' | 'settings';
  setActiveTab: (tab: 'pos' | 'orders' | 'dashboard' | 'stock' | 'expenses' | 'settings') => void;

  // Categories & Master Data
  categories: Category[];
  products: MenuItem[];
  selectedCategoryId: number; // 0 = All
  searchQuery: string;
  settings: StoreSettings;
  isLoading: boolean;

  // Actions for Master Data
  fetchMasterData: () => Promise<void>;
  setSelectedCategoryId: (catId: number) => void;
  setSearchQuery: (query: string) => void;

  // Cart State
  cart: CartItem[];
  discountAmount: number;
  discountType: 'nominal' | 'percent';
  discountValue: number;
  taxRate: number; // e.g. 0%
  customerName: string;
  orderNotes: string;

  // Cart Actions
  addToCart: (product: MenuItem, quantity?: number) => void;
  removeFromCart: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  updateItemNotes: (productId: number, notes: string) => void;
  setDiscount: (value: number, type: 'nominal' | 'percent') => void;
  setCustomerName: (name: string) => void;
  setOrderNotes: (notes: string) => void;
  clearCart: () => void;

  // Modals & Popups
  isPaymentModalOpen: boolean;
  setPaymentModalOpen: (open: boolean) => void;
  isReceiptModalOpen: boolean;
  setReceiptModalOpen: (open: boolean) => void;
  isCameraScannerOpen: boolean;
  setCameraScannerOpen: (open: boolean) => void;
  isAddProductModalOpen: boolean;
  setAddProductModalOpen: (open: boolean) => void;
  isBluetoothModalOpen: boolean;
  setBluetoothModalOpen: (open: boolean) => void;

  // Bluetooth & Hardware Scanner Live Log & Status State
  lastScannedBarcode: ScannedBarcodeLog | null;
  setLastScannedBarcode: (log: ScannedBarcodeLog | null) => void;
  scannerConnectionStatus: BluetoothScannerStatus;
  setScannerConnectionStatus: (status: BluetoothScannerStatus) => void;
  scannerDeviceName: string;
  setScannerDeviceName: (name: string) => void;

  // Last Completed Order for Struk
  lastCompletedOrder: Order | null;
  setLastCompletedOrder: (order: Order | null) => void;

  // Toast notifications
  toastMessage: string | null;
  toastType: 'success' | 'error' | 'info';
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  hideToast: () => void;

  // Custom In-App Confirm Dialog Config
  confirmModalConfig: {
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'warning' | 'danger' | 'info';
    onConfirm: () => void;
  } | null;
  showConfirm: (config: {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'warning' | 'danger' | 'info';
    onConfirm: () => void;
  }) => void;
  hideConfirm: () => void;
}

export const usePOSStore = create<POSState>((set, get) => ({
  activeTab: 'pos',
  setActiveTab: (tab) => set({ activeTab: tab }),

  categories: [],
  products: [],
  selectedCategoryId: 0,
  searchQuery: '',
  settings: {
    outlet_name: 'Warung Ozy',
    tax_rate: '0',
    currency: 'IDR',
    receipt_footer: 'Terima kasih telah berbelanja di Warung Ozy!',
    low_stock_threshold: '5',
    enable_bluetooth_scanner: 'true',
    scanner_beep_sound: 'true',
    scanner_max_delay: '80'
  },
  isLoading: false,

  fetchMasterData: async () => {
    set({ isLoading: true });
    try {
      const [cats, prods, rawSettings] = await Promise.all([
        repository.getCategories(),
        repository.getMenuItems(),
        repository.getSettings()
      ]);

      const settings: StoreSettings = {
        outlet_name: rawSettings.outlet_name || 'Warung Ozy',
        tax_rate: rawSettings.tax_rate || '0',
        currency: rawSettings.currency || 'IDR',
        receipt_footer: rawSettings.receipt_footer || 'Terima kasih telah berbelanja di Warung Ozy!',
        low_stock_threshold: rawSettings.low_stock_threshold || '5',
        enable_bluetooth_scanner: rawSettings.enable_bluetooth_scanner ?? 'true',
        scanner_beep_sound: rawSettings.scanner_beep_sound ?? 'true',
        scanner_max_delay: rawSettings.scanner_max_delay || '80'
      };

      set({
        categories: cats,
        products: prods,
        settings,
        taxRate: parseFloat(settings.tax_rate) || 0,
        isLoading: false
      });
    } catch (err) {
      console.error('Failed to fetch master data:', err);
      set({ isLoading: false });
    }
  },

  setSelectedCategoryId: (catId) => set({ selectedCategoryId: catId }),
  setSearchQuery: (query) => set({ searchQuery: query }),

  cart: [],
  discountAmount: 0,
  discountType: 'nominal',
  discountValue: 0,
  taxRate: 0,
  customerName: 'Pelanggan Umum',
  orderNotes: '',

  addToCart: (product, qty = 1) => {
    const { cart, showToast } = get();
    if (product.stock <= 0) {
      showToast(`Stok ${product.name} habis!`, 'error');
      return;
    }

    const existingIndex = cart.findIndex((item) => item.product.id === product.id);
    if (existingIndex > -1) {
      const currentQty = cart[existingIndex].quantity;
      if (currentQty + qty > product.stock) {
        showToast(`Stok ${product.name} hanya tersisa ${product.stock}`, 'error');
        return;
      }

      const updatedCart = [...cart];
      updatedCart[existingIndex].quantity += qty;
      set({ cart: updatedCart });
      showToast(`+${qty} ${product.name} dimasukkan ke keranjang`, 'success');
    } else {
      set({ cart: [...cart, { product, quantity: qty }] });
      showToast(`${product.name} dimasukkan ke keranjang`, 'success');
    }
  },

  removeFromCart: (productId) => {
    const { cart } = get();
    set({ cart: cart.filter((item) => item.product.id !== productId) });
  },

  updateQuantity: (productId, quantity) => {
    const { cart, showToast } = get();
    if (quantity <= 0) {
      get().removeFromCart(productId);
      return;
    }

    const item = cart.find((i) => i.product.id === productId);
    if (item && quantity > item.product.stock) {
      showToast(`Stok maksimal ${item.product.name} adalah ${item.product.stock}`, 'error');
      return;
    }

    set({
      cart: cart.map((i) => (i.product.id === productId ? { ...i, quantity } : i))
    });
  },

  updateItemNotes: (productId, notes) => {
    const { cart } = get();
    set({
      cart: cart.map((i) => (i.product.id === productId ? { ...i, notes } : i))
    });
  },

  setDiscount: (value, type) => {
    set({ discountValue: value, discountType: type });
  },

  setCustomerName: (name) => set({ customerName: name }),
  setOrderNotes: (notes) => set({ orderNotes: notes }),

  clearCart: () => set({
    cart: [],
    discountAmount: 0,
    discountValue: 0,
    discountType: 'nominal',
    customerName: 'Pelanggan Umum',
    orderNotes: ''
  }),

  isPaymentModalOpen: false,
  setPaymentModalOpen: (open) => set({ isPaymentModalOpen: open }),

  isReceiptModalOpen: false,
  setReceiptModalOpen: (open) => set({ isReceiptModalOpen: open }),

  isCameraScannerOpen: false,
  setCameraScannerOpen: (open) => set({ isCameraScannerOpen: open }),

  isAddProductModalOpen: false,
  setAddProductModalOpen: (open) => set({ isAddProductModalOpen: open }),

  isBluetoothModalOpen: false,
  setBluetoothModalOpen: (open) => set({ isBluetoothModalOpen: open }),

  lastScannedBarcode: null,
  setLastScannedBarcode: (log) => set({ lastScannedBarcode: log }),

  scannerConnectionStatus: 'connected',
  setScannerConnectionStatus: (status) => set({ scannerConnectionStatus: status }),
  scannerDeviceName: 'Bluetooth Barcode Scanner (HID)',
  setScannerDeviceName: (name) => set({ scannerDeviceName: name }),

  lastCompletedOrder: null,
  setLastCompletedOrder: (order) => set({ lastCompletedOrder: order }),

  toastMessage: null,
  toastType: 'info',
  showToast: (message, type = 'info') => {
    set({ toastMessage: message, toastType: type });
    setTimeout(() => {
      set({ toastMessage: null });
    }, 3000);
  },
  hideToast: () => set({ toastMessage: null }),

  confirmModalConfig: null,
  showConfirm: (config) =>
    set({
      confirmModalConfig: {
        ...config,
        isOpen: true
      }
    }),
  hideConfirm: () =>
    set((state) => ({
      confirmModalConfig: state.confirmModalConfig
        ? { ...state.confirmModalConfig, isOpen: false }
        : null
    }))
}));
