import type { CartQuantities, MenuItem, MenuItemDraft, Order, OrderStatus } from "../types";

type ApiError = {
  message?: string;
};

async function request<T>(input: string, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const payload = (await response.json().catch(() => ({}))) as ApiError | T;

  if (!response.ok) {
    throw new Error((payload as ApiError).message || "Request failed.");
  }

  return payload as T;
}

async function getVisibleMenuItems(): Promise<MenuItem[]> {
  return request<MenuItem[]>("/api/menu");
}

async function submitOrder(tableNumber: string, cart: CartQuantities): Promise<Order> {
  return request<Order>("/api/orders", {
    method: "POST",
    body: JSON.stringify({ tableNumber, cart }),
  });
}

async function getOwnerSession(): Promise<{ authenticated: boolean }> {
  return request<{ authenticated: boolean }>("/api/auth/session");
}

async function loginOwner(password: string): Promise<void> {
  await request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ password }),
  });
}

async function logoutOwner(): Promise<void> {
  await request("/api/auth/logout", {
    method: "POST",
    body: JSON.stringify({}),
  });
}

async function getAllMenuItems(): Promise<MenuItem[]> {
  return request<MenuItem[]>("/api/owner/menu");
}

async function createMenuItem(draft: MenuItemDraft): Promise<MenuItem> {
  return request<MenuItem>("/api/owner/menu", {
    method: "POST",
    body: JSON.stringify(draft),
  });
}

async function updateMenuItem(itemId: string, draft: MenuItemDraft): Promise<MenuItem> {
  return request<MenuItem>(`/api/owner/menu/${itemId}`, {
    method: "PUT",
    body: JSON.stringify(draft),
  });
}

async function deleteMenuItem(itemId: string): Promise<void> {
  await request(`/api/owner/menu/${itemId}`, {
    method: "DELETE",
  });
}

async function listOrders(status?: OrderStatus): Promise<Order[]> {
  const query = status ? `?status=${encodeURIComponent(status)}` : "";
  return request<Order[]>(`/api/owner/orders${query}`);
}

async function markOrderDone(orderId: string): Promise<Order> {
  return request<Order>(`/api/owner/orders/${orderId}/confirm`, {
    method: "POST",
    body: JSON.stringify({}),
  });
}

export const foodShopApi = {
  getVisibleMenuItems,
  submitOrder,
  getOwnerSession,
  loginOwner,
  logoutOwner,
  getAllMenuItems,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  listOrders,
  markOrderDone,
};
