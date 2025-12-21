-- AlterTable
ALTER TABLE "Asset" ADD COLUMN     "moodboardId" TEXT;

-- CreateTable
CREATE TABLE "Moodboard" (
    "id" TEXT NOT NULL,
    "stepId" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'Concept',
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Moodboard_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Moodboard_stepId_idx" ON "Moodboard"("stepId");

-- CreateIndex
CREATE INDEX "Asset_moodboardId_idx" ON "Asset"("moodboardId");

-- AddForeignKey
ALTER TABLE "Moodboard" ADD CONSTRAINT "Moodboard_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "Step"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_moodboardId_fkey" FOREIGN KEY ("moodboardId") REFERENCES "Moodboard"("id") ON DELETE SET NULL ON UPDATE CASCADE;
