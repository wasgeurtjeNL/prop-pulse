-- CreateTable
CREATE TABLE "agent_invite" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "email" TEXT,
    "role" TEXT NOT NULL DEFAULT 'AGENT',
    "maxUses" INTEGER NOT NULL DEFAULT 1,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "usedBy" TEXT,
    "usedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agent_invite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "agent_invite_code_key" ON "agent_invite"("code");

-- CreateIndex
CREATE INDEX "agent_invite_code_idx" ON "agent_invite"("code");

-- CreateIndex
CREATE INDEX "agent_invite_email_idx" ON "agent_invite"("email");

-- CreateIndex
CREATE INDEX "agent_invite_isActive_idx" ON "agent_invite"("isActive");





