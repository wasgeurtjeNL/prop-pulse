/*
  Warnings:

  - You are about to drop the `Property` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "PropertyCategory" AS ENUM ('LUXURY_VILLA', 'APARTMENT', 'RESIDENTIAL_HOME', 'OFFICE_SPACES');

-- DropForeignKey
ALTER TABLE "Property" DROP CONSTRAINT "Property_userId_fkey";

-- DropTable
DROP TABLE "Property";

-- CreateTable
CREATE TABLE "property" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "price" TEXT NOT NULL,
    "beds" INTEGER NOT NULL,
    "baths" DOUBLE PRECISION NOT NULL,
    "sqft" INTEGER NOT NULL,
    "type" "PropertyType" NOT NULL,
    "category" "PropertyCategory" NOT NULL DEFAULT 'RESIDENTIAL_HOME',
    "tag" TEXT,
    "status" "Status" NOT NULL DEFAULT 'ACTIVE',
    "image" TEXT NOT NULL,
    "shortDescription" TEXT,
    "descriptionParagraphs" JSONB,
    "propertyFeatures" JSONB,
    "amenities" TEXT[],
    "amenitiesWithIcons" JSONB,
    "content" TEXT NOT NULL,
    "yearBuilt" INTEGER,
    "mapUrl" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "property_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "property_image" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "alt" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "property_image_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "property_slug_key" ON "property"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "property_image_propertyId_position_key" ON "property_image"("propertyId", "position");

-- AddForeignKey
ALTER TABLE "property" ADD CONSTRAINT "property_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property_image" ADD CONSTRAINT "property_image_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "property"("id") ON DELETE CASCADE ON UPDATE CASCADE;
