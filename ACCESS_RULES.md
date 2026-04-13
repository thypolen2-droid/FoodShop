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
Owners use `/owner` after entering the owner PIN.

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

The current app uses a client-side owner PIN for MVP speed. This protects the owner screen from casual use, but it is not real security because browser code and `localStorage` can be inspected by a user.

For production, enforce these rules in a backend:
- Use Firebase Authentication or another auth provider for owner login.
- Keep owner role claims on the server, not in browser state.
- Move menu writes, stock updates, and order confirmation into Firebase Functions.
- Use Firestore Security Rules so customers can only read visible menu items and create pending orders.
- Use a transaction when confirming orders so stock updates and order status changes happen together.
