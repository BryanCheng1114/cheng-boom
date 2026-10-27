type PricingInput = {
  sellerAPrice: unknown;
  sellerBPrice: unknown;
  sellerABoxPrice?: unknown;
  sellerBBoxPrice?: unknown;
  itemsPerBox?: unknown;
  sellerABundlePrice?: unknown;
  sellerBBundlePrice?: unknown;
  bundleQuantity?: unknown;
};

const isBlank = (value: unknown) => value === undefined || value === null || value === '';
const isValidPrice = (value: unknown) => !isBlank(value) && Number.isFinite(Number(value)) && Number(value) >= 0;

export function validateProductPricing(pricing: PricingInput): string | null {
  if (!isValidPrice(pricing.sellerAPrice) || !isValidPrice(pricing.sellerBPrice)) {
    return 'Seller A and Seller B single-item prices are required and must be non-negative.';
  }
  if (!isBlank(pricing.itemsPerBox) && (!Number.isInteger(Number(pricing.itemsPerBox)) || Number(pricing.itemsPerBox) < 2)) {
    return 'Items per box must be a whole number of at least 2.';
  }
  if (!isBlank(pricing.bundleQuantity) && (!Number.isInteger(Number(pricing.bundleQuantity)) || Number(pricing.bundleQuantity) < 2)) {
    return 'Items per bundle must be a whole number of at least 2.';
  }

  const boxAPresent = !isBlank(pricing.sellerABoxPrice);
  const boxBPresent = !isBlank(pricing.sellerBBoxPrice);
  if (boxAPresent !== boxBPresent) return 'Enter both Seller A and Seller B box prices, or leave both blank.';
  if (boxAPresent && (!isValidPrice(pricing.sellerABoxPrice) || !isValidPrice(pricing.sellerBBoxPrice))) {
    return 'Box prices must be valid non-negative amounts.';
  }
  if (boxAPresent && (!Number.isInteger(Number(pricing.itemsPerBox)) || Number(pricing.itemsPerBox) < 2)) {
    return 'Enter at least 2 items per box when adding box prices.';
  }

  const bundleAPresent = !isBlank(pricing.sellerABundlePrice);
  const bundleBPresent = !isBlank(pricing.sellerBBundlePrice);
  if (bundleAPresent !== bundleBPresent) return 'Enter both Seller A and Seller B bundle prices, or leave both blank.';
  if (bundleAPresent && (!isValidPrice(pricing.sellerABundlePrice) || !isValidPrice(pricing.sellerBBundlePrice))) {
    return 'Bundle prices must be valid non-negative amounts.';
  }
  if (bundleAPresent && (!Number.isInteger(Number(pricing.bundleQuantity)) || Number(pricing.bundleQuantity) < 2)) {
    return 'Enter at least 2 items per bundle when adding bundle prices.';
  }

  return null;
}
