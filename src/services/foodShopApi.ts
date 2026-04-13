import type { CartQuantities, MenuItem, MenuItemDraft, Order, OrderLineItem, OrderStatus } from "../types";

const MENU_KEY = "foodshop.menuItems";
const ORDERS_KEY = "foodshop.orders";
const OWNER_PIN = import.meta.env.VITE_OWNER_PIN ?? "2468";

const seedMenu: MenuItem[] = [
  {
    id: "bai-sach-chrouk",
    name: "Bai Sach Chrouk",
    category: "Rice",
    priceKHR: 12000,
    stock: 20,
    description: "Grilled pork rice with pickles and clear soup.",
    imageUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=900&q=80",
    visible: true,
    createdAt: "2026-04-12T00:00:00.000Z",
    updatedAt: "2026-04-12T00:00:00.000Z",
  },
  {
    id: "nom-banh-chok",
    name: "Nom Banh Chok",
    category: "Noodles",
    priceKHR: 10000,
    stock: 18,
    description: "Fresh noodles, green curry gravy, herbs, and cucumber.",
    imageUrl: "https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?auto=format&fit=crop&w=900&q=80",
    visible: true,
    createdAt: "2026-04-12T00:00:00.000Z",
    updatedAt: "2026-04-12T00:00:00.000Z",
  },
  {
    id: "fried-chicken-rice",
    name: "Fried Chicken Rice",
    category: "Rice",
    priceKHR: 14000,
    stock: 16,
    description: "Crispy chicken, jasmine rice, chili sauce, and greens.",
    imageUrl: "https://images.unsplash.com/photo-1598514982205-f36b96d1e8d4?auto=format&fit=crop&w=900&q=80",
    visible: true,
    createdAt: "2026-04-12T00:00:00.000Z",
    updatedAt: "2026-04-12T00:00:00.000Z",
  },
  {
    id: "beef-lok-lak",
    name: "Beef Lok Lak",
    category: "Plates",
    priceKHR: 18000,
    stock: 12,
    description: "Pepper beef, lime sauce, tomato, onion, and fried egg.",
    imageUrl: "https://images.unsplash.com/photo-1604908177453-7462950a6a3b?auto=format&fit=crop&w=900&q=80",
    visible: true,
    createdAt: "2026-04-12T00:00:00.000Z",
    updatedAt: "2026-04-12T00:00:00.000Z",
  },
  {
    id: "iced-coffee",
    name: "Iced Coffee",
    category: "Drinks",
    priceKHR: 5000,
    stock: 40,
    description: "Strong coffee with sweet milk and ice.",
    imageUrl: "https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=900&q=80",
    visible: true,
    createdAt: "2026-04-12T00:00:00.000Z",
    updatedAt: "2026-04-12T00:00:00.000Z",
  },
  {
    id: "sugar-cane-juice",
    name: "Sugar Cane Juice",
    category: "Drinks",
    priceKHR: 4000,
    stock: 35,
    description: "Pressed sugar cane served cold.",
    imageUrl: "https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?auto=format&fit=crop&w=900&q=80",
    visible: true,
    createdAt: "2026-04-12T00:00:00.000Z",
    updatedAt: "2026-04-12T00:00:00.000Z",
  },
];

function readJson<T>(key: string, fallback: T): T {
  const stored = window.localStorage.getItem(key);

  if (!stored) {
    return fallback;
  }

  try {
    return JSON.parse(stored) as T;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T): void {
  window.localStorage.setItem(key, JSON.stringify(value));
}

function normalizeStock(value: unknown, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, Math.round(parsed)) : fallback;
}

function readMenu(): MenuItem[] {
  const stored = readJson<MenuItem[]>(MENU_KEY, []);

  if (stored.length > 0) {
    const normalized = stored.map((item) => {
      const seedItem = seedMenu.find((seed) => seed.id === item.id);

      return {
        ...item,
        stock: normalizeStock(item.stock, seedItem?.stock ?? 20),
      };
    });

    if (normalized.some((item, index) => item.stock !== stored[index].stock)) {
      writeJson(MENU_KEY, normalized);
    }

    return normalized;
  }

  writeJson(MENU_KEY, seedMenu);
  return seedMenu;
}

function readOrders(): Order[] {
  return readJson<Order[]>(ORDERS_KEY, []);
}

function requireOwnerPin(pin: string): void {
  if (pin !== OWNER_PIN) {
    throw new Error("Invalid owner PIN.");
  }
}

function makeId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function cleanDraft(draft: MenuItemDraft): MenuItemDraft {
  return {
    name: draft.name.trim(),
    category: draft.category.trim() || "Menu",
    priceKHR: Math.max(0, Math.round(Number(draft.priceKHR) || 0)),
    stock: Math.max(0, Math.round(Number(draft.stock) || 0)),
    description: draft.description?.trim() || undefined,
    imageUrl: draft.imageUrl?.trim() || undefined,
    visible: draft.visible,
  };
}

async function getVisibleMenuItems(): Promise<MenuItem[]> {
  return readMenu().filter((item) => item.visible);
}

async function getAllMenuItems(ownerPin: string): Promise<MenuItem[]> {
  requireOwnerPin(ownerPin);
  return readMenu();
}

async function createMenuItem(ownerPin: string, draft: MenuItemDraft): Promise<MenuItem> {
  requireOwnerPin(ownerPin);

  const now = new Date().toISOString();
  const item: MenuItem = {
    ...cleanDraft(draft),
    id: makeId("menu"),
    createdAt: now,
    updatedAt: now,
  };

  writeJson(MENU_KEY, [item, ...readMenu()]);
  return item;
}

async function updateMenuItem(ownerPin: string, itemId: string, draft: MenuItemDraft): Promise<MenuItem> {
  requireOwnerPin(ownerPin);

  const menu = readMenu();
  const item = menu.find((entry) => entry.id === itemId);

  if (!item) {
    throw new Error("Menu item was not found.");
  }

  const updated: MenuItem = {
    ...item,
    ...cleanDraft(draft),
    updatedAt: new Date().toISOString(),
  };

  writeJson(
    MENU_KEY,
    menu.map((entry) => (entry.id === itemId ? updated : entry)),
  );

  return updated;
}

async function deleteMenuItem(ownerPin: string, itemId: string): Promise<void> {
  requireOwnerPin(ownerPin);
  writeJson(
    MENU_KEY,
    readMenu().filter((item) => item.id !== itemId),
  );
}

async function submitOrder(tableNumber: string, cart: CartQuantities): Promise<Order> {
  const cleanTableNumber = tableNumber.trim();

  if (!cleanTableNumber) {
    throw new Error("Enter a table number before submitting.");
  }

  const menuById = new Map(readMenu().map((item) => [item.id, item]));
  const items: OrderLineItem[] = Object.entries(cart)
    .map(([itemId, quantity]) => {
      const menuItem = menuById.get(itemId);
      const cleanQuantity = Math.max(0, Math.round(quantity));

      if (!menuItem || !menuItem.visible || menuItem.stock === 0 || cleanQuantity === 0) {
        return undefined;
      }

      return {
        itemId,
        name: menuItem.name,
        quantity: Math.min(cleanQuantity, menuItem.stock),
        priceKHR: menuItem.priceKHR,
      };
    })
    .filter((item): item is OrderLineItem => Boolean(item));

  if (items.length === 0) {
    throw new Error("Add at least one item to the cart.");
  }

  const order: Order = {
    id: makeId("order"),
    tableNumber: cleanTableNumber,
    items,
    totalKHR: items.reduce((sum, item) => sum + item.priceKHR * item.quantity, 0),
    status: "pending",
    createdAt: new Date().toISOString(),
  };

  writeJson(ORDERS_KEY, [order, ...readOrders()]);
  return order;
}

async function listOrders(ownerPin: string, status?: OrderStatus): Promise<Order[]> {
  requireOwnerPin(ownerPin);
  const orders = readOrders();
  return status ? orders.filter((order) => order.status === status) : orders;
}

async function markOrderDone(ownerPin: string, orderId: string): Promise<Order> {
  requireOwnerPin(ownerPin);

  const orders = readOrders();
  const order = orders.find((entry) => entry.id === orderId);

  if (!order) {
    throw new Error("Order was not found.");
  }

  if (order.status === "done") {
    return order;
  }

  const updated: Order = {
    ...order,
    status: "done",
    completedAt: new Date().toISOString(),
  };
  const orderedQuantities = new Map(order.items.map((item) => [item.itemId, item.quantity]));

  writeJson(
    ORDERS_KEY,
    orders.map((entry) => (entry.id === orderId ? updated : entry)),
  );
  writeJson(
    MENU_KEY,
    readMenu().map((item) => ({
      ...item,
      stock: Math.max(0, item.stock - (orderedQuantities.get(item.id) ?? 0)),
      updatedAt: orderedQuantities.has(item.id) ? updated.completedAt ?? item.updatedAt : item.updatedAt,
    })),
  );

  return updated;
}

export const foodShopApi = {
  getVisibleMenuItems,
  getAllMenuItems,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  submitOrder,
  listOrders,
  markOrderDone,
};
