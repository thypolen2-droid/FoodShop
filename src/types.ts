export type OrderStatus = "pending" | "done";

export type MenuItem = {
  id: string;
  name: string;
  category: string;
  priceKHR: number;
  stock: number;
  description?: string;
  imageUrl?: string;
  visible: boolean;
  createdAt: string;
  updatedAt: string;
};

export type OrderLineItem = {
  itemId: string;
  name: string;
  quantity: number;
  priceKHR: number;
};

export type Order = {
  id: string;
  tableNumber: string;
  items: OrderLineItem[];
  totalKHR: number;
  status: OrderStatus;
  createdAt: string;
  completedAt?: string;
};

export type MenuItemDraft = {
  name: string;
  category: string;
  priceKHR: number;
  stock: number;
  description?: string;
  imageUrl?: string;
  visible: boolean;
};

export type CartQuantities = Record<string, number>;
