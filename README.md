# FoodShop

FoodShop is a small-shop food ordering web app with two experiences:

- `/menu` for customers to browse food, add items to cart, enter a table number, and submit an order
- `/owner` for the shop owner to log in securely, manage menu items and stock, and confirm pending orders

The project is built for a lightweight local setup:

- React + Vite frontend
- Express backend
- bcrypt-hashed owner password
- HTTP-only owner session cookie
- JSON file data store for menu items and orders

## Features

### Customer
- View visible menu items only
- Category filter
- Quantity controls with stock limits
- Sold-out handling
- Mobile bottom-sheet cart
- Table number order submission
- Khmer / English mode
- Light / Dark mode

### Owner
- Secure password login at `/owner`
- Add, edit, hide, show, and delete menu items
- Edit price, description, image URL, and stock count
- View pending orders
- Confirm orders
- Stock automatically decreases when an order is confirmed

## Tech Stack

- React 19
- Vite 8
- Express 5
- bcryptjs
- cookie
- dotenv

## Project Structure

```text
src/                 frontend app
server/              Express server and shared data store
server/data/         JSON data storage
scripts/             helper scripts
```

## Local Development

### 1. Install dependencies

```bash
npm install
```

### 2. Create the owner password

Generate a bcrypt hash:

```bash
npm run hash-password -- "YourStrongPassword"
```

Copy the hash into `.env`:

```env
OWNER_PASSWORD_HASH=your_generated_bcrypt_hash
PORT=8787
```

An example file is included at `.env.example`.

### 3. Start the app

```bash
npm run dev
```

This starts:

- Express API server on `http://localhost:8787`
- Vite frontend on `http://localhost:5173` or the next available port

Open:

- Customer menu: `http://localhost:5173/menu`
- Owner login: `http://localhost:5173/owner`

## Build

```bash
npm run build
```

## Deploy on Render from GitHub

This app needs a Node server and writable storage, so deploy it as a Render web service instead of GitHub Pages.

### 1. Prepare GitHub

- Keep `.env` out of GitHub
- Review `server/data/store.json` and keep only safe starter/demo data
- Push the repo to GitHub and keep `main` as the deployment branch

### 2. Create the owner password hash

Generate a bcrypt hash locally:

```bash
npm run hash-password -- "YourStrongPassword"
```

Copy the result and keep it ready for Render as `OWNER_PASSWORD_HASH`.

### 3. Create the Render service

This repo includes `render.yaml`, so Render can create the service from the repository settings:

- Service type: Web Service
- Runtime: Node
- Build command: `npm ci && npm run build`
- Start command: `npm start`
- Auto-deploy: enabled for `main`

Set these environment variables in Render:

- `NODE_ENV=production`
- `OWNER_PASSWORD_HASH=<your bcrypt hash>`
- `STORE_FILE=/var/data/store.json`

Let Render provide `PORT`.

### 4. Attach persistent storage

Add a persistent disk and mount it at:

```text
/var/data
```

The app will then store menu/order data at:

```text
/var/data/store.json
```

If the store file does not exist yet, the server creates it automatically with an empty menu and order list.

### 5. Launch checks

After the first deploy:

- Open `/menu`
- Open `/owner`
- Log in with the owner password
- Create a menu item
- Submit a test order
- Confirm the order as owner
- Redeploy once and verify the data is still present

## Security Model

This project does **not** keep the owner password in React or in `VITE_*` variables.

Security is handled like this:

- Owner password is verified on the Express server
- The password is stored only as a bcrypt hash in `.env`
- Successful owner login creates an HTTP-only session cookie
- Owner-only API routes require that session
- Customer routes can only read public menu data and submit orders

For a small local-network shop, this is much safer than a frontend-only PIN.

## Data Storage

By default, local data is stored in:

```text
server/data/store.json
```

You can override the location with `STORE_FILE`. This is useful for public hosting with a persistent disk, such as:

```text
/var/data/store.json
```

That file contains:

- `menuItems`
- `orders`

Because this is a file-based setup, it is simple and easy to run, but it is best suited for a small shop and one shared deployment.

## Main API Routes

### Public
- `GET /api/menu`
- `POST /api/orders`

### Owner Auth
- `GET /api/auth/session`
- `POST /api/auth/login`
- `POST /api/auth/logout`

### Owner Protected
- `GET /api/owner/menu`
- `POST /api/owner/menu`
- `PUT /api/owner/menu/:itemId`
- `DELETE /api/owner/menu/:itemId`
- `GET /api/owner/orders`
- `POST /api/owner/orders/:orderId/confirm`

## Notes

- `/menu` does not show the owner navigation link
- On mobile, the cart stays hidden at the bottom until the user opens it
- Hidden menu items are not shown to customers
- Confirming an order reduces stock and marks the order as done

## Next Improvements

- Search and sort for menu items
- Order history and completed orders view
- Low-stock alerts
- Backup/export for `store.json`
- HTTPS deployment for use outside a trusted local network
