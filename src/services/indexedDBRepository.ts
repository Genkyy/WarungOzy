import Dexie, { Table } from 'dexie';
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
import { isDigitalUnit } from '../utils/productUtils';

class WarungOzyDB extends Dexie {
  categories!: Table<Category, number>;
  menuItems!: Table<MenuItem, number>;
  orders!: Table<Order, number>;
  orderItems!: Table<OrderItem, number>;
  payments!: Table<Payment, number>;
  stockMovements!: Table<StockMovement, number>;
  expenses!: Table<Expense, number>;
  settings!: Table<{ key: string; value: string }, string>;

  constructor() {
    super('WarungOzyPOSDB');
    this.version(1).stores({
      categories: '++id, name, sort_order, is_active',
      menuItems: '++id, category_id, name, barcode, stock, is_available',
      orders: '++id, &order_number, status, created_at',
      orderItems: '++id, order_id, menu_item_id',
      payments: '++id, order_id, method',
      stockMovements: '++id, product_id, reason, created_at',
      expenses: '++id, category, expense_date',
      settings: '&key'
    });
  }
}

export const db = new WarungOzyDB();

// Indomaret / Minimarket Categories
export const DEFAULT_CATEGORIES: Omit<Category, 'id'>[] = [
  { name: 'Makanan & Snack', icon: 'Utensils', sort_order: 1, is_active: true, created_at: new Date().toISOString() },
  { name: 'Minuman', icon: 'Coffee', sort_order: 2, is_active: true, created_at: new Date().toISOString() },
  { name: 'Sembako & Dapur', icon: 'Package', sort_order: 3, is_active: true, created_at: new Date().toISOString() },
  { name: 'Kesehatan & Perawatan Diri', icon: 'HeartPulse', sort_order: 4, is_active: true, created_at: new Date().toISOString() },
  { name: 'Kebersihan & Rumah Tangga', icon: 'Sparkles', sort_order: 5, is_active: true, created_at: new Date().toISOString() },
  { name: 'Top Up & Digital', icon: 'Zap', sort_order: 6, is_active: true, created_at: new Date().toISOString() },
  { name: 'Rokok & Tembakau', icon: 'Flame', sort_order: 7, is_active: true, created_at: new Date().toISOString() },
];

const DEFAULT_PRODUCTS = (_catIds: Record<string, number>): Omit<MenuItem, 'id'>[] => [];

const SAMPLE_PRODUCT_NAMES = [
  'Indomie Goreng Spesial 85g',
  'Chitato Keju Supreme 68g',
  'Aqua 600ml Botol',
  'Teh Botol Sosro 450ml',
  'Pocari Sweat 500ml',
  'Beras Premium 1kg',
  'Minyak Goreng Sawit 1L',
  'Top Up DANA / OVO / GoPay 20k',
  'Pulsa Telkomsel / XL 50k',
  'Sampoerna A Mild 16',
  'Permen Kopiko (3 Pcs)'
];

const DEFAULT_SETTINGS = [
  { key: 'outlet_name', value: 'Warung Ozy' },
  { key: 'tax_rate', value: '0' },
  { key: 'currency', value: 'IDR' },
  { key: 'receipt_footer', value: 'Terima kasih telah berbelanja di Warung Ozy!' },
  { key: 'low_stock_threshold', value: '5' }
];

export function toDexieKey(id: number | string | undefined | null): number | string {
  if (id === undefined || id === null) return 0;
  if (typeof id === 'number') return id;
  const num = Number(id);
  return isNaN(num) ? id : num;
}

export class IndexedDBRepository implements DatabaseRepository {
  async seedDatabaseIfNeeded() {
    const categoryCount = await db.categories.count();
    const hasMakanan = await db.categories.where('name').equals('Makanan').count();
    const hasTopUp = await db.categories.where('name').equals('Top Up').count();
    
    // Always force clean seed if categories count is not 5 or missing exact 5 names
    if (categoryCount !== 5 || hasMakanan === 0 || hasTopUp === 0) {
      await this.resetDatabaseWithSeedData();
    } else {
      // Auto-remove any remaining sample seed products for production readiness
      const allItems = await db.menuItems.toArray();
      const sampleIdsToDelete = allItems
        .filter((item) => SAMPLE_PRODUCT_NAMES.includes(item.name))
        .map((item) => item.id!);
      if (sampleIdsToDelete.length > 0) {
        await db.menuItems.bulkDelete(sampleIdsToDelete.map(toDexieKey) as any);
      }
    }
  }

  async resetDatabaseWithSeedData(): Promise<void> {
    await db.transaction('rw', [db.categories, db.menuItems, db.orders, db.orderItems, db.payments, db.stockMovements, db.expenses, db.settings], async () => {
      await db.categories.clear();
      await db.menuItems.clear();
      await db.orders.clear();
      await db.orderItems.clear();
      await db.payments.clear();
      await db.stockMovements.clear();
      await db.expenses.clear();
      await db.settings.clear();

      // Seed 5 exact categories
      const catMap: Record<string, number> = {};
      for (const cat of DEFAULT_CATEGORIES) {
        const id = await db.categories.add(cat as Category);
        catMap[cat.name] = id;
      }

      // Seed products
      const products = DEFAULT_PRODUCTS(catMap);
      for (const prod of products) {
        const prodId = await db.menuItems.add(prod as MenuItem);
        if (prod.stock > 0) {
          await db.stockMovements.add({
            product_id: prodId,
            delta: prod.stock,
            reason: 'initial',
            created_at: new Date().toISOString()
          });
        }
      }

      // Seed settings
      for (const s of DEFAULT_SETTINGS) {
        await db.settings.put(s);
      }

      // Seed sample expenses
      await db.expenses.add({
        category: 'operasional',
        description: 'Pembayaran Listrik & Toko',
        amount: 150000,
        expense_date: new Date().toISOString().split('T')[0],
        notes: 'Tagihan listrik bulanan',
        created_at: new Date().toISOString()
      });

      await db.expenses.add({
        category: 'belanja_barang',
        description: 'Kulakan Beras & Minyak di Pasar Grosir',
        amount: 850000,
        expense_date: new Date().toISOString().split('T')[0],
        notes: 'Stok beras 50kg dan minyak 30L',
        created_at: new Date().toISOString()
      });
    });
  }

  // Categories
  async getCategories(): Promise<Category[]> {
    await this.seedDatabaseIfNeeded();
    const cats = await db.categories.toArray();
    return cats.sort((a, b) => a.sort_order - b.sort_order);
  }

  async createCategory(category: Omit<Category, 'id'>): Promise<Category> {
    const id = await db.categories.add({
      ...category,
      created_at: new Date().toISOString()
    });
    return { ...category, id };
  }

  // Products
  async getMenuItems(categoryId?: number | string): Promise<MenuItem[]> {
    await this.seedDatabaseIfNeeded();
    if (categoryId) {
      const key = toDexieKey(categoryId);
      return db.menuItems.where('category_id').equals(key as any).toArray();
    }
    return db.menuItems.toArray();
  }

  async searchMenuItems(query: string): Promise<MenuItem[]> {
    await this.seedDatabaseIfNeeded();
    const q = query.toLowerCase().trim();
    if (!q) return this.getMenuItems();
    return db.menuItems.filter(item =>
      item.name.toLowerCase().includes(q) ||
      (Boolean(item.barcode) && item.barcode!.includes(q)) ||
      (Boolean(item.description) && item.description!.toLowerCase().includes(q))
    ).toArray();
  }

  async findProductByBarcode(barcode: string): Promise<MenuItem | null> {
    await this.seedDatabaseIfNeeded();
    if (!barcode) return null;
    const item = await db.menuItems.where('barcode').equals(barcode.trim()).first();
    return item || null;
  }

  async createMenuItem(product: Omit<MenuItem, 'id'>): Promise<MenuItem> {
    const id = await db.menuItems.add({
      ...product,
      created_at: new Date().toISOString()
    });

    if (product.stock > 0) {
      await db.stockMovements.add({
        product_id: id,
        delta: product.stock,
        reason: 'initial',
        created_at: new Date().toISOString()
      });
    }

    return { ...product, id };
  }

  async updateMenuItem(id: number | string, product: Partial<MenuItem>): Promise<void> {
    await db.menuItems.update(toDexieKey(id) as any, product);
  }

  async deleteMenuItem(id: number | string): Promise<void> {
    await db.menuItems.delete(toDexieKey(id) as any);
  }

  // Orders
  async createOrder(orderData: CreateOrderDTO): Promise<Order> {
    return db.transaction('rw', [db.orders, db.orderItems, db.payments, db.menuItems, db.stockMovements], async () => {
      const orderNumber = `ORD-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

      let subtotal = 0;
      for (const item of orderData.items) {
        subtotal += item.quantity * item.unit_price;
      }

      const totalAmount = Math.max(0, subtotal + orderData.tax_amount - orderData.discount_amount);

      const orderObj: Omit<Order, 'id'> = {
        order_number: orderNumber,
        customer_name: orderData.customer_name || 'Pelanggan Umum',
        order_type: orderData.order_type || 'retail',
        status: 'completed',
        subtotal,
        tax_amount: orderData.tax_amount,
        discount_amount: orderData.discount_amount,
        total_amount: totalAmount,
        notes: orderData.notes || '',
        created_at: new Date().toISOString()
      };

      const orderId = await db.orders.add(orderObj as Order);

      const orderItemsToInsert: OrderItem[] = [];
      for (const item of orderData.items) {
        const itemSubtotal = item.quantity * item.unit_price;
        const itemObj: OrderItem = {
          order_id: orderId,
          menu_item_id: item.menu_item_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          subtotal: itemSubtotal,
          notes: item.notes || ''
        };
        const itemId = await db.orderItems.add(itemObj as OrderItem);
        orderItemsToInsert.push({ ...itemObj, id: itemId });

        const prod = await db.menuItems.get(toDexieKey(item.menu_item_id) as any);
        if (prod && !isDigitalUnit(prod.unit)) {
          const newStock = Math.max(0, prod.stock - item.quantity);
          await db.menuItems.update(toDexieKey(item.menu_item_id) as any, { stock: newStock });

          await db.stockMovements.add({
            product_id: item.menu_item_id,
            delta: -item.quantity,
            reason: 'sale',
            order_id: orderId,
            created_at: new Date().toISOString()
          });
        }
      }

      const changeAmount = Math.max(0, orderData.payment.amount - totalAmount);
      const paymentObj: Payment = {
        order_id: orderId,
        method: orderData.payment.method,
        amount: orderData.payment.amount,
        change_amount: changeAmount,
        reference_number: orderData.payment.reference_number || '',
        created_at: new Date().toISOString()
      };
      const paymentId = await db.payments.add(paymentObj as Payment);

      return {
        ...orderObj,
        id: orderId,
        items: orderItemsToInsert,
        payment: { ...paymentObj, id: paymentId }
      };
    });
  }

  async getOrders(status?: string): Promise<Order[]> {
    await this.seedDatabaseIfNeeded();
    let query = db.orders.reverse();
    if (status) {
      return db.orders.where('status').equals(status).reverse().sortBy('created_at');
    }
    return query.sortBy('created_at');
  }

  async getOrderDetails(orderId: number | string): Promise<{ order: Order; items: OrderItem[]; payment?: Payment } | null> {
    const key = toDexieKey(orderId);
    const order = await db.orders.get(key as any);
    if (!order) return null;

    const rawItems = await db.orderItems.where('order_id').equals(key as any).toArray();
    const payment = await db.payments.where('order_id').equals(key as any).first();

    const items: OrderItem[] = [];
    for (const item of rawItems) {
      const prod = await db.menuItems.get(toDexieKey(item.menu_item_id) as any);
      items.push({
        ...item,
        product_name: prod ? prod.name : `Produk #${item.menu_item_id}`
      });
    }

    return { order, items, payment };
  }

  async updateOrderStatus(id: number | string, status: 'completed' | 'cancelled'): Promise<void> {
    await db.orders.update(toDexieKey(id) as any, { status });
  }

  async voidOrder(id: number | string): Promise<void> {
    return db.transaction('rw', [db.orders, db.orderItems, db.menuItems, db.stockMovements], async () => {
      const key = toDexieKey(id);
      const order = await db.orders.get(key as any);
      if (!order || order.status === 'cancelled') return;

      await db.orders.update(key as any, { status: 'cancelled' });

      const items = await db.orderItems.where('order_id').equals(key as any).toArray();
      for (const item of items) {
        const prod = await db.menuItems.get(toDexieKey(item.menu_item_id) as any);
        if (prod) {
          const restoredStock = prod.stock + item.quantity;
          await db.menuItems.update(toDexieKey(item.menu_item_id) as any, { stock: restoredStock });

          await db.stockMovements.add({
            product_id: item.menu_item_id,
            delta: item.quantity,
            reason: 'return',
            order_id: id,
            created_at: new Date().toISOString()
          });
        }
      }
    });
  }

  async deleteOrder(id: number | string): Promise<void> {
    const key = toDexieKey(id);
    await db.transaction('rw', [db.orders, db.orderItems, db.payments], async () => {
      await db.orders.delete(key as any);
      await db.orderItems.where('order_id').equals(key as any).delete();
      await db.payments.where('order_id').equals(key as any).delete();
    });
  }

  // Expenses
  async getExpenses(): Promise<Expense[]> {
    await this.seedDatabaseIfNeeded();
    return db.expenses.reverse().sortBy('expense_date');
  }

  async createExpense(expense: Omit<Expense, 'id'>): Promise<Expense> {
    const id = await db.expenses.add({
      ...expense,
      created_at: new Date().toISOString()
    });
    return { ...expense, id };
  }

  async deleteExpense(id: number | string): Promise<void> {
    await db.expenses.delete(toDexieKey(id) as any);
  }

  // Stock Audit & Movements
  async adjustStock(productId: number | string, delta: number, reason: StockMovement['reason']): Promise<void> {
    return db.transaction('rw', [db.menuItems, db.stockMovements], async () => {
      const key = toDexieKey(productId);
      const prod = await db.menuItems.get(key as any);
      if (!prod) return;

      const newStock = Math.max(0, prod.stock + delta);
      await db.menuItems.update(key as any, { stock: newStock });

      await db.stockMovements.add({
        product_id: productId,
        delta,
        reason,
        created_at: new Date().toISOString()
      });
    });
  }

  async getStockMovements(productId?: number | string): Promise<StockMovement[]> {
    await this.seedDatabaseIfNeeded();
    let movements: StockMovement[] = [];
    if (productId) {
      const key = toDexieKey(productId);
      movements = await db.stockMovements.where('product_id').equals(key as any).reverse().toArray();
    } else {
      movements = await db.stockMovements.reverse().toArray();
    }

    const result: StockMovement[] = [];
    for (const mov of movements) {
      const prod = await db.menuItems.get(toDexieKey(mov.product_id) as any);
      result.push({
        ...mov,
        product_name: prod ? prod.name : `Produk #${mov.product_id}`
      });
    }

    return result;
  }

  // Settings
  async getSettings(): Promise<Record<string, string>> {
    await this.seedDatabaseIfNeeded();
    const items = await db.settings.toArray();
    const map: Record<string, string> = {};
    for (const item of items) {
      map[item.key] = item.value;
    }
    return map;
  }

  async updateSettings(settings: Record<string, string>): Promise<void> {
    for (const [key, value] of Object.entries(settings)) {
      await db.settings.put({ key, value });
    }
  }

  // Long-Term Backup & Restore Methods (.json export & import)
  async exportDatabaseJSON(): Promise<string> {
    await this.seedDatabaseIfNeeded();
    const backupData = {
      version: 1,
      appName: 'WarungOzyPOS',
      exportDate: new Date().toISOString(),
      categories: await db.categories.toArray(),
      menuItems: await db.menuItems.toArray(),
      orders: await db.orders.toArray(),
      orderItems: await db.orderItems.toArray(),
      payments: await db.payments.toArray(),
      stockMovements: await db.stockMovements.toArray(),
      expenses: await db.expenses.toArray(),
      settings: await db.settings.toArray()
    };
    return JSON.stringify(backupData, null, 2);
  }

  async importDatabaseJSON(jsonStr: string): Promise<void> {
    const data = JSON.parse(jsonStr);
    if (!data.categories || !data.menuItems) {
      throw new Error('Format file cadangan backup tidak valid!');
    }

    await db.transaction('rw', [
      db.categories,
      db.menuItems,
      db.orders,
      db.orderItems,
      db.payments,
      db.stockMovements,
      db.expenses,
      db.settings
    ], async () => {
      await db.categories.clear();
      await db.menuItems.clear();
      await db.orders.clear();
      await db.orderItems.clear();
      await db.payments.clear();
      await db.stockMovements.clear();
      await db.expenses.clear();
      await db.settings.clear();

      if (data.categories.length) await db.categories.bulkAdd(data.categories);
      if (data.menuItems.length) await db.menuItems.bulkAdd(data.menuItems);
      if (data.orders?.length) await db.orders.bulkAdd(data.orders);
      if (data.orderItems?.length) await db.orderItems.bulkAdd(data.orderItems);
      if (data.payments?.length) await db.payments.bulkAdd(data.payments);
      if (data.stockMovements?.length) await db.stockMovements.bulkAdd(data.stockMovements);
      if (data.expenses?.length) await db.expenses.bulkAdd(data.expenses);
      if (data.settings?.length) await db.settings.bulkAdd(data.settings);
    });
  }
  getStorageMode(): 'supabase' | 'indexeddb' {
    return 'indexeddb';
  }
}

export const repository = new IndexedDBRepository();
