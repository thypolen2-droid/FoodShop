# Food Shop Menu Web App Plan

## Summary
Build a responsive FoodShop web app with three routes:

- `/` redirects or links customers into `/menu`.
- `/menu` lets customers browse menu items, add items to cart, enter a table number, and submit an order.
- `/owner` is PIN-protected and lets the owner manage food items/prices and handle submitted table orders.

Use KHR + English labels by default. Orders are submitted to the backend, and the owner can view pending orders and mark them done.

## Key Changes
- Use the existing Firebase-style architecture as the default implementation path: React/Expo web frontend + Firebase Functions API + Firestore storage.
- Replace video-focused concepts with food shop concepts:
  - `menuItems`: name, category, priceKHR, optional description, optional imageUrl, visible, createdAt, updatedAt.
  - `orders`: tableNumber, items, totalKHR, status `pending | done`, createdAt, completedAt.
- Customer flow:
  - Browse visible menu items grouped by category.
  - Add/remove items and change quantities in a cart.
  - Require table number before submitting.
  - Show order confirmation after submit.
- Owner flow:
  - `/owner` asks for an owner PIN/admin key.
  - Owner can add, edit, hide/show, and delete food items.
  - Owner can view pending orders by table, see item quantities and totals, and mark orders done.

## Responsive UI Direction
- Make `/menu` the primary experience, not a marketing landing page.
- Use a clean food-menu layout that works on phone first, then expands to tablet/desktop:
  - Mobile: category filter, menu list, sticky cart summary, cart drawer/sheet.
  - Desktop: menu grid/list with a persistent cart panel.
- Include real food imagery via optional item image URLs and a tasteful default placeholder when missing.
- Keep copy practical and customer-facing: menu, cart, table number, submit order, pending orders.
- Avoid card-heavy dashboard styling except where cards are the interaction, such as menu items and order rows.

## Test Plan
- Customer can load `/menu`, see only visible items, add multiple quantities, remove items, and submit only after entering a table number.
- Submitted order saves correct table number, item IDs, item names, quantities, per-item prices, and total KHR.
- Owner PIN rejects invalid access and allows valid owner actions.
- Owner can create, edit, hide/show, and delete menu items.
- Owner can view pending orders and mark an order done.
- Responsive checks at mobile, tablet, and desktop widths: no text overflow, cart remains usable, tap targets stay accessible.

## Assumptions
- Currency is Cambodian Riel with English UI labels.
- The first version does not include online payment, customer login, QR table scanning, inventory, discounts, or printed kitchen tickets.
- Owner access uses a private PIN/admin key for MVP speed.
- If this is later implemented in the current repo, the default path is to convert the existing GhostTube Expo/Firebase app into FoodShop rather than keeping both apps in one project.
