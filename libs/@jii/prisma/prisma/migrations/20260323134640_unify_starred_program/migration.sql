-- CreateTable
CREATE TABLE "public"."StarredProgram" (
    "pseudonymizedId" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StarredProgram_pkey" PRIMARY KEY ("pseudonymizedId","programId","title")
);

-- MigrateData
INSERT INTO "public"."StarredProgram" ("pseudonymizedId", "programId", "title", "createdAt")
SELECT "pseudonymizedId", "programId", "title", "createdAt"
FROM "public"."UsCoStarredProgram";

-- DropTable
DROP TABLE "public"."UsCoStarredProgram";
