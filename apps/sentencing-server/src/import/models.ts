import { StateCode } from "@prisma/client";
import z from "zod";
import { zu } from "zod_utilz";

import { fullNameObjectToString } from "~sentencing-server/import/utils";

const stateCode = z.nativeEnum(StateCode);

export const nameSchema = zu.stringToJSON().pipe(
  z.object({
    given_names: z.string(),
    middle_names: z.string(),
    name_suffix: z.string(),
    surname: z.string(),
  }),
);

const caseIdsSchema = zu.stringToJSON().pipe(z.array(z.coerce.string()));

export const caseImportSchema = z.array(
  z.object({
    external_id: z.string(),
    state_code: stateCode,
    staff_id: z.string(),
    client_id: z.string(),
    due_date: z.coerce.date(),
    completion_date: z.coerce.date(),
    sentence_date: z.coerce.date(),
    assigned_date: z.coerce.date(),
    county_name: z.string(),
    lsir_score: z.coerce.number().optional(),
    lsir_level: z.string().optional(),
    report_type: z.string(),
  }),
);

export const clientImportSchema = z.array(
  z
    .object({
      external_id: z.string(),
      pseudonymized_id: z.string(),
      caseIds: caseIdsSchema,
      state_code: stateCode,
      full_name: nameSchema,
      gender: z.string(),
      county: z.string().optional(),
      birth_date: z.coerce.date(),
    })
    .transform((data) => {
      // Spread the full_name object into the root object
      return {
        ...data,
        full_name: fullNameObjectToString(data.full_name),
      };
    }),
);

export const staffImportSchema = z.array(
  z
    .object({
      external_id: z.string(),
      pseudonymized_id: z.string(),
      caseIds: caseIdsSchema,
      state_code: stateCode,
      full_name: nameSchema,
      email: z.string(),
    })
    .transform((data) => {
      // Spread the full_name object into the root object
      return {
        ...data,
        full_name: fullNameObjectToString(data.full_name),
      };
    }),
);
