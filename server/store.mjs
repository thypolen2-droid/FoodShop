import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_STORE = {
  menuItems: [],
  orders: [],
};
const STORE_FILE = process.env.STORE_FILE?.trim() || path.join(__dirname, "data", "store.json");

let writeQueue = Promise.resolve();

function normalizeStock(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, Math.round(parsed)) : fallback;
}

function makeId(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function cleanDraft(draft) {
  return {
    name: String(draft.name ?? "").trim(),
    category: String(draft.category ?? "").trim() || "Menu",
    priceKHR: Math.max(0, Math.round(Number(draft.priceKHR) || 0)),
    stock: normalizeStock(draft.stock, 0),
    description: String(draft.description ?? "").trim() || undefined,
    imageUrl: String(draft.imageUrl ?? "").trim() || undefined,
    visible: Boolean(draft.visible),
  };
}

function normalizeStore(store) {
  return {
    menuItems: Array.isArray(store.menuItems)
      ? store.menuItems.map((item) => ({
          ...item,
          stock: normalizeStock(item.stock, 0),
          visible: Boolean(item.visible),
        }))
      : [],
    orders: Array.isArray(store.orders) ? store.orders : [],
  };
}

async function ensureStoreFile() {
  await mkdir(path.dirname(STORE_FILE), { recursive: true });

  try {
    await readFile(STORE_FILE, "utf8");
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      await writeStore(DEFAULT_STORE);
      return;
    }

    throw error;
  }
}

async function readStore() {
  await ensureStoreFile();
  const raw = await readFile(STORE_FILE, "utf8");
  return normalizeStore(JSON.parse(raw));
}

async function writeStore(store) {
  await writeFile(STORE_FILE, `${JSON.stringify(store, null, 2)}\n`, "utf8");
}

function withStore(update) {
  writeQueue = writeQueue.then(async () => {
    const store = await readStore();
    const nextStore = await update(store);
    await writeStore(nextStore);
    return nextStore;
  });

  return writeQueue;
}

export async function listVisibleMenuItems() {
  const store = await readStore();
  return store.menuItems.filter((item) => item.visible);
}

export async function listAllMenuItems() {
  const store = await readStore();
  return store.menuItems;
}

export async function createMenuItem(draft) {
  const now = new Date().toISOString();
  const item = {
    ...cleanDraft(draft),
    id: makeId("menu"),
    createdAt: now,
    updatedAt: now,
  };

  await withStore((store) => ({
    ...store,
    menuItems: [item, ...store.menuItems],
  }));

  return item;
}

export async function updateMenuItem(itemId, draft) {
  let updatedItem;

  await withStore((store) => {
    const existing = store.menuItems.find((item) => item.id === itemId);

    if (!existing) {
      throw new Error("Menu item was not found.");
    }

    updatedItem = {
      ...existing,
      ...cleanDraft(draft),
      updatedAt: new Date().toISOString(),
    };

    return {
      ...store,
      menuItems: store.menuItems.map((item) => (item.id === itemId ? updatedItem : item)),
    };
  });

  return updatedItem;
}

export async function deleteMenuItem(itemId) {
  await withStore((store) => ({
    ...store,
    menuItems: store.menuItems.filter((item) => item.id !== itemId),
  }));
}

export async function submitOrder(tableNumber, cart) {
  const cleanTableNumber = String(tableNumber ?? "").trim();

  if (!cleanTableNumber) {
    throw new Error("Enter a table number before submitting.");
  }

  let createdOrder;

  await withStore((store) => {
    const menuById = new Map(store.menuItems.map((item) => [item.id, item]));
    const items = Object.entries(cart ?? {})
      .map(([itemId, quantity]) => {
        const menuItem = menuById.get(itemId);
        const cleanQuantity = Math.max(0, Math.round(Number(quantity) || 0));

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
      .filter(Boolean);

    if (items.length === 0) {
      throw new Error("Add at least one item to the cart.");
    }

    createdOrder = {
      id: makeId("order"),
      tableNumber: cleanTableNumber,
      items,
      totalKHR: items.reduce((sum, item) => sum + item.priceKHR * item.quantity, 0),
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    return {
      ...store,
      orders: [createdOrder, ...store.orders],
    };
  });

  return createdOrder;
}

export async function listOrders(status) {
  const store = await readStore();
  return status ? store.orders.filter((order) => order.status === status) : store.orders;
}

export async function confirmOrder(orderId) {
  let updatedOrder;

  await withStore((store) => {
    const order = store.orders.find((entry) => entry.id === orderId);

    if (!order) {
      throw new Error("Order was not found.");
    }

    if (order.status === "done") {
      updatedOrder = order;
      return store;
    }

    updatedOrder = {
      ...order,
      status: "done",
      completedAt: new Date().toISOString(),
    };

    const orderedQuantities = new Map(order.items.map((item) => [item.itemId, item.quantity]));

    return {
      ...store,
      orders: store.orders.map((entry) => (entry.id === orderId ? updatedOrder : entry)),
      menuItems: store.menuItems.map((item) => ({
        ...item,
        stock: Math.max(0, item.stock - (orderedQuantities.get(item.id) ?? 0)),
        updatedAt: orderedQuantities.has(item.id) ? updatedOrder.completedAt ?? item.updatedAt : item.updatedAt,
      })),
    };
  });

  return updatedOrder;
}
