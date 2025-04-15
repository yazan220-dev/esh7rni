# NOWPayments Integration Guide

This document provides information about the NOWPayments integration in the Esh7rni SMM service website.

## Overview

NOWPayments has been integrated as an additional payment method alongside PayPal and USDT. This allows users to purchase credits using various cryptocurrencies through the NOWPayments platform.

## Configuration

The following environment variables are required for NOWPayments integration:

```
NOWPAYMENTS_API_KEY="E93B695-EFH4FET-K96CB03-BPF249A"
NOWPAYMENTS_PAYMENT_URL="https://nowpayments.io/payment/?iid=5702636932"
```

These should be added to your `.env.local` file for development and `.env.production` for production deployment.

## Implementation Details

### API Client

The NOWPayments API client is implemented in `/src/lib/api/nowpayments.ts`. This client handles all interactions with the NOWPayments API, including:

- Creating invoices
- Getting payment status
- Verifying webhook signatures
- Generating direct payment URLs

### API Routes

The following API routes have been implemented for NOWPayments:

1. `/api/payments/nowpayments` - Creates a payment and returns a payment URL
2. `/api/payments/nowpayments/webhook` - Handles webhook notifications from NOWPayments
3. `/api/credits/purchase/nowpayments` - Processes credit purchases after successful payment

### User Interface

The NOWPayments payment option has been added to the Credit Purchase Form in `/src/components/dashboard/CreditPurchaseForm.tsx`. Users can select NOWPayments as a payment method and will be redirected to the NOWPayments platform to complete their purchase.

## Payment Flow

1. User selects NOWPayments as the payment method and enters the amount
2. User clicks "Purchase Credits" button
3. The application creates a payment record and generates a NOWPayments URL
4. User is redirected to NOWPayments to complete the payment
5. After payment, NOWPayments sends a webhook notification to our server
6. The webhook handler updates the payment status and credits the user's account

## Testing

To test the NOWPayments integration:

1. Start the development server with `npm run dev`
2. Navigate to the credits purchase page
3. Select NOWPayments as the payment method
4. Enter an amount and click "Purchase Credits"
5. You should be redirected to the NOWPayments platform

## Deployment Considerations

When deploying to production:

1. Ensure the webhook URL is properly configured in your NOWPayments account
2. Update the `NEXTAUTH_URL` in `.env.production` to your actual domain
3. Verify that all API keys and secrets are properly set in your production environment

## Troubleshooting

If you encounter issues with the NOWPayments integration:

1. Check the server logs for error messages
2. Verify that the NOWPayments API key is correct
3. Ensure the webhook URL is properly configured
4. Test the payment flow in development mode before deploying to production
