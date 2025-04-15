# Environment Variables Guide for Esh7rni Deployment

This guide lists all the environment variables needed for your Esh7rni deployment on Vercel without a database.

## Authentication Variables

```
# NextAuth Configuration
NEXTAUTH_URL=https://esh7rni.me
NEXTAUTH_SECRET=b8e78a3c9f1d5e2a7b6c4d9e8f7a2b5c3d6e9f8a7b4c1d2e5f8a9c6b3d

# Google OAuth (Optional - only if you want Google login)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

## Payment Integration Variables

```
# NOWPayments API
NOWPAYMENTS_API_KEY=E93B695-EFH4FET-K96CB03-BPF249A
NOWPAYMENTS_PAYMENT_URL=https://nowpayments.io/payment/?iid=5702636932

# PayPal (if you're using PayPal)
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_SECRET=your_paypal_secret
PAYPAL_WEBHOOK_ID=your_paypal_webhook_id

# Binance Pay (if you're using Binance Pay)
BINANCE_API_KEY=your_binance_api_key
BINANCE_API_SECRET=your_binance_api_secret
```

## API Integration Variables

```
# SMMCOST API
SMMCOST_API_KEY=52c7a1b8ef5742e795e5429fe780f510
```

## Email Configuration (Optional)

```
# Email (for email notifications)
EMAIL_SERVER_HOST=your_smtp_host
EMAIL_SERVER_PORT=your_smtp_port
EMAIL_SERVER_USER=your_smtp_username
EMAIL_SERVER_PASSWORD=your_smtp_password
EMAIL_FROM=your_email_address
```

## Important Notes

1. **Database**: Since you're not using a database, we've modified the NextAuth configuration to use JWT storage instead. You don't need to set the `DATABASE_URL` variable.

2. **Google OAuth**: If you want to enable Google login, you'll need to create OAuth credentials in the Google Cloud Console:
   - Go to https://console.cloud.google.com/
   - Create a new project or use an existing one
   - Navigate to "APIs & Services" > "Credentials"
   - Create an OAuth client ID (Web application type)
   - Add your domain (esh7rni.me) and Vercel preview URLs to the authorized redirect URIs:
     - https://esh7rni.me/api/auth/callback/google
     - https://esh7rni-yazan220-dev.vercel.app/api/auth/callback/google
   - Copy the generated Client ID and Client Secret to your environment variables

3. **Vercel Setup**: Add these environment variables in your Vercel project settings before deploying.

4. **Security**: Keep these values secret and never commit them to your repository.
