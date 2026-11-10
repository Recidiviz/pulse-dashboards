-- AlterEnum: must be committed before DRAFT can be used in later statements
ALTER TYPE "public"."ApplicationStage" ADD VALUE 'DRAFT' BEFORE 'APPLICATION';
