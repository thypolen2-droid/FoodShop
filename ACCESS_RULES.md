# FoodShop Access Rules

## Roles

### Customer
Customers use `/menu`.

Can:
- View visible menu items only.
- View item name, category, price, description, image, and stock availability.
- Add available items to cart up to the current stock count.
- Remove items or change quantities before submitting.
- Enter a table number.
- Submit an order with status `pending`.
- See their local order confirmation after submitting.
- Switch Khmer/English mode.
- Switch Light/Dark mode.

Cannot:
- Open owner tools without the owner PIN.
- Create, edit, hide, show, or delete menu items.
- Edit prices or stock numbers.
- View all pending orders.
- Mark orders done.
- Manually change submitted orders.
- See hidden menu items.

### Owner
Owners use `/owner` after entering the owner password.

Can:
- View all menu items, including hidden items.
- Add new menu items.
- Edit item name, category, price, stock count, description, image URL, and visibility.
- Hide or show items on the customer menu.
- Delete menu items.
- View pending orders by table.
- Confirm an order as done.
- Reduce stock automatically when confirming an order.
- Switch Khmer/English mode.
- Switch Light/Dark mode.

Cannot:
- Confirm the same order twice to reduce stock twice.
- Reduce stock below zero.
- Edit a completed order in the current MVP.
- Take payment, refund payment, or manage users in the current MVP.

## Security Notes

The app now uses a small Express backend for owner authentication and role enforcement:
- Owner password is checked on the server, not in React.
- Successful owner login creates an HTTP-only session cookie.
- Owner-only API routes require that session.
- Menu and order data are stored in a shared server-side JSON file for this small-shop setup.

Recommended setup rules:
- Keep a strong owner password.
- Store only `OWNER_PASSWORD_HASH` in `.env`, not the plain password.
- Use `npm run hash-password -- "YourStrongPassword"` to generate a bcrypt hash.
- Keep `/menu` public and `/owner` hidden from customer navigation.
- Use HTTPS when exposing the app outside a trusted local network.
