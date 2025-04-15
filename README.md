# Esh7rni - Social Media Marketing Service

Esh7rni is a professional SMM (Social Media Marketing) service website built with modern technologies and best practices. This platform allows users to purchase social media marketing services like followers, likes, and views for various platforms including Instagram, TikTok, and Telegram.

## Features

- **Full SMMCOST API Integration**: Sync services, display details, and process orders
- **Authentication System**: Email and Google login using next-auth
- **Ordering System**: Place orders and track their status
- **Payment Processing**: PayPal and Binance Pay integration
- **Admin Dashboard**: Manage users, services, orders, and transactions
- **User Dashboard**: Track orders and purchase services
- **Theming**: Dark/light mode toggle with dynamic logo switching
- **Responsive Design**: Mobile-friendly interface
- **Security**: CSRF protection, input validation, secure headers, and more
- **Ad Monetization Ready**: Placeholder spaces for Adsterra banner ads

## Tech Stack

- **Frontend**: Next.js with App Router, TypeScript, Tailwind CSS
- **Authentication**: NextAuth.js with Email and Google providers
- **Database**: Prisma ORM
- **API Integration**: SMMCOST API for services and orders
- **Payment Gateways**: PayPal and Binance Pay
- **Deployment**: Vercel with GitHub integration

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database
- SMMCOST API key
- PayPal and Binance Pay API credentials
- Google OAuth credentials (for Google login)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/esh7rni.git
   cd esh7rni
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env.local` file in the root directory with the following variables:
   ```
   # Database
   DATABASE_URL="postgresql://username:password@localhost:5432/esh7rni"

   # NextAuth
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-nextauth-secret"

   # Google OAuth
   GOOGLE_CLIENT_ID="your-google-client-id"
   GOOGLE_CLIENT_SECRET="your-google-client-secret"

   # SMMCOST API
   SMMCOST_API_KEY="your-smmcost-api-key"

   # PayPal
   PAYPAL_CLIENT_ID="your-paypal-client-id"
   PAYPAL_SECRET="your-paypal-secret"
   PAYPAL_WEBHOOK_ID="your-paypal-webhook-id"

   # Binance Pay
   BINANCE_API_KEY="your-binance-api-key"
   BINANCE_API_SECRET="your-binance-api-secret"

   # Email (for email authentication)
   EMAIL_SERVER_HOST="your-smtp-host"
   EMAIL_SERVER_PORT="your-smtp-port"
   EMAIL_SERVER_USER="your-smtp-username"
   EMAIL_SERVER_PASSWORD="your-smtp-password"
   EMAIL_FROM="your-email-address"
   ```

4. Set up the database:
   ```bash
   npx prisma migrate dev --name init
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions on deploying to Vercel and connecting your Namecheap domain.

## Project Structure

```
esh7rni/
├── public/               # Static assets
│   └── images/           # Images including logos
├── prisma/               # Prisma schema and migrations
├── src/
│   ├── app/              # Next.js App Router
│   │   ├── api/          # API routes
│   │   ├── auth/         # Authentication pages
│   │   ├── dashboard/    # Dashboard pages
│   │   └── ...           # Other pages
│   ├── components/       # React components
│   │   ├── ui/           # UI components
│   │   ├── layout/       # Layout components
│   │   └── ...           # Other components
│   ├── lib/              # Utility functions and libraries
│   │   ├── api/          # API clients
│   │   ├── auth/         # Authentication utilities
│   │   ├── security/     # Security utilities
│   │   └── ...           # Other utilities
│   └── types/            # TypeScript type definitions
├── .env.local            # Environment variables (not in repo)
├── next.config.js        # Next.js configuration
├── tailwind.config.ts    # Tailwind CSS configuration
└── ...                   # Other configuration files
```

## Security

This project implements several security measures:

- **Authentication**: Secure user authentication with next-auth
- **Authorization**: Role-based access control
- **CSRF Protection**: Protection against cross-site request forgery
- **Input Validation**: Validation and sanitization of user inputs
- **Secure Headers**: HTTP security headers
- **Rate Limiting**: Protection against brute force attacks
- **Secure Routes**: Protected API routes and pages

## License

This project is proprietary and not open for redistribution or use without explicit permission.

## Acknowledgements

- [Next.js](https://nextjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [NextAuth.js](https://next-auth.js.org/)
- [Prisma](https://www.prisma.io/)
- [SMMCOST API](https://smmcost.com/api/v2)
- [PayPal API](https://developer.paypal.com/)
- [Binance Pay API](https://developers.binance.com/)
