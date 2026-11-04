UPDATE "BusinessSettings"
SET "businessName" = 'Dolphin Firework'
WHERE "businessName" ~* 'cheng[[:space:]-]*boom';

ALTER TABLE "BusinessSettings"
ALTER COLUMN "businessName" SET DEFAULT 'Dolphin Firework';
