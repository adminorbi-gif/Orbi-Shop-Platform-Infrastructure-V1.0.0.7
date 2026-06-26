# Payments & Escrow Integration Architecture

## 1. Overview
The ORBI Pay system operates as a secure escrow layer. It decouples the core **Order Lifecycle** from the **Payment Lifecycle**. This ensures the platform strictly adheres to consumer protection policies by holding funds in escrow until the delivery is verified by the buyer. 

By keeping these two state machines independent but synchronized, ORBI Shop provides transparency to both buyers and sellers while ensuring zero money movement without proper authorization and conditions being met.

## 2. Dual State Machine Design

### 2.1 Order Flow State Machine
The Order state dictates the physical and logical condition of the purchased items. It is the primary driver of the transaction.
- **CREATED**: Order is instantiated in the system.
- **AWAITING_PAYMENT**: Customer is in the checkout/payment gateway attempting to secure funds.
- **PAYMENT_HELD**: Funds are successfully secured in Escrow. Merchant is notified to start preparing the order.
- **PROCESSING**: Merchant acknowledges the order and is preparing it for shipment.
- **SHIPPED**: Merchant hands over the parcel to the delivery carrier.
- **DELIVERED**: Carrier marks the parcel as physically dropped off.
- **BUYER_CONFIRMED**: Buyer verifies receipt and satisfaction of the items.
- **DISPUTED**: Buyer or Seller halts the flow due to an issue (e.g., damaged goods, missing items).
- **RELEASED**: The completed end-state. The dispute window has closed and the transaction is legally finalized.
- **REFUNDED**: Order is reversed completely, and the customer has been made whole.
- **CANCELLED**: Order is aborted before fulfillment starts.

### 2.2 Payment State Machine (Escrow Ledger)
The Payment state strictly monitors the movement of actual funds.
- **requires_action**: Waiting for client authentication, Mobile Money PIN validation, or Bank OTP.
- **processing**: The gateway is attempting to capture the funds.
- **held**: Funds have been securely captured and locked in the ORBI Pay Escrow.
- **disputed**: The Escrow hold is locked while arbitration occurs.
- **released**: Funds are distributed from Escrow to the Seller's payout wallet.
- **refunded**: Funds are routed back from Escrow to the Buyer's payment method.
- **failed**: The user had insufficient funds, or the gateway rejected the transaction.

## 3. State Synchronization Flow (Order ➔ Payment)

The core tenet of this architecture is that **Order State dictates Payment State transitions**:

1. `Order: CREATED` ➔ `Payment: requires_action`
2. `Order: AWAITING_PAYMENT` ➔ `Payment: processing`
3. *Gateway Success* ➔ `Payment: held` ➔ triggers `Order: PAYMENT_HELD`
4. `Order: PROCESSING` & `SHIPPED` & `DELIVERED` ➔ **No Payment change** (`Payment: held`).
5. `Order: BUYER_CONFIRMED` ➔ triggers `Payment: released` ➔ triggers `Order: RELEASED`
6. `Order: DISPUTED` ➔ triggers `Payment: disputed`
7. *Arbitration Decision for Buyer* ➔ triggers `Payment: refunded` ➔ triggers `Order: REFUNDED`
8. *Arbitration Decision for Seller* ➔ triggers `Payment: released` ➔ triggers `Order: RELEASED`

## 4. Architectural Implementation Details

### Database Layer
- Table `orders`: Maintains the `status` enum matching the **Order Flow State Machine**.
- Table `payments`: Tracks `status` matching the **Payment State Machine**, with an `order_id` foreign key bridging the two entities.

### Triggers & Webhooks
- **Gateway Webhooks**: Listens for internal `processing`, `failed`, or `held` events to update the DB `payments` ledger.
- **Order Services**: Core business logic modules. Once the buyer clicks "Confirm Delivery", the service hits the `api/orders/:id/confirm` endpoint, changing the order to `BUYER_CONFIRMED`, and publishing an event to the `PaymentsModule` to execute the release from Escrow (`held` ➔ `released`).

### Advanced Use Cases & Policies
- **Auto-release**: A scheduler routinely checks for orders in `DELIVERED` state older than X days. If no dispute was filed, it transitions order to `BUYER_CONFIRMED` automatically, cascading to `Payment: released`.
- **Dispuste Resolution**: Admin arbitration actions directly drive the Escrow resolution. If resolved for the buyer, funds trace back; for the seller, they release.
- **Partial Refunds**: In the event of a mutual negotiation in a `DISPUTED` state, the backend can issue tailored percentage transactions, resulting in the payment state moving to `released` (for the seller portion) and `refunded` (for the buyer portion).
