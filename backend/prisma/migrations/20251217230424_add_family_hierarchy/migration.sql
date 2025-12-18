/*
  Warnings:

  - You are about to drop the column `active` on the `residents` table. All the data in the column will be lost.
  - You are about to drop the column `approved` on the `residents` table. All the data in the column will be lost.
  - You are about to drop the column `isMainTenant` on the `residents` table. All the data in the column will be lost.
  - You are about to drop the column `parentId` on the `residents` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "UnitRole" AS ENUM ('OWNER', 'MEMBER');

-- CreateEnum
CREATE TYPE "AccessStatus" AS ENUM ('ACTIVE', 'PENDING', 'REJECTED', 'BLOCKED');

-- DropForeignKey
ALTER TABLE "residents" DROP CONSTRAINT "residents_parentId_fkey";

-- AlterTable
ALTER TABLE "residents" DROP COLUMN "active",
DROP COLUMN "approved",
DROP COLUMN "isMainTenant",
DROP COLUMN "parentId",
ADD COLUMN     "ownerId" TEXT,
ADD COLUMN     "status" "AccessStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "unitRole" "UnitRole" NOT NULL DEFAULT 'OWNER';

-- AddForeignKey
ALTER TABLE "residents" ADD CONSTRAINT "residents_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "residents"("id") ON DELETE SET NULL ON UPDATE CASCADE;
