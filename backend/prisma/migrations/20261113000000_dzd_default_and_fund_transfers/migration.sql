-- Algeria is the first launch market: the Algerian dinar becomes the default currency.
ALTER TABLE "User" ALTER COLUMN "currency" SET DEFAULT 'DZD';

-- Existing accounts are test accounts that got the old SAR default; move them to DZD.
UPDATE "User" SET "currency" = 'DZD' WHERE "currency" = 'SAR';

-- A deposit into a joint fund moves the owner's own money: it is a transfer, not income.
-- Re-label the auto-created "Funding" categories and the deposits recorded under them,
-- so they stop inflating income totals.
UPDATE "Category" SET "type" = 'transfer' WHERE "name" = 'Funding';

UPDATE "Transaction" SET "type" = 'transfer'
WHERE "type" = 'income'
  AND "fundId" IS NOT NULL
  AND "categoryId" IN (SELECT "id" FROM "Category" WHERE "name" = 'Funding');
