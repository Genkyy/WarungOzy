import { createClient } from '@supabase/supabase-js';
import {
  Category,
  MenuItem,
  Order,
  OrderItem,
  Payment,
  StockMovement,
  Expense,
  CreateOrderDTO
} from '../types';
import { DatabaseRepository } from './dbRepository';
import { DEFAULT_CATEGORIES, repository as indexedDBRepository } from './indexedDBRepository';

const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder'
);

export const DEFAULT_SETTINGS = [
  { key: 'outlet_name', value: 'Warung Ozy' },
  { key: 'tax_rate', value: '0' },
  { key: 'currency', value: 'IDR' },
  { key: 'receipt_footer', value: 'Terima kasih telah berbelanja di Warung Ozy!' },
  { key: 'low_stock_threshold', value: '5' }
];

export class SupabaseRepository implements DatabaseRepository {
  private isConfigured(): boolean {
    if (!supabaseUrl || !supabaseAnonKey) return false;
    if (supabaseUrl.includes('placeholder') || supabaseUrl.includes('your-project-ref')) return false;
    if (supabaseAnonKey.includes('placeholder') || supabaseAnonKey.includes('your-anon-key')) return false;
    return true;
  }

  // Helper to ensure database has initial seed if table is completely empty
  async seedDatabaseIfNeeded() {
    if (!this.isConfigured()) return;
    try {
      const { count } = await supabase.from('categories').select('*', { count: 'exact', head: true });
      if (count === 0) {
        await this.resetDatabaseWithSeedData();
      }
    } catch (err) {
      console.warn('Supabase check table seed error:', err);
    }
  }

  async resetDatabaseWithSeedData(): Promise<void> {
    if (!this.isConfigured()) {
      return indexedDBRepository.resetDatabaseWithSeedData();
    }

    try {
      // Delete existing records in reverse dependency order
      await supabase.from('stock_movements').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('payments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('order_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('orders').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('menu_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('categories').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('expenses').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('settings').delete().neq('key', '');

      // Insert Default Categories
      const catMap: Record<string, string> = {};
      for (const cat of DEFAULT_CATEGORIES) {
        const { data, error } = await supabase
          .from('categories')
          .insert({
            name: cat.name,
            icon: cat.icon,
            sort_order: cat.sort_order,
            is_active: cat.is_active,
            created_at: new Date().toISOString()
          })
          .select()
          .single();

        if (!error && data) {
          catMap[cat.name] = data.id;
        }
      }

      // Default Products List
      const defaultProducts = [
        {
          category_id: catMap['Makanan & Snack'] || Object.values(catMap)[0],
          name: 'Indomie Goreng Spesial 85g',
          description: 'Mie instan goreng favorit warung kelontong',
          price: 3500,
          cost_price: 2800,
          barcode: '8992388213148',
          stock: 120,
          unit: 'Bungkus',
          is_available: true,
          sort_order: 1,
          image_path: 'https://images.unsplash.com/photo-1612927601601-6638404737ce?w=300&auto=format&fit=crop&q=80',
          created_at: new Date().toISOString()
        },
        {
          category_id: catMap['Makanan & Snack'] || Object.values(catMap)[0],
          name: 'Chitato Keju Supreme 68g',
          description: 'Keripik kentang rasa keju gurih',
          price: 9000,
          cost_price: 6500,
          barcode: '8993398000037',
          stock: 18,
          unit: 'Bungkus',
          is_available: true,
          sort_order: 2,
          image_path: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=300&auto=format&fit=crop&q=80',
          created_at: new Date().toISOString()
        },
        {
          category_id: catMap['Minuman'] || Object.values(catMap)[0],
          name: 'Aqua 600ml Botol',
          description: 'Air mineral kemasan botol 600ml',
          price: 3000,
          cost_price: 2000,
          barcode: '8998866800004',
          stock: 48,
          unit: 'Botol',
          is_available: true,
          sort_order: 1,
          image_path: 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=300&auto=format&fit=crop&q=80',
          created_at: new Date().toISOString()
        },
        {
          category_id: catMap['Minuman'] || Object.values(catMap)[0],
          name: 'Teh Botol Sosro 450ml',
          description: 'Teh melati dalam botol pet 450ml',
          price: 4000,
          cost_price: 2500,
          barcode: '8992388005006',
          stock: 24,
          unit: 'Botol',
          is_available: true,
          sort_order: 2,
          image_path: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=300&auto=format&fit=crop&q=80',
          created_at: new Date().toISOString()
        },
        {
          category_id: catMap['Minuman'] || Object.values(catMap)[0],
          name: 'Pocari Sweat 500ml',
          description: 'Minuman isotonik kemasan botol',
          price: 8000,
          cost_price: 5500,
          barcode: '4901080019646',
          stock: 15,
          unit: 'Botol',
          is_available: true,
          sort_order: 3,
          image_path: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=300&auto=format&fit=crop&q=80',
          created_at: new Date().toISOString()
        },
        {
          category_id: catMap['Sembako & Dapur'] || Object.values(catMap)[0],
          name: 'Beras Premium 1kg',
          description: 'Beras putih pulen bermutu tinggi',
          price: 18000,
          cost_price: 14000,
          barcode: '8997018850017',
          stock: 50,
          unit: 'Kg',
          is_available: true,
          sort_order: 1,
          image_path: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=300&auto=format&fit=crop&q=80',
          created_at: new Date().toISOString()
        },
        {
          category_id: catMap['Sembako & Dapur'] || Object.values(catMap)[0],
          name: 'Minyak Goreng Sawit 1L',
          description: 'Minyak goreng jernih kemasan refill',
          price: 20000,
          cost_price: 16000,
          barcode: '8993398430065',
          stock: 30,
          unit: 'Liter',
          is_available: true,
          sort_order: 2,
          image_path: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=300&auto=format&fit=crop&q=80',
          created_at: new Date().toISOString()
        },
        {
          category_id: catMap['Top Up & Digital'] || Object.values(catMap)[0],
          name: 'Top Up DANA / OVO / GoPay 20k',
          description: 'Isi ulang saldo e-wallet Rp 20.000',
          price: 22000,
          cost_price: 20000,
          barcode: '',
          stock: 9999,
          unit: 'Pcs',
          is_available: true,
          sort_order: 1,
          image_path: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=300&auto=format&fit=crop&q=80',
          created_at: new Date().toISOString()
        },
        {
          category_id: catMap['Rokok & Tembakau'] || Object.values(catMap)[0],
          name: 'Sampoerna A Mild 16',
          description: 'Rokok filter isi 16 batang',
          price: 33000,
          cost_price: 30000,
          barcode: '8991002101166',
          stock: 20,
          unit: 'Bungkus',
          is_available: true,
          sort_order: 1,
          image_path: 'https://images.unsplash.com/photo-1527061011665-3652c757a4d4?w=300&auto=format&fit=crop&q=80',
          created_at: new Date().toISOString()
        }
      ];

      for (const prod of defaultProducts) {
        const { data: prodData } = await supabase
          .from('menu_items')
          .insert(prod)
          .select()
          .single();

        if (prodData && prod.stock > 0) {
          await supabase.from('stock_movements').insert({
            product_id: prodData.id,
            product_name: prod.name,
            delta: prod.stock,
            reason: 'initial',
            created_at: new Date().toISOString()
          });
        }
      }

      // Insert Default Settings
      for (const s of DEFAULT_SETTINGS) {
        await supabase.from('settings').upsert(s);
      }

      // Insert Sample Expenses
      await supabase.from('expenses').insert([
        {
          category: 'operasional',
          description: 'Pembayaran Listrik & Toko',
          amount: 150000,
          expense_date: new Date().toISOString().split('T')[0],
          notes: 'Tagihan listrik bulanan',
          created_at: new Date().toISOString()
        },
        {
          category: 'belanja_barang',
          description: 'Kulakan Beras & Minyak di Pasar Grosir',
          amount: 850000,
          expense_date: new Date().toISOString().split('T')[0],
          notes: 'Stok beras 50kg dan minyak 30L',
          created_at: new Date().toISOString()
        }
      ]);
    } catch (err) {
      console.warn('Supabase reset error, falling back to IndexedDB:', err);
      await indexedDBRepository.resetDatabaseWithSeedData();
    }
  }

  // Categories
  async getCategories(): Promise<Category[]> {
    if (!this.isConfigured()) {
      return indexedDBRepository.getCategories();
    }
    try {
      await this.seedDatabaseIfNeeded();
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error || !data || data.length === 0) {
        console.warn('Supabase getCategories error/empty, falling back to IndexedDB:', error);
        return indexedDBRepository.getCategories();
      }
      return data;
    } catch (err) {
      console.warn('Supabase getCategories exception, falling back to IndexedDB:', err);
      return indexedDBRepository.getCategories();
    }
  }

  async createCategory(category: Omit<Category, 'id'>): Promise<Category> {
    if (!this.isConfigured()) {
      return indexedDBRepository.createCategory(category);
    }
    try {
      const { data, error } = await supabase
        .from('categories')
        .insert({
          name: category.name,
          icon: category.icon,
          sort_order: category.sort_order,
          is_active: category.is_active ?? true,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error || !data) {
        console.warn('Supabase createCategory error, falling back to IndexedDB:', error);
        return indexedDBRepository.createCategory(category);
      }
      return data;
    } catch (err) {
      console.warn('Supabase createCategory exception, falling back to IndexedDB:', err);
      return indexedDBRepository.createCategory(category);
    }
  }

  // Products
  async getMenuItems(categoryId?: number | string): Promise<MenuItem[]> {
    if (!this.isConfigured()) {
      return indexedDBRepository.getMenuItems(categoryId);
    }
    try {
      await this.seedDatabaseIfNeeded();
      let query = supabase.from('menu_items').select('*');
      if (categoryId) {
        query = query.eq('category_id', categoryId);
      }
      const { data, error } = await query;
      if (error || !data) {
        console.warn('Supabase getMenuItems error, falling back to IndexedDB:', error);
        return indexedDBRepository.getMenuItems(categoryId);
      }
      return data;
    } catch (err) {
      console.warn('Supabase getMenuItems exception, falling back to IndexedDB:', err);
      return indexedDBRepository.getMenuItems(categoryId);
    }
  }

  async searchMenuItems(query: string): Promise<MenuItem[]> {
    if (!this.isConfigured()) {
      return indexedDBRepository.searchMenuItems(query);
    }
    try {
      await this.seedDatabaseIfNeeded();
      const q = query.toLowerCase().trim();
      if (!q) return this.getMenuItems();

      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .or(`name.ilike.%${q}%,barcode.ilike.%${q}%,description.ilike.%${q}%`);

      if (error || !data) {
        console.warn('Supabase searchMenuItems error, falling back to IndexedDB:', error);
        return indexedDBRepository.searchMenuItems(query);
      }
      return data;
    } catch (err) {
      console.warn('Supabase searchMenuItems exception, falling back to IndexedDB:', err);
      return indexedDBRepository.searchMenuItems(query);
    }
  }

  async findProductByBarcode(barcode: string): Promise<MenuItem | null> {
    if (!this.isConfigured()) {
      return indexedDBRepository.findProductByBarcode(barcode);
    }
    try {
      await this.seedDatabaseIfNeeded();
      if (!barcode) return null;
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('barcode', barcode.trim())
        .maybeSingle();

      if (error) {
        console.warn('Supabase findProductByBarcode error, falling back to IndexedDB:', error);
        return indexedDBRepository.findProductByBarcode(barcode);
      }
      return data || null;
    } catch (err) {
      console.warn('Supabase findProductByBarcode exception, falling back to IndexedDB:', err);
      return indexedDBRepository.findProductByBarcode(barcode);
    }
  }

  async createMenuItem(product: Omit<MenuItem, 'id'>): Promise<MenuItem> {
    if (!this.isConfigured()) {
      return indexedDBRepository.createMenuItem(product);
    }
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .insert({
          category_id: product.category_id,
          name: product.name,
          description: product.description || '',
          price: product.price,
          cost_price: product.cost_price || 0,
          image_path: product.image_path || '',
          barcode: product.barcode || '',
          stock: product.stock,
          unit: product.unit,
          is_available: product.is_available ?? true,
          sort_order: product.sort_order ?? 0,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error || !data) {
        console.warn('Supabase createMenuItem error, falling back to IndexedDB:', error);
        return indexedDBRepository.createMenuItem(product);
      }

      if (product.stock > 0) {
        await supabase.from('stock_movements').insert({
          product_id: data.id,
          product_name: product.name,
          delta: product.stock,
          reason: 'initial',
          created_at: new Date().toISOString()
        });
      }

      return data;
    } catch (err) {
      console.warn('Supabase createMenuItem exception, falling back to IndexedDB:', err);
      return indexedDBRepository.createMenuItem(product);
    }
  }

  async updateMenuItem(id: number | string, product: Partial<MenuItem>): Promise<void> {
    if (!this.isConfigured()) {
      return indexedDBRepository.updateMenuItem(id, product);
    }
    try {
      const { error } = await supabase
        .from('menu_items')
        .update(product)
        .eq('id', id);

      if (error) {
        console.warn('Supabase updateMenuItem error, falling back to IndexedDB:', error);
        return indexedDBRepository.updateMenuItem(id, product);
      }
    } catch (err) {
      console.warn('Supabase updateMenuItem exception, falling back to IndexedDB:', err);
      return indexedDBRepository.updateMenuItem(id, product);
    }
  }

  async deleteMenuItem(id: number | string): Promise<void> {
    if (!this.isConfigured()) {
      return indexedDBRepository.deleteMenuItem(id);
    }
    try {
      const { error } = await supabase
        .from('menu_items')
        .delete()
        .eq('id', id);

      if (error) {
        console.warn('Supabase deleteMenuItem error, falling back to IndexedDB:', error);
        return indexedDBRepository.deleteMenuItem(id);
      }
    } catch (err) {
      console.warn('Supabase deleteMenuItem exception, falling back to IndexedDB:', err);
      return indexedDBRepository.deleteMenuItem(id);
    }
  }

  // Orders & Checkout (Atomic via Stored Procedure RPC)
  async createOrder(orderData: CreateOrderDTO): Promise<Order> {
    if (!this.isConfigured()) {
      return indexedDBRepository.createOrder(orderData);
    }
    try {
      const { data, error } = await supabase.rpc('create_order', {
        p_customer_name: orderData.customer_name || 'Pelanggan Umum',
        p_order_type: orderData.order_type || 'retail',
        p_items: orderData.items,
        p_tax_amount: orderData.tax_amount,
        p_discount_amount: orderData.discount_amount,
        p_notes: orderData.notes || '',
        p_payment_method: orderData.payment.method,
        p_payment_amount: orderData.payment.amount,
        p_reference_number: orderData.payment.reference_number || ''
      });

      if (error || !data) {
        console.warn('Supabase create_order RPC error, falling back to IndexedDB:', error);
        return indexedDBRepository.createOrder(orderData);
      }

      return data as Order;
    } catch (err) {
      console.warn('Supabase createOrder exception, falling back to IndexedDB:', err);
      return indexedDBRepository.createOrder(orderData);
    }
  }

  async getOrders(status?: string): Promise<Order[]> {
    if (!this.isConfigured()) {
      return indexedDBRepository.getOrders(status);
    }
    try {
      await this.seedDatabaseIfNeeded();
      let query = supabase.from('orders').select('*').order('created_at', { ascending: false });
      if (status) {
        query = query.eq('status', status);
      }
      const { data, error } = await query;
      if (error || !data) {
        console.warn('Supabase getOrders error, falling back to IndexedDB:', error);
        return indexedDBRepository.getOrders(status);
      }
      return data;
    } catch (err) {
      console.warn('Supabase getOrders exception, falling back to IndexedDB:', err);
      return indexedDBRepository.getOrders(status);
    }
  }

  async getOrderDetails(orderId: number | string): Promise<{ order: Order; items: OrderItem[]; payment?: Payment } | null> {
    if (!this.isConfigured()) {
      return indexedDBRepository.getOrderDetails(orderId);
    }
    try {
      const [orderRes, itemsRes, paymentRes] = await Promise.all([
        supabase.from('orders').select('*').eq('id', orderId).single(),
        supabase.from('order_items').select('*').eq('order_id', orderId),
        supabase.from('payments').select('*').eq('order_id', orderId).maybeSingle()
      ]);

      if (orderRes.error || !orderRes.data) {
        return indexedDBRepository.getOrderDetails(orderId);
      }

      return {
        order: orderRes.data,
        items: itemsRes.data || [],
        payment: paymentRes.data || undefined
      };
    } catch (err) {
      return indexedDBRepository.getOrderDetails(orderId);
    }
  }

  async updateOrderStatus(id: number | string, status: 'completed' | 'cancelled'): Promise<void> {
    if (!this.isConfigured()) {
      return indexedDBRepository.updateOrderStatus(id, status);
    }
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', id);

      if (error) {
        return indexedDBRepository.updateOrderStatus(id, status);
      }
    } catch (err) {
      return indexedDBRepository.updateOrderStatus(id, status);
    }
  }

  async voidOrder(id: number | string): Promise<void> {
    if (!this.isConfigured()) {
      return indexedDBRepository.voidOrder(id);
    }
    try {
      const { error } = await supabase.rpc('void_order', { p_order_id: id });
      if (error) {
        console.warn('Supabase void_order RPC error, falling back to IndexedDB:', error);
        return indexedDBRepository.voidOrder(id);
      }
    } catch (err) {
      return indexedDBRepository.voidOrder(id);
    }
  }

  async deleteOrder(id: number | string): Promise<void> {
    if (!this.isConfigured()) {
      return indexedDBRepository.deleteOrder(id);
    }
    try {
      const { error } = await supabase.from('orders').delete().eq('id', id);
      if (error) {
        return indexedDBRepository.deleteOrder(id);
      }
    } catch (err) {
      return indexedDBRepository.deleteOrder(id);
    }
  }

  // Expenses
  async getExpenses(): Promise<Expense[]> {
    if (!this.isConfigured()) {
      return indexedDBRepository.getExpenses();
    }
    try {
      await this.seedDatabaseIfNeeded();
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .order('expense_date', { ascending: false });

      if (error || !data) {
        return indexedDBRepository.getExpenses();
      }
      return data;
    } catch (err) {
      return indexedDBRepository.getExpenses();
    }
  }

  async createExpense(expense: Omit<Expense, 'id'>): Promise<Expense> {
    if (!this.isConfigured()) {
      return indexedDBRepository.createExpense(expense);
    }
    try {
      const { data, error } = await supabase
        .from('expenses')
        .insert({
          category: expense.category,
          description: expense.description,
          amount: expense.amount,
          expense_date: expense.expense_date,
          notes: expense.notes || '',
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error || !data) {
        return indexedDBRepository.createExpense(expense);
      }
      return data;
    } catch (err) {
      return indexedDBRepository.createExpense(expense);
    }
  }

  async deleteExpense(id: number | string): Promise<void> {
    if (!this.isConfigured()) {
      return indexedDBRepository.deleteExpense(id);
    }
    try {
      const { error } = await supabase.from('expenses').delete().eq('id', id);
      if (error) {
        return indexedDBRepository.deleteExpense(id);
      }
    } catch (err) {
      return indexedDBRepository.deleteExpense(id);
    }
  }

  // Stock Audit
  async adjustStock(productId: number | string, delta: number, reason: StockMovement['reason']): Promise<void> {
    if (!this.isConfigured()) {
      return indexedDBRepository.adjustStock(productId, delta, reason);
    }
    try {
      const { error } = await supabase.rpc('adjust_stock', {
        p_product_id: productId,
        p_delta: delta,
        p_reason: reason
      });

      if (error) {
        return indexedDBRepository.adjustStock(productId, delta, reason);
      }
    } catch (err) {
      return indexedDBRepository.adjustStock(productId, delta, reason);
    }
  }

  async getStockMovements(productId?: number | string): Promise<StockMovement[]> {
    if (!this.isConfigured()) {
      return indexedDBRepository.getStockMovements(productId);
    }
    try {
      await this.seedDatabaseIfNeeded();
      let query = supabase.from('stock_movements').select('*').order('created_at', { ascending: false });
      if (productId) {
        query = query.eq('product_id', productId);
      }
      const { data, error } = await query;
      if (error || !data) {
        return indexedDBRepository.getStockMovements(productId);
      }
      return data;
    } catch (err) {
      return indexedDBRepository.getStockMovements(productId);
    }
  }

  // Settings
  async getSettings(): Promise<Record<string, string>> {
    if (!this.isConfigured()) {
      return indexedDBRepository.getSettings();
    }
    try {
      await this.seedDatabaseIfNeeded();
      const { data, error } = await supabase.from('settings').select('*');
      if (error || !data) {
        return indexedDBRepository.getSettings();
      }
      const map: Record<string, string> = {};
      for (const item of data) {
        map[item.key] = item.value;
      }
      return map;
    } catch (err) {
      return indexedDBRepository.getSettings();
    }
  }

  async updateSettings(settingsMap: Record<string, string>): Promise<void> {
    if (!this.isConfigured()) {
      return indexedDBRepository.updateSettings(settingsMap);
    }
    try {
      const upsertRows = Object.entries(settingsMap).map(([key, value]) => ({ key, value }));
      const { error } = await supabase.from('settings').upsert(upsertRows);
      if (error) {
        return indexedDBRepository.updateSettings(settingsMap);
      }
    } catch (err) {
      return indexedDBRepository.updateSettings(settingsMap);
    }
  }

  // Export / Import Database JSON
  async exportDatabaseJSON(): Promise<string> {
    if (!this.isConfigured()) {
      return indexedDBRepository.exportDatabaseJSON();
    }
    try {
      await this.seedDatabaseIfNeeded();
      const [catRes, prodRes, ordRes, ordItemsRes, payRes, stockRes, expRes, setRes] = await Promise.all([
        supabase.from('categories').select('*'),
        supabase.from('menu_items').select('*'),
        supabase.from('orders').select('*'),
        supabase.from('order_items').select('*'),
        supabase.from('payments').select('*'),
        supabase.from('stock_movements').select('*'),
        supabase.from('expenses').select('*'),
        supabase.from('settings').select('*')
      ]);

      const backupData = {
        version: 1,
        appName: 'WarungOzyPOS',
        exportDate: new Date().toISOString(),
        categories: catRes.data || [],
        menuItems: prodRes.data || [],
        orders: ordRes.data || [],
        orderItems: ordItemsRes.data || [],
        payments: payRes.data || [],
        stockMovements: stockRes.data || [],
        expenses: expRes.data || [],
        settings: setRes.data || []
      };
      return JSON.stringify(backupData, null, 2);
    } catch (err) {
      return indexedDBRepository.exportDatabaseJSON();
    }
  }

  async importDatabaseJSON(jsonStr: string): Promise<void> {
    if (!this.isConfigured()) {
      return indexedDBRepository.importDatabaseJSON(jsonStr);
    }
    try {
      const data = JSON.parse(jsonStr);
      if (!data.categories || !data.menuItems) {
        throw new Error('Format file cadangan backup tidak valid!');
      }

      // Clean existing tables
      await supabase.from('stock_movements').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('payments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('order_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('orders').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('menu_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('categories').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('expenses').delete().neq('id', '00000000-0000-0000-0000-000000000000');

      // Bulk insert in topological order
      if (data.categories?.length) await supabase.from('categories').insert(data.categories);
      if (data.menuItems?.length) await supabase.from('menu_items').insert(data.menuItems);
      if (data.orders?.length) await supabase.from('orders').insert(data.orders);
      if (data.orderItems?.length) await supabase.from('order_items').insert(data.orderItems);
      if (data.payments?.length) await supabase.from('payments').insert(data.payments);
      if (data.stockMovements?.length) await supabase.from('stock_movements').insert(data.stockMovements);
      if (data.expenses?.length) await supabase.from('expenses').insert(data.expenses);
      if (data.settings?.length) await supabase.from('settings').upsert(data.settings);
    } catch (err) {
      await indexedDBRepository.importDatabaseJSON(jsonStr);
    }
  }
}

export const repository = new SupabaseRepository();
