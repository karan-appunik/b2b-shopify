# SparkLayer setup: run the app and see the cart drawer

Three projects run together: `backend-api`, `merchant-panel` and `admin-frontend`.
Each has its own `.env`. Copy `.env.example` to `.env` in each and fill in the values
(ask the team for the secrets; `.env` is never committed).

## 1. Start backend-api

1. Make sure MongoDB is running.
2. In `backend-api`: `npm install`, then `npm run dev`.
3. Open `http://localhost:5000/api/health`.
   You should see `db: "connected"`.

## 2. Start merchant-panel

1. In `merchant-panel`: `npm install`, then `npm run dev`.
2. Open `http://localhost:3001`.
   You should see the merchant login page.

## 3. Start admin-frontend (Shopify app)

1. In `admin-frontend`: `npm install`, then `npm run dev`.
2. Log in to Shopify when asked and choose the development store.
3. Open the app from the store admin.
   You should see the SparkLayer home page.

## 4. Open the dashboard from the app

1. On the app home page, click **Open Dashboard**.
   A new tab opens on the merchant panel, already signed in.
   (This needs `MERCHANT_PANEL_URL` in `admin-frontend/.env`.)

## 5. Turn on the cart drawer in the theme

1. Store admin: **Online Store > Themes > Customize**.
2. Open **Theme settings > Cart** and set **Cart type** to **Drawer**.
3. Open **App embeds** and switch **Appunik Cart Drawer** on. Save.
4. On the storefront, add a product to the cart, then click the cart icon.
   You should see the SparkLayer cart inside the theme's drawer:
   Expand button, SKU and options line, quantity buttons, Actions menu.

## 6. Try a shopping list

1. In the cart drawer, click **Actions > Save shopping list**, type a name and save.
   You should see a "Shopping list saved" message.
2. Click **Actions** again. Your list is shown under **Shopping lists**.
3. Choose **Add items to existing cart** or **Create new cart**.
   You should see the green "Items have been successfully added" banner.

## Notes for deploying

1. `shopify app deploy` publishes the storefront extension (drawer code, locales).
2. On a live server set `MERCHANT_PANEL_URL`, `BACKEND_API_URL` and `VITE_BACKEND_API_URL`
   to the live addresses instead of `localhost`.
3. The cart drawer only appears when the theme's Cart type is **Drawer**.
