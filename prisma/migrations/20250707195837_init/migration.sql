-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Player" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    CONSTRAINT "Player_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Pokemon" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "species" TEXT NOT NULL,
    "nickname" TEXT,
    "level" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "playerId" INTEGER NOT NULL,
    CONSTRAINT "Pokemon_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Link" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "sessionId" TEXT NOT NULL,
    "pokemonAId" INTEGER NOT NULL,
    "pokemonBId" INTEGER NOT NULL,
    CONSTRAINT "Link_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Link_pokemonAId_fkey" FOREIGN KEY ("pokemonAId") REFERENCES "Pokemon" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Link_pokemonBId_fkey" FOREIGN KEY ("pokemonBId") REFERENCES "Pokemon" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
