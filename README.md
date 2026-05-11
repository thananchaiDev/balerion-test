# Balerion Test

Monorepo with 3 projects:

- `backend/` — Go: library/CLI that converts numbers to **Thai Baht words** (baht / satang)
- `frontend/react/` — React + TypeScript + Tailwind + Vite (Allocation UI)
- `frontend/react-native/` — React Native (bare CLI) + TypeScript + NativeWind (Allocation UI)

---

## Prerequisites

| For | Required |
|---|---|
| backend | Go 1.21+ |
| frontend/react | Node.js ≥ 22.11, npm (or pnpm/yarn) |
| frontend/react-native | Node.js ≥ 22.11, Watchman, JDK 17, Xcode + CocoaPods (iOS), Android Studio + SDK (Android) |

Follow the official React Native environment setup:
https://reactnative.dev/docs/set-up-your-environment

---

## 1) Backend — `backend/` (Go: thaibaht)

### Run interactive CLI

```bash
cd backend
go run ./cmd/interactive
```

Opens a prompt — type a number, get the Thai Baht reading.

### Run example

```bash
cd backend
go run ./cmd/example
```

### Use as a library

```go
import (
    "balerion-test/thaibaht/thaibaht"
    "github.com/shopspring/decimal"
)

d, _ := decimal.NewFromString("1000001.50")
fmt.Println(thaibaht.ToThaiBaht(d))
// หนึ่งล้านเอ็ดบาทห้าสิบสตางค์
```

### Test

```bash
cd backend
go test ./...
```

---

## 2) Frontend (Web) — `frontend/react/`

Vite + React 19 + TypeScript + Tailwind

Live demo: https://react-zeta-teal.vercel.app

### Install

```bash
cd frontend/react
npm install
```

### Dev server

```bash
npm run dev
```

Open http://localhost:5173

### Build / Preview

```bash
npm run build
npm run preview
```

### Lint

```bash
npm run lint
```

---

## 3) Frontend (Mobile) — `frontend/react-native/`

React Native 0.85 (bare CLI, not Expo) + TypeScript + NativeWind

### Install dependencies

```bash
cd frontend/react-native
npm install
```

### iOS — install Pods (first run, or after adding a native dep)

```bash
cd ios && pod install && cd ..
```

> On Apple Silicon, if you hit issues, try `arch -x86_64 pod install` or `bundle exec pod install`.

### Start Metro bundler

```bash
npm start
```

### Run iOS (requires Xcode + simulator)

In another terminal:

```bash
npm run ios
```

### Run Android (start an emulator or connect a device first)

```bash
npm run android
```

### Test / Lint

```bash
npm test
npm run lint
```

---

## Repository layout

```
balerion-test/
├── backend/                 # Go — thaibaht converter
│   ├── cmd/
│   │   ├── example/         # demo runner
│   │   └── interactive/     # CLI prompt
│   └── thaibaht/            # library
└── frontend/
    ├── react/               # Web (Vite)
    └── react-native/        # Mobile (RN bare)
```
