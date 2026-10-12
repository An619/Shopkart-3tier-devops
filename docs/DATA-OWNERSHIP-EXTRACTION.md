# ShopKart data-ownership extraction plan

Status: implementation is still in the strangler phase. The Node domain processes are
separately deployable, but they share the legacy PostgreSQL schema. This document is
the required migration contract before changing runtime database routing; simply giving
each process a different database name would break existing cart, checkout, review,
and admin flows.

## Current coupling verified in source

| Domain | Current tables / cross-domain dependency | Safe extraction requirement |
| --- | --- | --- |
| Identity | `users`; JWT subject is the numeric user ID | Identity owns user records. Other services retain the user ID as an external identifier and must not join the identity database. |
| Catalog | `products`, `categories`, `reviews`; reviews join `users` for display name | Catalog owns product/category/review data. Review author display names must be stored as a snapshot or resolved through an Identity API. |
| Cart | `carts`, `cart_items`; cart reads join `products` and `categories` and reads current product price | Cart owns cart records. Product details and price must come from Catalog API; cart rows should retain a product ID and an explicit price snapshot. |
| Orders | `orders`, `order_items`, `payments`; checkout currently updates `products.stock` in the same SQL transaction | Orders owns order/payment records. Inventory reservation and release must be an explicit API/event workflow; do not pretend a distributed transaction exists. |
| Wishlist | `wishlists` / wishlist items; references user and product IDs | Wishlist owns its records and stores external IDs without cross-database foreign keys. Product existence is validated via Catalog API. |
| Admin | administrative routes mutate multiple legacy domains | Admin becomes an orchestration/API client, not an owner of other domains' tables. |

## Safe implementation sequence

1. **Catalog first:** create versioned catalog migrations for categories, products, and reviews; backfill from the legacy database; add reconciliation counts; switch catalog reads/writes only after parity checks. Keep the legacy database as a rollback source during the cutover window.
2. **Remove read joins:** make Cart use a bounded-timeout Catalog HTTP client for product snapshots. Persist product name/image/price snapshots in cart items so a Catalog outage does not make a user's cart unreadable. Add tests for timeout, 404, and unavailable Catalog responses.
3. **Inventory ownership:** move stock to the Inventory service and introduce reservation IDs with idempotent reserve/release operations. Never decrement stock with `GREATEST(stock - quantity, 0)`; reserve conditionally and reject insufficient stock.
4. **Checkout orchestration:** Orders calls Inventory reserve, records a pending order, then confirms or releases reservation on payment outcome. Add idempotency keys and compensating actions before enabling checkout against separated databases.
5. **Identity and Wishlist:** remove cross-domain SQL/FK assumptions, retain external IDs, and add API contract tests.
6. **Admin and cleanup:** route admin changes through owning service APIs; remove legacy schema access only after all domains pass integration tests and data reconciliation.

## Cutover gates

- Every service has its own versioned migration folder and explicit DB credentials.
- A migration/backfill can be repeated safely and reports source/destination counts.
- Contract tests cover success, 404, timeout, retry, and malformed responses.
- Checkout tests cover insufficient stock, duplicate requests, payment failure, and reservation release.
- Compose integration tests pass with separate databases; Kubernetes manifests use one Secret per database identity and no cross-domain SQL credentials.
- A rollback procedure is documented and tested before deleting legacy tables.

## Current status / do not infer

The existing `microservices/domain-compose.yml` intentionally shares the legacy database
to preserve current API behavior. The Java Product/Order/Inventory experiment is another
track and is not yet the authoritative implementation behind the Node frontend. Do not
claim database-per-service or production-ready microservices until the gates above pass.
