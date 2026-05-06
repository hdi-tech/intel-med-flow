// Shared pricing display helpers — single source of truth for price rendering.
// All prices come from the database; never hardcode.

export type PriceType = "fixed" | "range" | "custom_quote" | "free";

export interface PricedService {
  price_type?: PriceType | null;
  price_usd?: number | null;
  price_min_usd?: number | null;
  price_max_usd?: number | null;
  is_custom_quote?: boolean | null;
  quote_note?: string | null;
}

export const resolvePriceType = (s: PricedService): PriceType => {
  if (s.price_type) return s.price_type;
  if (s.is_custom_quote) return "custom_quote";
  return "fixed";
};

export const formatPrice = (s: PricedService): string => {
  const t = resolvePriceType(s);
  if (t === "free") return "Free";
  if (t === "custom_quote") return "Custom Quote";
  if (t === "range") {
    const lo = Number(s.price_min_usd ?? 0);
    const hi = Number(s.price_max_usd ?? 0);
    return `$${lo.toFixed(0)} – $${hi.toFixed(0)} USD`;
  }
  return `$${Number(s.price_usd ?? 0).toFixed(2)} USD`;
};

// Numeric base price used for cart/totals. Returns null when no fixed amount applies.
export const basePrice = (s: PricedService): number | null => {
  const t = resolvePriceType(s);
  if (t === "free") return 0;
  if (t === "fixed") return Number(s.price_usd ?? 0);
  if (t === "range") return Number(s.price_min_usd ?? 0); // show min as starting point
  return null; // custom_quote — no price until admin quotes
};
