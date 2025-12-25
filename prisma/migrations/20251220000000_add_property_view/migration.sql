-- CreateTable
CREATE TABLE "property_view" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "country" TEXT,
    "city" TEXT,
    "ipHash" TEXT,
    "userAgent" TEXT,
    "referrer" TEXT,
    "sessionId" TEXT,

    CONSTRAINT "property_view_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "property_view_propertyId_idx" ON "property_view"("propertyId");

-- CreateIndex
CREATE INDEX "property_view_viewedAt_idx" ON "property_view"("viewedAt");

-- CreateIndex
CREATE INDEX "property_view_country_idx" ON "property_view"("country");

-- AddForeignKey
ALTER TABLE "property_view" ADD CONSTRAINT "property_view_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "property"("id") ON DELETE CASCADE ON UPDATE CASCADE;





