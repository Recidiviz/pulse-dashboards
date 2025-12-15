-- CreateTable
CREATE TABLE "public"."UserProperties" (
    "id" TEXT NOT NULL,
    "hasSeenOnboarding" TIMESTAMP(3),

    CONSTRAINT "UserProperties_pkey" PRIMARY KEY ("id")
);
