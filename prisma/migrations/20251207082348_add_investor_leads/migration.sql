-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL_SENT', 'CONVERTED', 'NOT_INTERESTED', 'LOST');

-- CreateTable
CREATE TABLE "investor_lead" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "countryCode" TEXT NOT NULL DEFAULT '+66',
    "investmentBudget" TEXT NOT NULL,
    "investmentGoal" TEXT NOT NULL,
    "timeline" TEXT NOT NULL,
    "preferredAreas" TEXT,
    "propertyType" TEXT,
    "experience" TEXT,
    "financing" TEXT,
    "message" TEXT,
    "newsletter" BOOLEAN NOT NULL DEFAULT true,
    "status" "LeadStatus" NOT NULL DEFAULT 'NEW',
    "assignedToId" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "source" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "investor_lead_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "investor_lead_email_idx" ON "investor_lead"("email");

-- CreateIndex
CREATE INDEX "investor_lead_status_idx" ON "investor_lead"("status");

-- CreateIndex
CREATE INDEX "investor_lead_createdAt_idx" ON "investor_lead"("createdAt");

-- AddForeignKey
ALTER TABLE "investor_lead" ADD CONSTRAINT "investor_lead_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
