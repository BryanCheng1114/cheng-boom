type ProductWithSellerPricing = {
  sellerAPrice: number | null;
  sellerBPrice: number | null;
  sellerABoxPrice: number | null;
  sellerBBoxPrice: number | null;
  sellerABundlePrice: number | null;
  sellerBBundlePrice: number | null;
};

/**
 * Keep legacy storefront consumers working while the customer pricing UI is
 * migrated separately. The database and admin APIs use Seller A/B field names.
 */
export function serializeProduct<T extends ProductWithSellerPricing>(product: T) {
  return {
    ...product,
    price: product.sellerAPrice,
    sellerPrice: product.sellerAPrice,
    promotion: null,
    boxPrice: product.sellerABoxPrice,
    boxSellerPrice: product.sellerABoxPrice,
    boxPromotion: null,
    bundlePrice: product.sellerABundlePrice,
    bundleSellerPrice: product.sellerABundlePrice,
    bundlePromotion: null,
  };
}
