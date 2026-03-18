# Mobile App (Expo)

Owner dashboard app for onboarding, call logs, appointments, and runtime agent instructions.

## Setup

```bash
cd mobile
npm install
npm run start
```

## Backend Connection

- In-app setup screen accepts backend URL.
- Default is a LAN URL; update to your machine IP when testing on physical device.
- App sends Expo push token during onboarding and also refreshes it via:
  - `PUT /api/businesses/{business_id}/push-token`

## TestFlight / iOS Build

Prerequisites:
- Expo account logged in (`eas login`)
- Apple Developer account configured in EAS credentials

```bash
cd mobile
npm run build:ios:preview      # Internal test build
npm run build:ios:production   # App Store/TestFlight build
npm run submit:ios             # Submit production build
```

Edit these values before submit in `eas.json`:
- `submit.production.ios.appleId`
- `submit.production.ios.ascAppId`
- `submit.production.ios.appleTeamId`
