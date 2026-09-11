-- CreateEnum
CREATE TYPE "BusinessType" AS ENUM ('INDIVIDUAL', 'CORPORATE');

-- CreateEnum
CREATE TYPE "PriceUnit" AS ENUM ('MONTH', 'YEAR');

-- CreateEnum
CREATE TYPE "IndustryRegistrationStatus" AS ENUM ('AVAILABLE', 'OEM_REQUIRED', 'PERMIT_REQUIRED', 'UNAVAILABLE');

-- CreateTable
CREATE TABLE "Industry" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "keywords" TEXT[],
    "description" TEXT,
    "registrationStatus" "IndustryRegistrationStatus" NOT NULL DEFAULT 'AVAILABLE',
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Industry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Office" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "address" TEXT,
    "price" INTEGER NOT NULL,
    "priceUnit" "PriceUnit" NOT NULL,
    "isNonCongested" BOOLEAN NOT NULL DEFAULT false,
    "permitAddressSupported" BOOLEAN NOT NULL DEFAULT false,
    "siteInspectionSupported" BOOLEAN NOT NULL DEFAULT false,
    "buildingUse" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Office_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OfficeBusinessType" (
    "officeId" TEXT NOT NULL,
    "businessType" "BusinessType" NOT NULL,

    CONSTRAINT "OfficeBusinessType_pkey" PRIMARY KEY ("officeId","businessType")
);

-- CreateTable
CREATE TABLE "OfficeIndustry" (
    "officeId" TEXT NOT NULL,
    "industryId" TEXT NOT NULL,

    CONSTRAINT "OfficeIndustry_pkey" PRIMARY KEY ("officeId","industryId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Industry_name_key" ON "Industry"("name");

-- CreateIndex
CREATE INDEX "Office_region_idx" ON "Office"("region");

-- CreateIndex
CREATE INDEX "OfficeIndustry_industryId_idx" ON "OfficeIndustry"("industryId");

-- AddForeignKey
ALTER TABLE "OfficeBusinessType" ADD CONSTRAINT "OfficeBusinessType_officeId_fkey" FOREIGN KEY ("officeId") REFERENCES "Office"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfficeIndustry" ADD CONSTRAINT "OfficeIndustry_officeId_fkey" FOREIGN KEY ("officeId") REFERENCES "Office"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfficeIndustry" ADD CONSTRAINT "OfficeIndustry_industryId_fkey" FOREIGN KEY ("industryId") REFERENCES "Industry"("id") ON DELETE CASCADE ON UPDATE CASCADE;
