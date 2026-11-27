# Simple Concepts Shop

Mobile shopping app for Simple Concepts' CCTV, surveillance and smart home products.

**Current status:** Customers can browse products, sign in with phone + OTP, check out with Cash on Delivery, track and cancel orders, get in-app notifications, and leave feedback and product reviews. The shop owner can manage products and orders at `/admin`. The admin dashboard, categories, banners and push notifications are still to do. See [CLAUDE.md §14](CLAUDE.md) for the full plan.

> OTP is in test mode until an SMS provider is connected: every phone number gets the code `123456`.

| Folder | What it is |
|---|---|
| `apps/mobile` | Expo React Native app |
| `apps/api` | NestJS API |
| `apps/api/prisma` | PostgreSQL schema and migrations |
| `packages/shared` | Code shared by the app and API |

## 1. What you need

- [VS Code](https://code.visualstudio.com/)
- [Node.js LTS](https://nodejs.org/) (version 26 is used here)
- [PostgreSQL 17](https://www.postgresql.org/download/)
- An Android or iPhone with the **Expo Go** app, from the Play Store or App Store
- Your computer and phone on the **same Wi-Fi network**

> On this PC, Node.js and PostgreSQL are already installed, the database is created, and both `.env` files exist. Skip to [step 3](#3-run-the-project).

## 2. First-time setup on a new computer

Open the project folder in VS Code, then open a terminal with **Terminal → New Terminal**.

**Install packages and build the shared code:**

```powershell
npm install
npm run build --workspace @simple-concepts/shared
```

**Create the database** (enter your PostgreSQL password when asked):

```powershell
& "C:\Program Files\PostgreSQL\17\bin\psql.exe" -U postgres -h localhost -c "CREATE DATABASE simple_concepts_shop;"
```

**Create the API settings file:**

```powershell
Copy-Item .env.example apps\api\.env
```

Open `apps/api/.env` and replace `CHANGE_ME` in `DATABASE_URL` with your PostgreSQL password. Never commit this file.

**Create the tables:**

```powershell
cd apps\api
npx prisma migrate dev
cd ..\..
```

**Create the mobile settings file** at `apps/mobile/.env`, using your computer's Wi-Fi IP address ([how to find it](#find-your-computers-ip-address)):

```env
EXPO_PUBLIC_API_BASE_URL=http://192.168.1.4:3000/api/v1
```

## 3. Run the project

You need **two terminals** in VS Code. Click the **+** in the terminal panel to open the second one.

**Terminal 1: start the API**

```powershell
cd C:\dev\eShopApp\apps\api
npm run start:dev
```

Wait for it to finish starting, then open <http://localhost:3000/api/v1/health> in your browser. You should see:

```json
{"data":{"status":"ok"}}
```

**Terminal 2: start the mobile app**

```powershell
cd C:\dev\eShopApp\apps\mobile
npx expo start
```

A **QR code** appears in the terminal.

## 4. Preview on your phone

1. Connect your phone to the same Wi-Fi as your computer.
2. Install **Expo Go**.
3. Scan the QR code:
   - **Android:** open Expo Go and tap **Scan QR code**.
   - **iPhone:** open the Camera app and tap the Expo Go link.
4. Wait for the first load, which can take a minute.

You should see the **Simple Concepts** home screen with products.

Saved code changes appear on the phone automatically. Press `r` in Terminal 2 to reload the app, and `Ctrl+C` in a terminal to stop that server.

## 5. Build an Android installer (APK)

Expo's EAS Build service builds the APK online. You need a free account at [expo.dev](https://expo.dev).

```powershell
cd C:\dev\eShopApp\apps\mobile
npx eas-cli login
npx eas-cli build --platform android --profile preview
```

On the first build, answer **Yes** when it asks to create the EAS project and to generate a new Android keystore. The build takes about 10–20 minutes. When it finishes, the terminal shows a link and QR code. Open it on the phone, download the APK and install it. Android asks you to allow installs from your browser the first time.

This **preview** APK connects to the API on this PC at `http://192.168.1.4:3000`, so it works only when:

- the phone is on the same Wi-Fi, and
- the API is running on this PC (Terminal 1 in step 3).

If the PC's IP address changes, update `EXPO_PUBLIC_API_BASE_URL` in `apps/mobile/eas.json` and build again. For real customers, the API must first be hosted online with HTTPS; the `production` profile then builds the Play Store bundle.

### Use the app on any network (ngrok tunnel)

The **tunnel** APK connects to `https://implode-reload-acuteness.ngrok-free.dev`, a free ngrok address that forwards to the API on this PC. It works on any Wi-Fi or mobile data while this PC is on and runs the API and the tunnel.

**Quick start:** double-click `start-server.cmd` in the project folder. It opens one window for the API and one for the tunnel, and skips any part that is already running. Close both windows to stop.

Or start them yourself in two terminals:

```powershell
# Terminal 1: the API
cd C:\dev\eShopApp\apps\api
npm run start:dev

# Terminal 2: the tunnel
cd C:\dev\eShopApp
npm run tunnel
```

Build the tunnel APK with `npx eas-cli build --platform android --profile tunnel` (in `apps/mobile`). The address never changes, so you only rebuild when the app itself changes.

While the tunnel runs, anyone who knows the address can reach the API, and the OTP test code `123456` works for every number. Use it for testing and demos only, and stop it (`Ctrl+C`) when you are done. ngrok itself is set up once with `ngrok config add-authtoken <token>` from the ngrok dashboard.

## Troubleshooting

### Find your computer's IP address

```powershell
ipconfig
```

Use the **IPv4 Address** under **Wireless LAN adapter Wi-Fi**, for example `192.168.1.4`.

### The app says "Could not reach the server"

1. Check that Terminal 1 is still running.
2. Open `http://YOUR-IP:3000/api/v1/health` in your **phone's browser**.
3. If your IP changed, update `apps/mobile/.env`, then restart with a cleared cache:

   ```powershell
   npx expo start --clear
   ```

Home routers can assign a new IP after a restart, so check this first if the app worked before.

### The phone cannot open the app or the health page

Windows Firewall is the most likely cause. Set your Wi-Fi to private in **Settings → Network & internet → Wi-Fi → your network properties → Private network**.

Then open **PowerShell as Administrator** and allow the two development ports on private networks only:

```powershell
New-NetFirewallRule -DisplayName "Simple Concepts Dev" -Direction Inbound -Action Allow -Protocol TCP -LocalPort 3000,8081 -Profile Private
```

Also check that your router does not have **AP isolation** or **guest network** mode turned on, because both stop devices from reaching each other.

### Expo Go says the project is incompatible

Update Expo Go from the app store. This project uses **Expo SDK 58**.

### "Cannot find module '@simple-concepts/shared'" after moving the project folder

The link to the shared code still points to the old folder. From the project root, run:

```powershell
npm install
npm run build --workspace @simple-concepts/shared
Remove-Item -Recurse -Force apps\mobile\.expo\cache\eslint
```

### A port is already in use

Stop the other terminal running the server with `Ctrl+C`, or close that terminal.

## Useful commands

Run these from the project root:

```powershell
npm run lint
npm run typecheck
npm test
npm run test:e2e --workspace api
```

Project rules and the build plan are in [CLAUDE.md](CLAUDE.md).
