-- CreateTable
CREATE TABLE "public"."User" (
    "email" TEXT NOT NULL,
    "hasSeenOnboarding" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "User_pkey" PRIMARY KEY ("email")
);
