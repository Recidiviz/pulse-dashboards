-- CreateEnum
CREATE TYPE "public"."UserFlagId" AS ENUM ('useNewResidentData');

-- CreateTable
CREATE TABLE "public"."UserFlagInstance" (
    "userId" TEXT NOT NULL,
    "flagId" "public"."UserFlagId" NOT NULL,
    "effectiveAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserFlagInstance_pkey" PRIMARY KEY ("userId","flagId")
);
