# أثر - Athar Charity Platform

Modern charity donation platform built with React, Vite, Firebase, and Tailwind CSS.

## Features

- **Public Home Page**: Beautiful landing page with live donation counters
- **Donation Flow**: Multi-step donation process with payment method selection
- **Admin Dashboard**: Manage donations, approve/reject submissions, add manual entries
- **Real-time Updates**: Live counters powered by Firebase Firestore
- **RTL Support**: Full Arabic language support with right-to-left layout
- **Animations**: Smooth animations using Framer Motion

## Tech Stack

- React 18 + Vite
- Firebase (Firestore, Auth, Storage)
- Tailwind CSS
- Framer Motion
- React Router

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure Firebase:
   - Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
   - Enable Firestore, Authentication (Email/Password), and Storage
   - Copy `.env.example` to `.env` and fill in your Firebase config

3. Run development server:
   ```bash
   npm run dev
   ```

4. Build for production:
   ```bash
   npm run build
   ```

## Firebase Setup

### Firestore Collections

**donations**
```json
{
  "amount": 350,
  "paymentMethod": "InstaPay",
  "screenshotURL": "...",
  "status": "pending" | "approved" | "rejected",
  "type": "donation" | "manual",
  "createdAt": timestamp
}
```

### Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /donations/{donation} {
      allow read: if true;
      allow create: if true;
      allow update, delete: if request.auth != null;
    }
  }
}
```

## Pages

- `/` - Home page with donation counters
- `/donate` - Donation flow
- `/admin` - Admin dashboard (requires login)
- `/login` - Admin login

## License

MIT
