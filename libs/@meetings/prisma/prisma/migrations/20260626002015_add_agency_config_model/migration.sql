-- CreateTable
CREATE TABLE "public"."AgencyConfig" (
    "id" TEXT NOT NULL,
    "config" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "parentId" TEXT,

    CONSTRAINT "AgencyConfig_pkey" PRIMARY KEY ("id","version")
);
