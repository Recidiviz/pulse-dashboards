import { Prisma } from "@prisma/client";

export const PRISMA_CASE_GET_ARGS = {
  omit: {
    staffId: true,
    clientId: true,
    offenseId: true,
  },
  include: {
    recommendedOpportunities: {
      select: {
        opportunityName: true,
        providerName: true,
      },
    },
    offense: {
      select: {
        name: true,
      },
    },
    Client: {
      select: {
        fullName: true,
        gender: true,
        county: true,
        birthDate: true,
      },
    },
  },
} satisfies Prisma.CaseDefaultArgs;
