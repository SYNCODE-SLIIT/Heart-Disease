# HeartSense - CHD Risk Assessment Web App

A Next.js-based web application for 10-year Coronary Heart Disease (CHD) risk prediction using machine learning. Built with React, TypeScript, Tailwind CSS, and optional Supabase authentication.

## Features

- 🏥 **CHD Risk Assessment** - Advanced ML model for cardiovascular risk prediction
- 🔐 **User Authentication** - Optional Supabase auth with mock fallback for local dev
- 📊 **My Data** - Save and manage your analyses (placeholder - coming soon)
- 📱 **Responsive Design** - Works seamlessly on desktop and mobile
- 🎨 **Modern UI** - Built with Tailwind CSS and custom components

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- (Optional) A Supabase account for real authentication

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd chd-web
```

2. Install dependencies:
```bash
npm install
```

3. (Optional) Configure Supabase authentication:
```bash
cp .env.example .env.local
```

Edit `.env.local` and add your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

> **Note:** If you don't configure Supabase, the app will use a mock authentication provider that stores user data in localStorage. This is perfect for local development and testing.

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Authentication Setup

### Option 1: Mock Auth (Default - No Setup Required)

The app includes a built-in mock authentication provider that:
- Simulates sign-up and sign-in flows
- Stores user data in browser localStorage
- Works without any external services
- Perfect for development and testing

Simply run the app and start using the authentication features immediately!

### Option 2: Real Supabase Authentication

To use real authentication with Supabase:

1. Create a free Supabase project at [supabase.com](https://supabase.com)

2. Get your project credentials from the Supabase dashboard:
   - Navigate to **Settings** → **API**
   - Copy your **Project URL** and **anon/public key**

3. Add credentials to `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

4. Restart the development server

The app will automatically detect the Supabase configuration and switch from mock to real authentication!

## Project Structure

```
chd-web/
├── src/
│   ├── components/
│   │   ├── ui/              # Reusable UI components (Button, Input, Toast)
│   │   ├── Nav.tsx          # Navigation with auth state
│   │   ├── Hero.tsx         # Landing page hero
│   │   └── Footer.tsx       # Site footer
│   ├── lib/
│   │   └── supabaseClient.ts # Auth client with mock fallback
│   ├── pages/
│   │   ├── index.tsx        # Home page
│   │   ├── login.tsx        # Login page
│   │   ├── signup.tsx       # Sign up page
│   │   ├── my-data.tsx      # User data page (placeholder)
│   │   ├── predictor.tsx    # CHD risk predictor
│   │   └── _app.tsx         # App wrapper
│   └── styles/
│       └── globals.css      # Global styles and animations
├── public/                  # Static assets
├── .env.example            # Environment template
└── README.md               # This file
```

## Available Pages

- **`/`** - Home page with hero and features
- **`/predictor`** - CHD risk assessment tool
- **`/login`** - User login page
- **`/signup`** - User registration page
- **`/my-data`** - Saved analyses (requires authentication)
- **`/about`** - About the application
- **`/privacy`** - Privacy policy

## Tech Stack

- **Framework:** Next.js 15 with TypeScript
- **Styling:** Tailwind CSS 4
- **Authentication:** Supabase (with mock fallback)
- **State Management:** React Hooks + TanStack Query
- **Form Handling:** React Hook Form + Zod validation

## Development

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

## Learn More

To learn more about the technologies used:

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Supabase Authentication](https://supabase.com/docs/guides/auth)
- [TypeScript](https://www.typescriptlang.org/docs)

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new).

Remember to add your environment variables in the Vercel dashboard if using real Supabase authentication.

## License

[Your License Here]

