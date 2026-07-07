-- NexLab LIMS Migration: Add LOINC code support to tests
-- Migration: 20260706_add_loinc_code

ALTER TABLE "tests" ADD COLUMN "loincCode" TEXT;
