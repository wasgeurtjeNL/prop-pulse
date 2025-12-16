/*
  Warnings:

  - Added the required column `updatedAt` to the `property_image` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "RequestType" AS ENUM ('SCHEDULE_VIEWING', 'MAKE_OFFER');

-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED');

-- AlterTable
ALTER TABLE "property_image" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "url" DROP NOT NULL;

-- CreateTable
CREATE TABLE "viewing_request" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "requestType" "RequestType" NOT NULL,
    "viewingDate" TIMESTAMP(3),
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "countryCode" TEXT NOT NULL DEFAULT '+66',
    "language" TEXT,
    "message" TEXT,
    "status" "RequestStatus" NOT NULL DEFAULT 'PENDING',
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "viewing_request_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "viewing_request" ADD CONSTRAINT "viewing_request_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "property"("id") ON DELETE CASCADE ON UPDATE CASCADE;
