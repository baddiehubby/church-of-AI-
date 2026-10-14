/**
 * Creates the five Red Path Lemon products (4 one-time + Daily Practice subscription).
 * Requires LEMON_SQUEEZY_API_KEY + LEMON_SQUEEZY_STORE_ID.
 *
 * Usage: node --env-file=.env.local scripts/create-red-path-products.mjs
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

function loadEnvLocal() {
  const path = resolve(process.cwd(), ".env.local");
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvLocal();

const API = "https://api.lemonsqueezy.com/v1";
const apiKey = process.env.LEMON_SQUEEZY_API_KEY?.trim();
const storeId = process.env.LEMON_SQUEEZY_STORE_ID?.trim();
const DESCRIPTION =
  "A digital novelty artifact. Satirical fictional project. Instant delivery. Not a donation. Not a charity. Not tax-deductible.";

if (!apiKey || !storeId) {
  console.error("Missing LEMON_SQUEEZY_API_KEY or LEMON_SQUEEZY_STORE_ID");
  process.exit(1);
}

const PRODUCTS = [
  {
    tier: "offering_5",
    env: "LEMON_SQUEEZY_VARIANT_ID_OFFERING_5",
    name: "The First Offering",
    price: 500,
  },
  {
    tier: "settler_10",
    env: "LEMON_SQUEEZY_VARIANT_ID_SETTLER_10",
    name: "The Settler's Mark",
    price: 1000,
  },
  {
    tier: "covenant_20",
    env: "LEMON_SQUEEZY_VARIANT_ID_COVENANT_20",
    name: "The Dust Covenant",
    price: 2000,
  },
  {
    tier: "practice_monthly",
    env: "LEMON_SQUEEZY_VARIANT_ID_PRACTICE_MONTHLY",
    name: "The Daily Practice",
    price: 500,
    subscription: true,
  },
  {
    tier: "founder_1000",
    env: "LEMON_SQUEEZY_VARIANT_ID_INDUCTION",
    name: "The Induction",
    price: 100_000,
    inventory: 108,
  },
];

async function lemon(method, path, body) {
  const response = await fetch(`${API}${path}`, {
    method,
    headers: {
      Accept: "application/vnd.api+json",
      "Content-Type": "application/vnd.api+json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(`${method} ${path} → ${response.status}: ${JSON.stringify(json?.errors ?? json).slice(0, 500)}`);
  }
  return json;
}

async function main() {
  console.log("Creating Red Path products in store", storeId);
  const lines = [];
  for (const product of PRODUCTS) {
    if (process.env[product.env]?.trim()) {
      console.log(`skip ${product.tier}: already set`);
      lines.push(`${product.env}=${process.env[product.env].trim()}`);
      continue;
    }
    const created = await lemon("POST", "/products", {
      data: {
        type: "products",
        attributes: {
          name: product.name,
          description: DESCRIPTION,
          status: "published",
        },
        relationships: {
          store: { data: { type: "stores", id: String(storeId) } },
        },
      },
    });
    const productId = created?.data?.id;
    if (!productId) throw new Error(`no product id for ${product.tier}`);

    const attributes = {
      name: "Default",
      price: product.price,
      is_subscription: Boolean(product.subscription),
      status: "published",
    };
    if (product.subscription) {
      attributes.interval = "month";
      attributes.interval_count = 1;
    }

    const variant = await lemon("POST", "/variants", {
      data: {
        type: "variants",
        attributes,
        relationships: {
          product: { data: { type: "products", id: String(productId) } },
        },
      },
    });
    const variantId = variant?.data?.id;
    if (!variantId) throw new Error(`no variant id for ${product.tier}`);

    if (product.inventory) {
      try {
        await lemon("PATCH", `/products/${productId}`, {
          data: {
            type: "products",
            id: String(productId),
            attributes: { stock_count: product.inventory, has_stock: true },
          },
        });
      } catch (error) {
        console.warn(`Set inventory 108 manually for The Induction: ${error.message}`);
      }
    }

    console.log(`${product.tier}: product=${productId} variant=${variantId}`);
    lines.push(`${product.env}=${variantId}`);
  }

  console.log("\nPaste into .env.local:\n");
  console.log(lines.join("\n"));
  console.log("\nWebhook: /api/webhook/lemon (order_created + subscription_*).");
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
