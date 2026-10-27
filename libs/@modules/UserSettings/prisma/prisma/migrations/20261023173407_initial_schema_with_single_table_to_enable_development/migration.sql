-- CreateTable
CREATE TABLE "public"."UserSettings" (
    "userEmail" TEXT NOT NULL,
    "preferredState" TEXT NOT NULL,

    CONSTRAINT "UserSettings_pkey" PRIMARY KEY ("userEmail")
);
