export interface Category {
  id?: number;
  name: string;
  icon: string;
  sort_order: number;
  is_active: boolean;
  created_at?: string;
}

export interface MenuItem {
  id?: number;
  category_id: number;
  name: string;
  description?: string;
  price: number;
  cost_price: number;
  image_path?: string;
  barcode?: string;
  stock: number;
  unit: string; // 'Pcs' | 'Kg' | 'Botol' | 'Bungkus' | 'Liter' | 'Renteng'
  is_available: boolean;
  sort_order: number;
  created_at?: string;
}

export interface OrderItem {
  id?: number;
  order_id?: number;
  menu_item_id: number;
  product_name?: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  notes?: string;
}

export interface Payment {
  id?: number;
  order_id?: number;
  method: 'cash' | 'qris' | 'ewallet' | 'card';
  amount: number;
  change_amount: number;
  reference_number?: string;
  created_at?: string;
}

export interface Order {
  id?: number;
  order_number: string;
  customer_name?: string;
  order_type: 'retail';
  status: 'completed' | 'cancelled' | 'pending';
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  notes?: string;
  created_at: string;
  items?: OrderItem[];
  payment?: Payment;
}

export interface CreateOrderDTO {
  customer_name?: string;
  order_type?: 'retail';
  items: Array<{
    menu_item_id: number;
    quantity: number;
    unit_price: number;
    notes?: string;
  }>;
  tax_amount: number;
  discount_amount: number;
  notes?: string;
  payment: {
    method: 'cash' | 'qris' | 'ewallet' | 'card';
    amount: number;
    reference_number?: string;
  };
}

export interface StockMovement {
  id?: number;
  product_id: number;
  product_name?: string;
  delta: number;
  reason: 'sale' | 'adjustment_in' | 'adjustment_out' | 'return' | 'initial';
  order_id?: number;
  created_at: string;
}

export interface Expense {
  id?: number;
  category: 'belanja_barang' | 'operasional' | 'gaji' | 'lainnya';
  description: string;
  amount: number;
  expense_date: string;
  notes?: string;
  created_at?: string;
}

export interface StoreSettings {
  outlet_name: string;
  tax_rate: string;
  currency: string;
  receipt_footer: string;
  low_stock_threshold: string;
  enable_bluetooth_scanner?: string; // 'true' | 'false'
  scanner_beep_sound?: string; // 'true' | 'false'
  scanner_max_delay?: string; // ms delay, default '80'
}

export interface CartItem {
  product: MenuItem;
  quantity: number;
  notes?: string;
}

export interface ScannedBarcodeLog {
  barcode: string;
  timestamp: number;
  success: boolean;
  productName?: string;
  scanSpeedMs?: number;
}

export type BluetoothScannerStatus = 'connected' | 'standby' | 'disconnected';


