type PricingInput = {
  sellerAPrice?: unknown;
  sellerBPrice?: unknown;
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
  const singleAPresent = !isBlank(pricing.sellerAPrice);
  const singleBPresent = !isBlank(pricing.sellerBPrice);
  if (singleAPresent !== singleBPresent) {
    return 'Enter both Seller A and Seller B single-item prices, or leave both blank.';
  }
  if (singleAPresent && (!isValidPrice(pricing.sellerAPrice) || !isValidPrice(pricing.sellerBPrice))) {
    return 'Single-item prices must be valid non-negative amounts.';
  }

  const boxAPresent = !isBlank(pricing.sellerABoxPrice);
  const boxBPresent = !isBlank(pricing.sellerBBoxPrice);
  const itemsPerBoxPresent = !isBlank(pricing.itemsPerBox);
  if (boxAPresent !== boxBPresent) {
    return 'Enter both Seller A and Seller B box prices, or leave both blank.';
  }
  if (boxAPresent && (!isValidPrice(pricing.sellerABoxPrice) || !isValidPrice(pricing.sellerBBoxPrice))) {
    return 'Box prices must be valid non-negative amounts.';
  }
  if (boxAPresent && (!Number.isInteger(Number(pricing.itemsPerBox)) || Number(pricing.itemsPerBox) < 2)) {
    return 'Enter at least 2 items per box when adding box prices.';
  }
  if (itemsPerBoxPresent && !boxAPresent) {
    return 'Enter both Seller A and Seller B box prices when specifying items per box.';
  }

  const bundleAPresent = !isBlank(pricing.sellerABundlePrice);
  const bundleBPresent = !isBlank(pricing.sellerBBundlePrice);
  const bundleQtyPresent = !isBlank(pricing.bundleQuantity);
  if (bundleAPresent !== bundleBPresent) {
    return 'Enter both Seller A and Seller B bundle prices, or leave both blank.';
  }
  if (bundleAPresent && (!isValidPrice(pricing.sellerABundlePrice) || !isValidPrice(pricing.sellerBBundlePrice))) {
    return 'Bundle prices must be valid non-negative amounts.';
  }
  if (bundleAPresent && (!Number.isInteger(Number(pricing.bundleQuantity)) || Number(pricing.bundleQuantity) < 2)) {
    return 'Enter at least 2 items per bundle when adding bundle prices.';
  }
  if (bundleQtyPresent && !bundleAPresent) {
    return 'Enter both Seller A and Seller B bundle prices when specifying items per bundle.';
  }

  const hasSingle = singleAPresent && isValidPrice(pricing.sellerAPrice) && isValidPrice(pricing.sellerBPrice);
  const hasBox = boxAPresent && isValidPrice(pricing.sellerABoxPrice) && isValidPrice(pricing.sellerBBoxPrice) && Number.isInteger(Number(pricing.itemsPerBox)) && Number(pricing.itemsPerBox) >= 2;
  const hasBundle = bundleAPresent && isValidPrice(pricing.sellerABundlePrice) && isValidPrice(pricing.sellerBBundlePrice) && Number.isInteger(Number(pricing.bundleQuantity)) && Number(pricing.bundleQuantity) >= 2;

  if (!hasSingle && !hasBox && !hasBundle) {
    return 'At least one pricing option (Single, Box, or Bundle) must be fully configured.';
  }

  return null;
}
