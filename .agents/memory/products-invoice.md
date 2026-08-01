---
name: Products & Invoice Customer
description: Products catalog and free-text customer name in invoices
---

**Products table:** `productsTable` in lib/db/src/schema/products.ts — columns: id, name, unit, price, isActive. No inventory/stock management.

**Why:** Clinic needs to quickly pick services/items by name+price when creating invoices, without maintaining stock levels.

**Invoice customer:** `invoices.customer_name` is a free-text column (added alongside the existing `customer_id` foreign key). The form now uses a plain text `<Input>` instead of a customer select dropdown.

**How to apply:** In `enrichInvoice()` in the invoices route, `customerName` from the text column takes priority over the customer table lookup. Both old invoices (with customerId) and new invoices (with customerName text) work correctly.

**Product picker:** In invoice form, each item row has a Package icon button that opens a search dialog listing active products. Selecting a product fills itemName, unit, and price automatically.
