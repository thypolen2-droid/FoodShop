import { FormEvent, useEffect, useMemo, useState } from "react";
import { foodShopApi } from "./services/foodShopApi";
import type { CartQuantities, MenuItem, MenuItemDraft, Order } from "./types";

type Language = "en" | "km";
type ThemeMode = "light" | "dark";

const LANGUAGE_KEY = "foodshop.language";
const THEME_KEY = "foodshop.theme";

const copy = {
  en: {
    add: "Add",
    addMenuItem: "Add menu item",
    all: "All",
    availableItems: "available items",
    brandSubtitle: "Menu & table orders",
    cart: "Cart",
    close: "Close",
    currentTable: "Current table",
    delete: "Delete",
    description: "Description",
    drinks: "Drinks",
    edit: "Edit",
    emptyCart: "Add menu items to start an order.",
    enterOwnerPin: "Enter owner password",
    hidden: "Hidden",
    imageUrl: "Image URL",
    invalidOwnerFallback: "Owner access failed.",
    itemName: "Item name",
    items: "items",
    each: "each",
    kitchenQueue: "Kitchen queue",
    language: "ខ្មែរ",
    light: "Light",
    dark: "Dark",
    markDone: "Confirm order",
    menu: "Menu",
    menuCategories: "Menu categories",
    menuCopy: "Choose dishes, enter your table number, and send the order to the counter.",
    menuItems: "Menu items",
    newItem: "New item",
    noPendingOrders: "No pending orders yet.",
    openTableOrdering: "Open table ordering",
    owner: "Owner",
    ownerAccess: "Owner access",
    ownerPin: "Owner password",
    ownerTools: "Owner tools",
    ownerToolsCopy: "Manage food items, stock counts, and pending table orders.",
    orderSent: "Order sent",
    pendingOrders: "Pending orders",
    priceKHR: "Price KHR",
    refresh: "Refresh",
    saveChanges: "Save changes",
    saveItemFallback: "Could not save menu item.",
    stock: "Stock",
    stockLeft: "left",
    soldOut: "Sold out",
    submitOrder: "Submit order",
    submitOrderFallback: "Could not submit order.",
    table: "Table",
    tableNumber: "Table number",
    tablePlaceholder: "Example: 7",
    total: "Total",
    unlockOwnerTools: "Unlock owner tools",
    viewCart: "View cart",
    visible: "Visible",
    visibleOnMenu: "Visible on customer menu",
  },
  km: {
    add: "បន្ថែម",
    addMenuItem: "បន្ថែមម្ហូប",
    all: "ទាំងអស់",
    availableItems: "មុខម្ហូបមានលក់",
    brandSubtitle: "ម៉ឺនុយ និងការកុម្ម៉ង់តុ",
    cart: "កន្ត្រក",
    close: "បិទ",
    currentTable: "តុបច្ចុប្បន្ន",
    delete: "លុប",
    description: "ពិពណ៌នា",
    drinks: "ភេសជ្ជៈ",
    edit: "កែ",
    emptyCart: "បន្ថែមមុខម្ហូបដើម្បីចាប់ផ្តើមកុម្ម៉ង់។",
    enterOwnerPin: "បញ្ចូលលេខសម្ងាត់ម្ចាស់",
    hidden: "លាក់",
    imageUrl: "តំណរូបភាព",
    invalidOwnerFallback: "ចូលផ្នែកម្ចាស់មិនបាន។",
    itemName: "ឈ្មោះម្ហូប",
    items: "មុខ",
    each: "ក្នុងមួយមុខ",
    kitchenQueue: "បញ្ជីផ្ទះបាយ",
    language: "English",
    light: "ភ្លឺ",
    dark: "ងងឹត",
    markDone: "បញ្ជាក់រួច",
    menu: "ម៉ឺនុយ",
    menuCategories: "ប្រភេទម៉ឺនុយ",
    menuCopy: "ជ្រើសម្ហូប បញ្ចូលលេខតុ ហើយផ្ញើការកុម្ម៉ង់ទៅកាន់បញ្ជរ។",
    menuItems: "មុខម្ហូប",
    newItem: "មុខម្ហូបថ្មី",
    noPendingOrders: "មិនមានការកុម្ម៉ង់កំពុងរង់ចាំទេ។",
    openTableOrdering: "កុម្ម៉ង់តាមតុ",
    owner: "ម្ចាស់",
    ownerAccess: "ចូលម្ចាស់",
    ownerPin: "លេខសម្ងាត់ម្ចាស់",
    ownerTools: "ឧបករណ៍ម្ចាស់",
    ownerToolsCopy: "គ្រប់គ្រងម្ហូប ចំនួនស្តុក និងការកុម្ម៉ង់តុ។",
    orderSent: "បានផ្ញើការកុម្ម៉ង់",
    pendingOrders: "ការកុម្ម៉ង់រង់ចាំ",
    priceKHR: "តម្លៃ KHR",
    refresh: "ផ្ទុកឡើងវិញ",
    saveChanges: "រក្សាទុក",
    saveItemFallback: "រក្សាទុកមុខម្ហូបមិនបាន។",
    stock: "ស្តុក",
    stockLeft: "នៅសល់",
    soldOut: "អស់ហើយ",
    submitOrder: "ផ្ញើការកុម្ម៉ង់",
    submitOrderFallback: "ផ្ញើការកុម្ម៉ង់មិនបាន។",
    table: "តុ",
    tableNumber: "លេខតុ",
    tablePlaceholder: "ឧទាហរណ៍៖ 7",
    total: "សរុប",
    unlockOwnerTools: "បើកឧបករណ៍ម្ចាស់",
    viewCart: "មើលកន្ត្រក",
    visible: "បង្ហាញ",
    visibleOnMenu: "បង្ហាញលើម៉ឺនុយអតិថិជន",
  },
} satisfies Record<Language, Record<string, string>>;

type PageCopy = (typeof copy)[Language];

const emptyDraft: MenuItemDraft = {
  name: "",
  category: "",
  priceKHR: 0,
  stock: 0,
  description: "",
  imageUrl: "",
  visible: true,
};

function formatKHR(value: number): string {
  return `${new Intl.NumberFormat("en-US").format(value)} KHR`;
}

function itemCount(cart: CartQuantities): number {
  return Object.values(cart).reduce((sum, quantity) => sum + quantity, 0);
}

function readStoredMode<T extends string>(key: string, allowed: readonly T[], fallback: T): T {
  const stored = window.localStorage.getItem(key);
  return allowed.includes(stored as T) ? (stored as T) : fallback;
}

function LanguageIcon() {
  return (
    <svg className="icon-svg" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 5h10" />
      <path d="M9 3v2" />
      <path d="M12 5c-.7 4.4-3.4 7.1-7 8.6" />
      <path d="M6.5 8.5c1.1 2 2.7 3.6 5 4.8" />
      <path d="M15 19l4-9 4 9" />
      <path d="M16.2 16.2h5.6" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg className="icon-svg" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 4V2" />
      <path d="M12 22v-2" />
      <path d="M4 12H2" />
      <path d="M22 12h-2" />
      <path d="m5 5 1.4 1.4" />
      <path d="m17.6 17.6 1.4 1.4" />
      <path d="m19 5-1.4 1.4" />
      <path d="m6.4 17.6-1.4 1.4" />
      <circle cx="12" cy="12" r="4" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg className="icon-svg" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M20 14.8A8.2 8.2 0 0 1 9.2 4 8.2 8.2 0 1 0 20 14.8Z" />
    </svg>
  );
}

function useRoute() {
  const [path, setPath] = useState(window.location.pathname);

  useEffect(() => {
    const onPopState = () => setPath(window.location.pathname);
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const navigate = (nextPath: string, replace = false) => {
    if (replace) {
      window.history.replaceState(null, "", nextPath);
    } else {
      window.history.pushState(null, "", nextPath);
    }

    setPath(nextPath);
  };

  return { path, navigate };
}

function App() {
  const { path, navigate } = useRoute();
  const [language, setLanguage] = useState<Language>(() => readStoredMode(LANGUAGE_KEY, ["en", "km"], "en"));
  const [theme, setTheme] = useState<ThemeMode>(() => readStoredMode(THEME_KEY, ["light", "dark"], "light"));
  const t = copy[language];

  useEffect(() => {
    if (path === "/") {
      navigate("/menu", true);
    }
  }, [navigate, path]);

  useEffect(() => {
    window.localStorage.setItem(LANGUAGE_KEY, language);
  }, [language]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  return (
    <div className="app-shell">
      <header className="topbar">
        <a
          className="brand"
          href="/menu"
          onClick={(event) => {
            event.preventDefault();
            navigate("/menu");
          }}
        >
          <span>FoodShop</span>
          <small>{t.brandSubtitle}</small>
        </a>
        <div className="topbar-actions">
          {path === "/owner" && (
            <nav className="topnav" aria-label="Primary">
              <a
                href="/menu"
                onClick={(event) => {
                  event.preventDefault();
                  navigate("/menu");
                }}
              >
                {t.menu}
              </a>
              <a
                className="active"
                href="/owner"
                onClick={(event) => {
                  event.preventDefault();
                  navigate("/owner");
                }}
              >
                {t.owner}
              </a>
            </nav>
          )}
          <div className="mode-controls" aria-label="Display mode">
            <button
              className="icon-button"
              type="button"
              aria-label={`Switch language to ${language === "en" ? "Khmer" : "English"}`}
              onClick={() => setLanguage(language === "en" ? "km" : "en")}
            >
              <LanguageIcon />
              <span className="icon-badge" aria-hidden="true">
                {language === "en" ? "KM" : "EN"}
              </span>
            </button>
            <button
              className="icon-button"
              type="button"
              aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            >
              {theme === "light" ? <MoonIcon /> : <SunIcon />}
            </button>
          </div>
        </div>
      </header>

      {path === "/owner" ? <OwnerPage t={t} /> : <MenuPage t={t} />}
    </div>
  );
}

function MenuPage({ t }: { t: PageCopy }) {
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<CartQuantities>({});
  const [tableNumber, setTableNumber] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [cartOpen, setCartOpen] = useState(false);
  const [confirmation, setConfirmation] = useState<Order | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    foodShopApi.getVisibleMenuItems().then(setMenu).catch((apiError: Error) => setError(apiError.message));
  }, []);

  const categories = useMemo(() => ["All", ...Array.from(new Set(menu.map((item) => item.category)))], [menu]);
  const visibleMenu = selectedCategory === "All" ? menu : menu.filter((item) => item.category === selectedCategory);
  const stockById = useMemo(() => new Map(menu.map((item) => [item.id, item.stock])), [menu]);
  const totalKHR = menu.reduce((sum, item) => sum + (cart[item.id] ?? 0) * item.priceKHR, 0);
  const totalItems = itemCount(cart);

  const setQuantity = (itemId: string, nextQuantity: number) => {
    setCart((current) => {
      const cleanQuantity = Math.min(Math.max(0, nextQuantity), stockById.get(itemId) ?? 0);
      const nextCart = { ...current };

      if (cleanQuantity === 0) {
        delete nextCart[itemId];
      } else {
        nextCart[itemId] = cleanQuantity;
      }

      return nextCart;
    });
  };

  const submitOrder = async () => {
    setError("");

    try {
      const order = await foodShopApi.submitOrder(tableNumber, cart);
      setConfirmation(order);
      setCart({});
      setTableNumber("");
      setCartOpen(false);
    } catch (apiError) {
      setError(apiError instanceof Error ? apiError.message : t.submitOrderFallback);
    }
  };

  return (
    <main className="menu-layout">
      <section className="menu-workspace" aria-labelledby="menu-title">
        <div className="menu-intro">
          <div>
            <p className="eyebrow">{t.openTableOrdering}</p>
            <h1 id="menu-title">{t.menu}</h1>
            <p>{t.menuCopy}</p>
          </div>
          <div className="service-note">
            <span>{menu.length}</span>
            <small>{t.availableItems}</small>
          </div>
        </div>

        {confirmation && (
          <div className="status-banner" role="status">
            {t.orderSent}: {t.table} {confirmation.tableNumber}. {t.total} {formatKHR(confirmation.totalKHR)}.
          </div>
        )}

        {error && (
          <div className="error-banner" role="alert">
            {error}
          </div>
        )}

        <div className="category-strip" aria-label={t.menuCategories}>
          {categories.map((category) => (
            <button
              className={category === selectedCategory ? "active" : ""}
              key={category}
              type="button"
              onClick={() => setSelectedCategory(category)}
            >
              {category === "All" ? t.all : category}
            </button>
          ))}
        </div>

        <div className="menu-grid">
          {visibleMenu.map((item) => (
            <article className="menu-item" key={item.id}>
              {item.imageUrl ? (
                <img src={item.imageUrl} alt="" loading="lazy" />
              ) : (
                <div className="image-placeholder" aria-hidden="true">
                  FoodShop
                </div>
              )}
              <div className="menu-item-body">
                <div>
                  <p className="category-label">{item.category}</p>
                  <h2>{item.name}</h2>
                  {item.description && <p>{item.description}</p>}
                  <p className={`stock-note ${item.stock === 0 ? "sold-out" : ""}`}>
                    {item.stock === 0 ? t.soldOut : `${item.stock} ${t.stockLeft}`}
                  </p>
                </div>
                <div className="item-actions">
                  <strong>{formatKHR(item.priceKHR)}</strong>
                  {(cart[item.id] ?? 0) > 0 ? (
                    <div className="quantity-control" aria-label={`${item.name} quantity`}>
                      <button type="button" onClick={() => setQuantity(item.id, (cart[item.id] ?? 0) - 1)}>
                        -
                      </button>
                      <span>{cart[item.id]}</span>
                      <button type="button" onClick={() => setQuantity(item.id, (cart[item.id] ?? 0) + 1)}>
                        +
                      </button>
                    </div>
                  ) : (
                    <button className="primary-action" type="button" disabled={item.stock === 0} onClick={() => setQuantity(item.id, 1)}>
                      {item.stock === 0 ? t.soldOut : t.add}
                    </button>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <CartPanel
        cart={cart}
        items={menu}
        tableNumber={tableNumber}
        totalKHR={totalKHR}
        totalItems={totalItems}
        onClose={() => setCartOpen(false)}
        onOpen={() => setCartOpen(true)}
        open={cartOpen}
        setQuantity={setQuantity}
        setTableNumber={setTableNumber}
        submitOrder={submitOrder}
        t={t}
      />
    </main>
  );
}

type CartPanelProps = {
  cart: CartQuantities;
  items: MenuItem[];
  tableNumber: string;
  totalKHR: number;
  totalItems: number;
  open: boolean;
  onClose: () => void;
  onOpen: () => void;
  setQuantity: (itemId: string, quantity: number) => void;
  setTableNumber: (value: string) => void;
  submitOrder: () => void;
  t: PageCopy;
};

function CartPanel({
  cart,
  items,
  tableNumber,
  totalKHR,
  totalItems,
  open,
  onClose,
  onOpen,
  setQuantity,
  setTableNumber,
  submitOrder,
  t,
}: CartPanelProps) {
  const cartItems = items.filter((item) => cart[item.id]);

  return (
    <>
      <aside id="cart-panel" className={`cart-panel ${open ? "open" : ""}`} aria-label={t.cart}>
        <div className="cart-heading">
          <div>
            <p className="eyebrow">{t.currentTable}</p>
            <h2>{t.cart}</h2>
          </div>
          <button className="close-cart" type="button" onClick={onClose}>
            {t.close}
          </button>
        </div>

        <label className="field-label">
          {t.tableNumber}
          <input
            type="text"
            inputMode="numeric"
            value={tableNumber}
            onChange={(event) => setTableNumber(event.target.value)}
            placeholder={t.tablePlaceholder}
          />
        </label>

        <div className="cart-lines">
          {cartItems.length === 0 ? (
            <p className="empty-state">{t.emptyCart}</p>
          ) : (
            cartItems.map((item) => (
              <div className="cart-line" key={item.id}>
                <div>
                  <strong>{item.name}</strong>
                  <span>
                    {formatKHR(item.priceKHR)} {t.each} - {item.stock} {t.stockLeft}
                  </span>
                </div>
                <div className="quantity-control small" aria-label={`${item.name} cart quantity`}>
                  <button type="button" onClick={() => setQuantity(item.id, cart[item.id] - 1)}>
                    -
                  </button>
                  <span>{cart[item.id]}</span>
                  <button type="button" disabled={cart[item.id] >= item.stock} onClick={() => setQuantity(item.id, cart[item.id] + 1)}>
                    +
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="cart-total">
          <span>
            {totalItems} {t.items}
          </span>
          <strong>{formatKHR(totalKHR)}</strong>
        </div>

        <button
          className="submit-order"
          type="button"
          disabled={!tableNumber.trim() || totalItems === 0}
          onClick={submitOrder}
        >
          {t.submitOrder}
        </button>
      </aside>

      <button
        className={`mobile-cart-summary ${open ? "hidden" : ""}`}
        type="button"
        aria-controls="cart-panel"
        aria-expanded={open}
        onClick={onOpen}
      >
        <span>
          {totalItems} {t.items}
        </span>
        <strong>{formatKHR(totalKHR)}</strong>
        <span>{t.viewCart}</span>
      </button>
      {open && <button className="cart-backdrop" type="button" aria-label={t.close} onClick={onClose} />}
    </>
  );
}

function OwnerPage({ t }: { t: PageCopy }) {
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [draft, setDraft] = useState<MenuItemDraft>(emptyDraft);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const loadOwnerData = async () => {
    try {
      const [nextMenu, nextOrders] = await Promise.all([
        foodShopApi.getAllMenuItems(),
        foodShopApi.listOrders("pending"),
      ]);
      setMenu(nextMenu);
      setOrders(nextOrders);
    } catch (apiError) {
      setIsAuthenticated(false);
      setMenu([]);
      setOrders([]);
      throw apiError;
    }
  };

  useEffect(() => {
    let cancelled = false;

    const checkSession = async () => {
      try {
        const session = await foodShopApi.getOwnerSession();

        if (cancelled) {
          return;
        }

        if (!session.authenticated) {
          setIsAuthenticated(false);
          return;
        }

        setIsAuthenticated(true);
        await loadOwnerData();
      } catch (apiError) {
        if (!cancelled) {
          setError(apiError instanceof Error ? apiError.message : t.invalidOwnerFallback);
          setIsAuthenticated(false);
        }
      }
    };

    void checkSession();

    return () => {
      cancelled = true;
    };
  }, [t.invalidOwnerFallback]);

  const authenticate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    try {
      await foodShopApi.loginOwner(password);
      setPassword("");
      setIsAuthenticated(true);
      await loadOwnerData();
    } catch (apiError) {
      setError(apiError instanceof Error ? apiError.message : t.invalidOwnerFallback);
      setIsAuthenticated(false);
    }
  };

  const saveMenuItem = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    try {
      if (editingId) {
        await foodShopApi.updateMenuItem(editingId, draft);
      } else {
        await foodShopApi.createMenuItem(draft);
      }

      setDraft(emptyDraft);
      setEditingId(null);
      await loadOwnerData();
    } catch (apiError) {
      setError(apiError instanceof Error ? apiError.message : t.saveItemFallback);
    }
  };

  const editItem = (item: MenuItem) => {
    setEditingId(item.id);
    setDraft({
      name: item.name,
      category: item.category,
      priceKHR: item.priceKHR,
      stock: item.stock,
      description: item.description ?? "",
      imageUrl: item.imageUrl ?? "",
      visible: item.visible,
    });
  };

  const deleteItem = async (itemId: string) => {
    await foodShopApi.deleteMenuItem(itemId);
    await loadOwnerData();
  };

  const markDone = async (orderId: string) => {
    await foodShopApi.markOrderDone(orderId);
    await loadOwnerData();
  };

  if (isAuthenticated === null) {
    return (
      <main className="owner-login">
        <div className="pin-form">
          <p className="eyebrow">{t.ownerAccess}</p>
          <h1>{t.enterOwnerPin}</h1>
          <p>Checking owner session.</p>
        </div>
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <main className="owner-login">
        <form className="pin-form" onSubmit={authenticate}>
          <p className="eyebrow">{t.ownerAccess}</p>
          <h1>{t.enterOwnerPin}</h1>
          <p>{t.ownerToolsCopy}</p>
          {error && (
            <div className="error-banner" role="alert">
              {error}
            </div>
          )}
          <label className="field-label">
            {t.ownerPin}
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder={t.ownerPin}
            />
          </label>
          <button className="submit-order" type="submit">
            {t.unlockOwnerTools}
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="owner-layout">
      <section className="owner-section menu-editor" aria-labelledby="menu-editor-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">{t.ownerTools}</p>
            <h1 id="menu-editor-title">{t.menuItems}</h1>
          </div>
          <button
            className="secondary-action"
            type="button"
            onClick={() => {
              setDraft(emptyDraft);
              setEditingId(null);
            }}
          >
            {t.newItem}
          </button>
        </div>

        {error && (
          <div className="error-banner" role="alert">
            {error}
          </div>
        )}

        <form className="menu-form" onSubmit={saveMenuItem}>
          <label className="field-label">
            {t.itemName}
            <input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} required />
          </label>
          <label className="field-label">
            {t.menuCategories}
            <input value={draft.category} onChange={(event) => setDraft({ ...draft, category: event.target.value })} required />
          </label>
          <label className="field-label">
            {t.priceKHR}
            <input
              type="number"
              min="0"
              step="500"
              value={draft.priceKHR}
              onChange={(event) => setDraft({ ...draft, priceKHR: Number(event.target.value) })}
              required
            />
          </label>
          <label className="field-label">
            {t.stock}
            <input
              type="number"
              min="0"
              step="1"
              value={draft.stock}
              onChange={(event) => setDraft({ ...draft, stock: Number(event.target.value) })}
              required
            />
          </label>
          <label className="field-label">
            {t.imageUrl}
            <input value={draft.imageUrl ?? ""} onChange={(event) => setDraft({ ...draft, imageUrl: event.target.value })} />
          </label>
          <label className="field-label full">
            {t.description}
            <textarea value={draft.description ?? ""} onChange={(event) => setDraft({ ...draft, description: event.target.value })} />
          </label>
          <label className="check-label">
            <input
              type="checkbox"
              checked={draft.visible}
              onChange={(event) => setDraft({ ...draft, visible: event.target.checked })}
            />
            {t.visibleOnMenu}
          </label>
          <button className="submit-order" type="submit">
            {editingId ? t.saveChanges : t.addMenuItem}
          </button>
        </form>

        <div className="owner-list">
          {menu.map((item) => (
            <article className="owner-row" key={item.id}>
              <div>
                <span className={item.visible ? "visibility visible" : "visibility hidden"}>
                  {item.visible ? t.visible : t.hidden}
                </span>
                <h2>{item.name}</h2>
                <p>
                  {item.category} - {formatKHR(item.priceKHR)} - {t.stock}: {item.stock}
                </p>
              </div>
              <div className="owner-actions">
                <button type="button" onClick={() => editItem(item)}>
                  {t.edit}
                </button>
                <button type="button" onClick={() => deleteItem(item.id)}>
                  {t.delete}
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="owner-section orders-panel" aria-labelledby="orders-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">{t.kitchenQueue}</p>
            <h1 id="orders-title">{t.pendingOrders}</h1>
          </div>
          <button className="secondary-action" type="button" onClick={() => loadOwnerData()}>
            {t.refresh}
          </button>
        </div>

        <div className="order-list">
          {orders.length === 0 ? (
            <p className="empty-state">{t.noPendingOrders}</p>
          ) : (
            orders.map((order) => (
              <article className="order-row" key={order.id}>
                <div className="order-row-heading">
                  <div>
                    <p className="eyebrow">
                      {t.table} {order.tableNumber}
                    </p>
                    <h2>{formatKHR(order.totalKHR)}</h2>
                  </div>
                  <button className="primary-action" type="button" onClick={() => markDone(order.id)}>
                    {t.markDone}
                  </button>
                </div>
                <ul>
                  {order.items.map((item) => (
                    <li key={item.itemId}>
                      <span>
                        {item.quantity}x {item.name}
                      </span>
                      <strong>{formatKHR(item.quantity * item.priceKHR)}</strong>
                    </li>
                  ))}
                </ul>
              </article>
            ))
          )}
        </div>
      </section>
    </main>
  );
}

export default App;
