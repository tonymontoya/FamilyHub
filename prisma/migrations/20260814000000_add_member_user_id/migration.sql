-- Link Member to Better-Auth User via a real foreign key.
-- Previously resolvers coupled Member.username to session.user.email, which broke
-- child login (child Member.username is the short name, not the synthetic email).
-- Parents: Member.username == User.email (set by setup-family).
-- Children: Member.username == User.username (set by children route).

-- 1. Add nullable column so existing rows can be backfilled.
ALTER TABLE "members" ADD COLUMN "user_id" TEXT;

-- 2. Backfill from the matching Better-Auth user record.
UPDATE "members" m
SET "user_id" = u."id"
FROM "user" u
WHERE m."user_id" IS NULL
  AND (u."email" = m."username" OR u."username" = m."username");

-- 3. Enforce NOT NULL now that every member is linked.
ALTER TABLE "members" ALTER COLUMN "user_id" SET NOT NULL;

-- 4. One member per Better-Auth user.
CREATE UNIQUE INDEX "members_user_id_key" ON "members"("user_id");

-- 5. Foreign key to the Better-Auth user table.
ALTER TABLE "members"
  ADD CONSTRAINT "members_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT;
