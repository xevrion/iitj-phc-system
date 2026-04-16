-- AlterTable
ALTER TABLE "ExternalDocument"
ADD COLUMN "cloudinaryPublicId" TEXT,
ADD COLUMN "cloudinaryResourceType" TEXT,
ADD COLUMN "originalFilename" TEXT;
