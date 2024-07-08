import type { Prisma } from "@prisma/client";

export type GetStaffInput = Pick<
  Prisma.StaffWhereUniqueInput,
  "pseudonymizedId"
>;

export type UpdateStaffInput = Pick<
  Prisma.StaffWhereUniqueInput,
  "pseudonymizedId"
> &
  Pick<Prisma.StaffUpdateInput, "hasLoggedIn">;
