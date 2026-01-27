-- CreateTable
CREATE TABLE "public"."UsNcRNA" (
    "id" TEXT NOT NULL,
    "pseudonymizedId" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "answers" JSONB NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "UsNcRNA_id_key" ON "public"."UsNcRNA"("id");
