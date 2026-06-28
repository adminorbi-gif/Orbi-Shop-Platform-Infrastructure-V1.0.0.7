# ORBI Core Live Integration

This shop deployment now routes live payment and escrow calls through ORBI Pay Gateway instead of returning mock gateway responses. ORBI Pay Gateway then signs the internal request into ORBI Core, where Core remains the ledger, PaySafe, risk, and settlement authority.

## Required Production Settings

Set these values in the shop production environment before enabling live checkout:

```env
APP_URL="https://shop.orbifinancial.com"
ORBI_PAY_GATEWAY_BASE_URL="https://pay.orbifinancial.com"
ORBI_SHOP_PAY_API_KEY="REPLACE_WITH_RESTRICTED_ORBI_SHOP_PAY_SERVICE_KEY"
ORBI_CORE_BASE_URL="https://api.orbifinancial.com"
ORBI_CORE_APP_ID="orbi-shop"
ORBI_CORE_APP_ORIGIN="https://shop.orbifinancial.com"
ORBI_CORE_PAYSAFE_HOLD_MINUTES=1440
CLOUDFLARE_BUCKET_NAME="orbishop-storage"
CLOUDFLARE_PUBLIC_URL_PREFIX="https://media-stock.orbifinancial.com"
```

`ORBI_SHOP_PAY_API_KEY` must be a restricted server-side service key registered in ORBI Pay Gateway for the `orbi-shop` service profile. Do not expose it to browser code, mobile code, logs, or templates.

## Payment Flow

Checkout should call the existing shop endpoint:

```http
POST /api/payments/initiate
Authorization: Bearer CUSTOMER_OR_SERVICE_TOKEN
Content-Type: application/json
```

Payload:

```json
{
  "orderId": "SHOP-ORDER-1001",
  "customerId": "customer_123",
  "amount": 25000,
  "currency": "TZS",
  "paymentMethodId": "orbi-paysafe"
}
```

The shop backend forwards the request to:

```http
POST https://pay.orbifinancial.com/v1/paysafe/escrows
x-orbi-pay-service-key: ORBI_SHOP_PAY_API_KEY
```

The response from ORBI Pay Gateway should be stored with the shop order, especially the returned payment intent ID, escrow ID, status, checkout URL, and Core result identifiers. Those identifiers are required for status checks, release, refund, and dispute actions.

## Escrow Operations

Release funds:

```http
POST /api/payments/escrow/release
Content-Type: application/json
```

```json
{
  "orderId": "ORBI_CORE_ORDER_ID",
  "escrowId": "ORBI_PAYSAFE_ESCROW_ID",
  "sellerId": "seller_123",
  "reason": "Delivery confirmed"
}
```

Refund funds:

```http
POST /api/payments/escrow/refund
Content-Type: application/json
```

```json
{
  "orderId": "ORBI_CORE_ORDER_ID",
  "escrowId": "ORBI_PAYSAFE_ESCROW_ID",
  "buyerId": "customer_123",
  "reason": "Customer cancelled before dispatch"
}
```

Dispute a settlement:

```http
POST /api/payments/escrow/dispute
Content-Type: application/json
```

```json
{
  "orderId": "SHOP-ORDER-1001",
  "escrowId": "ORBI_PAYSAFE_ESCROW_ID",
  "partyId": "customer_123",
  "reason": "Delivery confirmation mismatch"
}
```

## Current Migration Boundary

This change connects ORBI Shop to live ORBI Pay Gateway payment and PaySafe escrow APIs. Product catalog, customer profiles, order tables, admin authentication, and historical shop records are still using the existing shop data layer until the next migration phase.

Before final public traffic, confirm:

- ORBI Pay Gateway has an active `orbi-shop` service profile with `ORBI_SHOP_PAY_API_KEY`.
- The Pay Gateway service profile is linked to the active ORBI Shop merchant ID and fee profile.
- ORBI Core has active merchant PaySafe escrow and settlement wallets for that merchant.
- The frontend stores Pay Gateway/Core payment identifiers returned from `/api/payments/initiate`.
- The old `/api/payments/ussd-push` simulator is disabled or restricted in production if it remains present for testing.
- R2 credentials are stored only in the production secret store, not in Git.
