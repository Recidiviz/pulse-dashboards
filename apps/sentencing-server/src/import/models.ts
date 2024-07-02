import z from "zod";

import { fullNameObjectToString } from "~sentencing-server/import/utils";

const stateCode = z.enum([
  "AL",
  "AK",
  "AZ",
  "AR",
  "CA",
  "CO",
  "CT",
  "DE",
  "FL",
  "GA",
  "HI",
  "ID",
  "IL",
  "IN",
  "IA",
  "KS",
  "KY",
  "LA",
  "ME",
  "MD",
  "MA",
  "MI",
  "MN",
  "MS",
  "MO",
  "MT",
  "NE",
  "NV",
  "NH",
  "NJ",
  "NM",
  "NY",
  "NC",
  "ND",
  "OH",
  "OK",
  "OR",
  "PA",
  "RI",
  "SC",
  "SD",
  "TN",
  "TX",
  "UT",
  "VT",
  "VA",
  "WA",
  "WV",
  "WI",
  "WY",
]);
export const nameSchema = z.object({
  given_names: z.string(),
  middle_names: z.string(),
  name_suffix: z.string(),
  surname: z.string(),
});

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
    lsir_score: z.number(),
    lsir_level: z.string(),
    report_type: z.string(),
  }),
);

export const clientImportSchema = z.array(
  z
    .object({
      external_id: z.string(),
      pseudonymized_id: z.string(),
      case_ids: z.array(z.string()),
      state_code: stateCode,
      full_name: nameSchema,
      gender: z.string(),
      county: z.string(),
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
      case_ids: z.array(z.string()),
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
