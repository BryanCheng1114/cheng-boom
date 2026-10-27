-- Keep the existing standard price as Seller A, add Seller B, and remove
-- the retired agent and promotion price columns.
ALTER TABLE "Product" RENAME COLUMN "price" TO "sellerAPrice";
ALTER TABLE "Product" RENAME COLUMN "boxPrice" TO "sellerABoxPrice";
ALTER TABLE "Product" RENAME COLUMN "bundlePrice" TO "sellerABundlePrice";

ALTER TABLE "Product"
  ADD COLUMN "sellerBPrice" DOUBLE PRECISION,
  ADD COLUMN "sellerBBoxPrice" DOUBLE PRECISION,
  ADD COLUMN "sellerBBundlePrice" DOUBLE PRECISION;

UPDATE "Product"
SET
  "sellerBPrice" = "sellerAPrice",
  "sellerBBoxPrice" = "sellerABoxPrice",
  "sellerBBundlePrice" = "sellerABundlePrice";

ALTER TABLE "Product"
  ALTER COLUMN "sellerBPrice" SET NOT NULL,
  DROP COLUMN "sellerPrice",
  DROP COLUMN "promotion",
  DROP COLUMN "boxSellerPrice",
  DROP COLUMN "boxPromotion",
  DROP COLUMN "bundleSellerPrice",
  DROP COLUMN "bundlePromotion";
