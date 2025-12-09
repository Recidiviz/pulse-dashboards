-- CreateTable
CREATE TABLE "public"."UserProperties" (
    "id" TEXT NOT NULL,
    "hasSeenOnboarding" BOOLEAN,

    CONSTRAINT "UserProperties_pkey" PRIMARY KEY ("id")
);
