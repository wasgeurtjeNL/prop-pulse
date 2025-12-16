-- CreateTable
CREATE TABLE "rental_lead" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "countryCode" TEXT NOT NULL DEFAULT '+66',
    "propertyType" TEXT NOT NULL,
    "bedrooms" TEXT NOT NULL,
    "budget" TEXT NOT NULL,
    "rentalDuration" TEXT NOT NULL,
    "preferredAreas" TEXT,
    "moveInDate" TEXT,
    "furnished" TEXT,
    "pets" TEXT,
    "message" TEXT,
    "newsletter" BOOLEAN NOT NULL DEFAULT true,
    "status" "LeadStatus" NOT NULL DEFAULT 'NEW',
    "assignedToId" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "source" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rental_lead_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "rental_lead_email_idx" ON "rental_lead"("email");

-- CreateIndex
CREATE INDEX "rental_lead_status_idx" ON "rental_lead"("status");

-- CreateIndex
CREATE INDEX "rental_lead_createdAt_idx" ON "rental_lead"("createdAt");

-- AddForeignKey
ALTER TABLE "rental_lead" ADD CONSTRAINT "rental_lead_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
