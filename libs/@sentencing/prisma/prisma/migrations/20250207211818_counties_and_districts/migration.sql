-- CreateTable
CREATE TABLE "County" (
    "id" TEXT NOT NULL,
    "stateCode" "StateCode" NOT NULL,
    "name" TEXT NOT NULL,
    "districtId" TEXT NOT NULL,

    CONSTRAINT "County_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "District" (
    "id" TEXT NOT NULL,
    "stateCode" "StateCode" NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "District_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "County_name_key" ON "County"("name");

-- CreateIndex
CREATE UNIQUE INDEX "District_name_key" ON "District"("name");

-- AddForeignKey
ALTER TABLE "County" ADD CONSTRAINT "County_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "District"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
