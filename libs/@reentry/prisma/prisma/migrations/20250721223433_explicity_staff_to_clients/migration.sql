/*
  Warnings:

  - You are about to drop the `_ClientToStaff` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_ClientToStaff" DROP CONSTRAINT "_ClientToStaff_A_fkey";

-- DropForeignKey
ALTER TABLE "_ClientToStaff" DROP CONSTRAINT "_ClientToStaff_B_fkey";

-- DropTable
DROP TABLE "_ClientToStaff";

-- CreateTable
CREATE TABLE "ClientsToStaff" (
    "staffId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,

    CONSTRAINT "ClientsToStaff_pkey" PRIMARY KEY ("staffId","clientId")
);

-- AddForeignKey
ALTER TABLE "ClientsToStaff" ADD CONSTRAINT "ClientsToStaff_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("staffId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientsToStaff" ADD CONSTRAINT "ClientsToStaff_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("personId") ON DELETE RESTRICT ON UPDATE CASCADE;
