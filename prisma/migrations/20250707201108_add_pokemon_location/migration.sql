/*
  Warnings:

  - Added the required column `location` to the `Pokemon` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Pokemon" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "species" TEXT NOT NULL,
    "nickname" TEXT,
    "level" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "playerId" INTEGER NOT NULL,
    CONSTRAINT "Pokemon_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Pokemon" ("id", "level", "nickname", "playerId", "species", "status") SELECT "id", "level", "nickname", "playerId", "species", "status" FROM "Pokemon";
DROP TABLE "Pokemon";
ALTER TABLE "new_Pokemon" RENAME TO "Pokemon";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
