-- AlterTable
ALTER TABLE "viewing_request" ADD COLUMN     "cancelledAt" TIMESTAMP(3),
ADD COLUMN     "cancelledBy" TEXT,
ADD COLUMN     "cancelledByName" TEXT;
