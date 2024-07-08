import { z } from "zod";

import {
  GetStaffInput,
  UpdateStaffInput,
} from "~sentencing-server/trpc/routes/staff/types";

export const getStaffInputSchema = z.object({
  pseudonymizedId: z.string(),
}) satisfies z.ZodType<GetStaffInput>;

export const updateStaffSchema = z.object({
  pseudonymizedId: z.string(),
  hasLoggedIn: z.boolean(),
}) satisfies z.ZodType<UpdateStaffInput>;
