/*
  Warnings:

  - You are about to drop the `Choice` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `IndicatorCoefficient` table. If the table is not empty, all the data it contains will be lost.
  - Changed the type of `answer` on the `Question` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "Choice" DROP CONSTRAINT "Choice_questionId_fkey";

-- DropForeignKey
ALTER TABLE "IndicatorCoefficient" DROP CONSTRAINT "IndicatorCoefficient_choiceId_fkey";

-- AlterTable
ALTER TABLE "Question" DROP COLUMN "answer",
ADD COLUMN     "answer" BOOLEAN NOT NULL;

-- DropTable
DROP TABLE "Choice";

-- DropTable
DROP TABLE "IndicatorCoefficient";

-- DropEnum
DROP TYPE "Indicator";

-- CreateTable
CREATE TABLE "Data" (
    "id" SERIAL NOT NULL,
    "questionId" INTEGER NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "answer" TEXT NOT NULL,
    "explanation" TEXT NOT NULL,

    CONSTRAINT "Data_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Source" (
    "id" SERIAL NOT NULL,
    "questionId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "link" TEXT NOT NULL,

    CONSTRAINT "Source_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Data" ADD CONSTRAINT "Data_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Source" ADD CONSTRAINT "Source_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
