import {
  Category,
  MenuItem,
  Order,
  CreateOrderDTO,
  Expense,
  StockMovement,
  Payment,
  OrderItem
} from '../types';

export interface DatabaseRepository {
  // Categories
  getCategories(): Promise<Category[]>;
  createCategory(category: Omit<Category, 'id'>): Promise<Category>;

  // Products
  getMenuItems(categoryId?: number | string): Promise<MenuItem[]>;
  searchMenuItems(query: string): Promise<MenuItem[]>;
  findProductByBarcode(barcode: string): Promise<MenuItem | null>;
  createMenuItem(product: Omit<MenuItem, 'id'>): Promise<MenuItem>;
  updateMenuItem(id: number | string, product: Partial<MenuItem>): Promise<void>;
  deleteMenuItem(id: number | string): Promise<void>;

  // Orders & Checkout
  createOrder(orderData: CreateOrderDTO): Promise<Order>;
  getOrders(status?: string): Promise<Order[]>;
  getOrderDetails(orderId: number | string): Promise<{ order: Order; items: OrderItem[]; payment?: Payment } | null>;
  updateOrderStatus(id: number | string, status: 'completed' | 'cancelled'): Promise<void>;
  deleteOrder(id: number | string): Promise<void>;
  voidOrder(id: number | string): Promise<void>;

  // Expenses
  getExpenses(): Promise<Expense[]>;
  createExpense(expense: Omit<Expense, 'id'>): Promise<Expense>;
  deleteExpense(id: number | string): Promise<void>;

  // Stock Audit
  adjustStock(productId: number | string, delta: number, reason: StockMovement['reason']): Promise<void>;
  getStockMovements(productId?: number | string): Promise<StockMovement[]>;

  // Settings
  getSettings(): Promise<Record<string, string>>;
  updateSettings(settings: Record<string, string>): Promise<void>;
  resetDatabaseWithSeedData(): Promise<void>;
}
