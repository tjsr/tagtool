-- Store historical MySQL BIGINT identifiers as text to avoid precision loss.
CREATE TABLE "User" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "email" TEXT NOT NULL UNIQUE
);

CREATE TABLE "Tags" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "objectId" TEXT COLLATE NOCASE NOT NULL,
  "tag" TEXT COLLATE NOCASE NOT NULL,
  "createdByUserId" TEXT COLLATE NOCASE NOT NULL
);
CREATE INDEX "Tags_objectId_idx" ON "Tags" ("objectId");
CREATE INDEX "Tags_owner_object_tag_idx" ON "Tags" ("createdByUserId", "objectId", "tag");

CREATE TABLE "session" (
  "session_id" TEXT NOT NULL PRIMARY KEY,
  "sess" TEXT NOT NULL,
  "expire" INTEGER NOT NULL
);
CREATE INDEX "session_expire_idx" ON "session" ("expire");
