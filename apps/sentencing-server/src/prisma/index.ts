import { PrismaClient } from "@prisma/client";

// Add the computed "fullName" field to the client and staff models
export const client = new PrismaClient().$extends({
  result: {
    client: {
      fullName: {
        needs: { givenNames: true, surname: true },
        compute(client: { givenNames: string; surname: string }) {
          return `${client.givenNames} ${client.surname}`;
        },
      },
    },
    staff: {
      fullName: {
        needs: { givenNames: true, surname: true },
        compute(staff: { givenNames: string; surname: string }) {
          return `${staff.givenNames} ${staff.surname}`;
        },
      },
    },
  },
});
