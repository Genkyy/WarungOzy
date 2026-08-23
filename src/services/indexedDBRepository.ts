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

// 5 Exact Warung Categories Requested
export const DEFAULT_CATEGORIES: Omit<Category, 'id'>[] = [
  { name: 'Makanan', icon: 'Utensils', sort_order: 1, is_active: true, created_at: new Date().toISOString() },
  { name: 'Minuman', icon: 'Coffee', sort_order: 2, is_active: true, created_at: new Date().toISOString() },
  { name: 'Sembako', icon: 'Package', sort_order: 3, is_active: true, created_at: new Date().toISOString() },
  { name: 'Top Up', icon: 'Zap', sort_order: 4, is_active: true, created_at: new Date().toISOString() },
  { name: 'Rokok', icon: 'Flame', sort_order: 5, is_active: true, created_at: new Date().toISOString() },
];

const DEFAULT_PRODUCTS = (catIds: Record<string, number>): Omit<MenuItem, 'id'>[] => [
  {
    category_id: catIds['Makanan'] || 1,
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
    category_id: catIds['Makanan'] || 1,
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
    category_id: catIds['Minuman'] || 2,
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
    category_id: catIds['Minuman'] || 2,
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
    category_id: catIds['Minuman'] || 2,
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
    category_id: catIds['Sembako'] || 3,
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
    category_id: catIds['Sembako'] || 3,
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
    category_id: catIds['Top Up'] || 4,
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
    category_id: catIds['Top Up'] || 4,
    name: 'Pulsa Telkomsel / XL 50k',
    description: 'Isi ulang pulsa reguler Rp 50.000',
    price: 52000,
    cost_price: 50000,
    barcode: '',
    stock: 9999,
    unit: 'Pcs',
    is_available: true,
    sort_order: 2,
    image_path: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=300&auto=format&fit=crop&q=80',
    created_at: new Date().toISOString()
  },
  {
    category_id: catIds['Rokok'] || 5,
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
  },
  {
    category_id: catIds['Rokok'] || 5,
    name: 'Permen Kopiko (3 Pcs)',
    description: 'Permen rasa kopi manis eceran warung',
    price: 1000,
    cost_price: 600,
    barcode: '8996001300018',
    stock: 200,
    unit: 'Pcs',
    is_available: true,
    sort_order: 2,
    image_path: 'https://images.unsplash.com/photo-1582058091505-f87a2e55a40f?w=300&auto=format&fit=crop&q=80',
    created_at: new Date().toISOString()
  }
];

const DEFAULT_SETTINGS = [
  { key: 'outlet_name', value: 'Warung Ozy' },
  { key: 'tax_rate', value: '0' },
  { key: 'currency', value: 'IDR' },
  { key: 'receipt_footer', value: 'Terima kasih telah berbelanja di Warung Ozy!' },
  { key: 'low_stock_threshold', value: '5' }
];

export class IndexedDBRepository implements DatabaseRepository {
  async seedDatabaseIfNeeded() {
    const categoryCount = await db.categories.count();
    const hasMakanan = await db.categories.where('name').equals('Makanan').count();
    const hasTopUp = await db.categories.where('name').equals('Top Up').count();
    
    // Always force clean seed if categories count is not 5 or missing exact 5 names
    if (categoryCount !== 5 || hasMakanan === 0 || hasTopUp === 0) {
      await this.resetDatabaseWithSeedData();
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
  async getMenuItems(categoryId?: number): Promise<MenuItem[]> {
    await this.seedDatabaseIfNeeded();
    if (categoryId && categoryId > 0) {
      return db.menuItems.where('category_id').equals(categoryId).toArray();
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

  async updateMenuItem(id: number, product: Partial<MenuItem>): Promise<void> {
    await db.menuItems.update(id, product);
  }

  async deleteMenuItem(id: number): Promise<void> {
    await db.menuItems.delete(id);
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
        const itemId = await db.orderItems.add(itemObj);
        orderItemsToInsert.push({ ...itemObj, id: itemId });

        const prod = await db.menuItems.get(item.menu_item_id);
        if (prod) {
          const newStock = Math.max(0, prod.stock - item.quantity);
          await db.menuItems.update(item.menu_item_id, { stock: newStock });

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
      const paymentId = await db.payments.add(paymentObj);

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

  async getOrderDetails(orderId: number): Promise<{ order: Order; items: OrderItem[]; payment?: Payment } | null> {
    const order = await db.orders.get(orderId);
    if (!order) return null;

    const rawItems = await db.orderItems.where('order_id').equals(orderId).toArray();
    const payment = await db.payments.where('order_id').equals(orderId).first();

    const items: OrderItem[] = [];
    for (const item of rawItems) {
      const prod = await db.menuItems.get(item.menu_item_id);
      items.push({
        ...item,
        product_name: prod ? prod.name : `Produk #${item.menu_item_id}`
      });
    }

    return { order, items, payment };
  }

  async updateOrderStatus(id: number, status: 'completed' | 'cancelled'): Promise<void> {
    await db.orders.update(id, { status });
  }

  async voidOrder(id: number): Promise<void> {
    return db.transaction('rw', [db.orders, db.orderItems, db.menuItems, db.stockMovements], async () => {
      const order = await db.orders.get(id);
      if (!order || order.status === 'cancelled') return;

      await db.orders.update(id, { status: 'cancelled' });

      const items = await db.orderItems.where('order_id').equals(id).toArray();
      for (const item of items) {
        const prod = await db.menuItems.get(item.menu_item_id);
        if (prod) {
          const restoredStock = prod.stock + item.quantity;
          await db.menuItems.update(item.menu_item_id, { stock: restoredStock });

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

  async deleteOrder(id: number): Promise<void> {
    await db.transaction('rw', [db.orders, db.orderItems, db.payments], async () => {
      await db.orders.delete(id);
      await db.orderItems.where('order_id').equals(id).delete();
      await db.payments.where('order_id').equals(id).delete();
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

  async deleteExpense(id: number): Promise<void> {
    await db.expenses.delete(id);
  }

  // Stock Audit & Movements
  async adjustStock(productId: number, delta: number, reason: StockMovement['reason']): Promise<void> {
    return db.transaction('rw', [db.menuItems, db.stockMovements], async () => {
      const prod = await db.menuItems.get(productId);
      if (!prod) return;

      const newStock = Math.max(0, prod.stock + delta);
      await db.menuItems.update(productId, { stock: newStock });

      await db.stockMovements.add({
        product_id: productId,
        delta,
        reason,
        created_at: new Date().toISOString()
      });
    });
  }

  async getStockMovements(productId?: number): Promise<StockMovement[]> {
    await this.seedDatabaseIfNeeded();
    let movements: StockMovement[] = [];
    if (productId && productId > 0) {
      movements = await db.stockMovements.where('product_id').equals(productId).reverse().toArray();
    } else {
      movements = await db.stockMovements.reverse().toArray();
    }

    const result: StockMovement[] = [];
    for (const mov of movements) {
      const prod = await db.menuItems.get(mov.product_id);
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
}

export const repository = new IndexedDBRepository();
