// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2026 Recidiviz, Inc.
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.
// =============================================================================

import { z } from "zod";

import {
  COUNTY_OPTIONS,
  CURRENT_STATUS_OPTIONS,
  DISTRICT_OPTIONS,
  GENDER_OPTIONS,
  IDS_ON_FILE_OPTIONS,
} from "~@idaho-th/shared";
import type { GeminiSchema } from "~@idaho-th/trpc/routes/vertex/vertex.types";

const makeNullableString = (): GeminiSchema => ({
  type: "string",
  nullable: true,
});
const makeBoolean = (): GeminiSchema => ({
  type: "boolean",
  nullable: true,
});
const makeInteger = (): GeminiSchema => ({ type: "integer" });
const makeStringArray = (): GeminiSchema => ({
  type: "array",
  items: makeNullableString(),
});

const makeEnumArray = (values: readonly string[]): GeminiSchema => ({
  type: "array",
  items: { type: "string", enum: [...values] },
});

const makeEnum = (values: readonly string[]): GeminiSchema => ({
  type: "string",
  enum: [...values],
});

type FieldDef = { schema: GeminiSchema; required: boolean };

class ObjectSchemaBuilder {
  private fields = new Map<string, FieldDef>();

  add(key: string, schema: GeminiSchema, required = true): this {
    this.fields.set(key, { schema, required });
    return this;
  }

  optional(key: string, schema: GeminiSchema): this {
    return this.add(key, schema, false);
  }

  merge(other: GeminiSchema): this {
    for (const [key, value] of Object.entries(other.properties ?? {})) {
      const isRequired = (other.required ?? []).includes(key);
      this.add(key, value, isRequired);
    }
    return this;
  }

  pick(other: GeminiSchema, keys: readonly string[]): this {
    for (const key of keys) {
      const value = other.properties?.[key];
      if (value === undefined) continue;
      const isRequired = (other.required ?? []).includes(key);
      this.add(key, value, isRequired);
    }
    return this;
  }

  build(): GeminiSchema {
    const properties: Record<string, GeminiSchema> = {};
    const required: string[] = [];
    for (const [key, { schema, required: isRequired }] of this.fields) {
      properties[key] = schema;
      if (isRequired) required.push(key);
    }
    return { type: "object", properties, required };
  }
}

const defineSchema = () => new ObjectSchemaBuilder();

const caseManagerSchema = defineSchema()
  .add("cmPoName", makeNullableString())
  .add("cmPoEmail", makeNullableString())
  .add("cmPoPhone", makeNullableString())
  .add("currentFacilityLocation", makeNullableString())
  .build();

const caseManagerPage1Schema = defineSchema()
  .pick(caseManagerSchema, [
    "cmPoEmail",
    "cmPoPhone",
    "currentFacilityLocation",
  ])
  .build();

const caseManagerPage2Schema = defineSchema()
  .pick(caseManagerSchema, ["cmPoName"])
  .build();

const clientIdentitySchema = defineSchema()
  .add("clientFullName", makeNullableString())
  .add("idocNumber", makeNullableString())
  .add("dob", makeNullableString())
  .add("age", makeInteger())
  .add("ssnLast4", makeNullableString())
  .add("gender", makeEnum(GENDER_OPTIONS))
  .add("personalPhoneNumber", makeNullableString())
  .build();

const clientIdentityPage3Schema = defineSchema()
  .add("idocNumber", makeNullableString())
  .build();

const emergencyContactSchema = defineSchema()
  .add("emergencyContactName", makeNullableString())
  .add("emergencyContactRelationship", makeNullableString())
  .add("emergencyContactPhone", makeNullableString())
  .build();

const legalStatusSchema = defineSchema()
  .add("legalCurrentStatus", makeEnum(CURRENT_STATUS_OPTIONS))
  .add("legalMostRecentConviction", makeNullableString())
  .add("legalCountyOfCrime", makeEnum(COUNTY_OPTIONS))
  .add("legalSexOffenderRegistry", makeBoolean())
  .add("legalBackupForIcOrIce", makeBoolean())
  .add("childVisitationRequired", makeBoolean())
  .add("priorInvoluntaryDischarge", makeBoolean())
  .add("violenceHistoryDors", makeBoolean())
  .add("housingProbationParoleAtRelease", makeBoolean())
  .add("tpdHousingNeededDate", makeNullableString())
  .add("paroleHearingCompleted", makeBoolean())
  .add("vehicleOnSite", makeBoolean())
  .build();

const identificationSchema = defineSchema()
  .add("idsOnFile", makeEnumArray(IDS_ON_FILE_OPTIONS))
  .build();

const militarySchema = defineSchema()
  .add("militaryService", makeBoolean())
  .add("vaEnrolled", makeBoolean())
  .build();

const employmentPage1Schema = defineSchema()
  .add("employmentOnRelease", makeBoolean())
  .build();

const employmentPage2Schema = defineSchema()
  .add("employer", makeNullableString())
  .add("employerContact", makeNullableString())
  .build();

const employmentSchema = defineSchema()
  .merge(employmentPage1Schema)
  .merge(employmentPage2Schema)
  .build();

const medicalSupportCoreSchema = defineSchema()
  .add("contagiousDisease", makeBoolean())
  .add("prescriptionMedication", makeBoolean())
  .add("prescriptionMedicationCompany", makeNullableString())
  .add("assistanceCbrs", makeBoolean())
  .add("assistanceCbrsCompany", makeNullableString())
  .add("moudMatProgram", makeBoolean())
  .add("moudMatProgramCompany", makeNullableString())
  .add("contagiousDiseaseCompany", makeNullableString())
  .add("ongoingMedicalMhTreatment", makeBoolean())
  .add("ongoingMedicalMhTreatmentCompany", makeNullableString())
  .add("medicalAccommodations", makeStringArray())
  .add("otherMedicalAccommodation", makeNullableString())
  .add("additionalMedicalInfo", makeNullableString())
  .build();

const medicalSupportPage2Schema = defineSchema()
  .add("medicalMhSupportNeeded", makeBoolean())
  .pick(medicalSupportCoreSchema, ["contagiousDisease"])
  .build();

const medicalSupportPage4Schema = medicalSupportCoreSchema;

const medicalSupportSchema = defineSchema()
  .add("medicalMhSupportNeeded", makeBoolean())
  .merge(medicalSupportCoreSchema)
  .build();

const benefitsSchema = defineSchema()
  .add("ssiSsdiSsrbMedicareMedicaid", makeBoolean())
  .add("benefitsReinstatementDate", makeNullableString())
  .add("benefitsDuration", makeNullableString())
  .build();

const substanceUseSchema = defineSchema()
  .add("prescribedMedications", makeNullableString())
  .add("addictions", makeBoolean())
  .add("substances", makeNullableString())
  .add("lastUseDate", makeNullableString())
  .add("underInfluenceAtCrime", makeBoolean())
  .build();

const signatureSchema = defineSchema()
  .add("signatureProvided", makeBoolean())
  .add("signatureDate", makeNullableString())
  .build();

const reasonableAccommodationsSchema = defineSchema()
  .add("accommodations", makeStringArray())
  .add("otherAccommodations", makeNullableString())
  .add("accommodationsInfo", makeNullableString())
  .build();

const childVisitationSchema = defineSchema()
  .add("childFamilyServicesDocumentation", makeStringArray())
  .add("parentGuardianNames", makeNullableString())
  .add("child1Info", makeNullableString())
  .add("child2Info", makeNullableString())
  .add("child3Info", makeNullableString())
  .add("childVisitationInfo", makeNullableString())
  .build();

const violenceAndDischargeSchema = defineSchema()
  .add("violenceDischargeDescription", makeNullableString())
  .build();

const supportPlanSchema = defineSchema()
  .add("ssi90DayCarePlan", makeNullableString())
  .add("faithBasedProviderInfo", makeNullableString())
  .build();

export const page1Schema = defineSchema()
  .add("caseManager", caseManagerPage1Schema)
  .add("clientIdentity", clientIdentitySchema)
  .add("emergencyContact", emergencyContactSchema)
  .add("legalStatus", legalStatusSchema)
  .add("identification", identificationSchema)
  .add("military", militarySchema)
  .add("employment", employmentPage1Schema)
  .build();

function buildPage2Schema(
  housingPreferencesSchema: GeminiSchema,
): GeminiSchema {
  return defineSchema()
    .add("caseManager", caseManagerPage2Schema)
    .add("employment", employmentPage2Schema)
    .add("medicalSupport", medicalSupportPage2Schema)
    .add("benefits", benefitsSchema)
    .add("substanceUse", substanceUseSchema)
    .add("housingPreferences", housingPreferencesSchema)
    .add("signature", signatureSchema)
    .build();
}

export const page3Schema = defineSchema()
  .add("clientIdentity", clientIdentityPage3Schema)
  .add("reasonableAccommodations", reasonableAccommodationsSchema)
  .add("childVisitation", childVisitationSchema)
  .add("violenceAndDischarge", violenceAndDischargeSchema)
  .build();

export const page4Schema = defineSchema()
  .add("medicalSupport", medicalSupportPage4Schema)
  .add("supportPlan", supportPlanSchema)
  .build();

function buildHousingPreferencesSchema(
  providerNames: readonly string[],
): GeminiSchema {
  return defineSchema()
    .add("faithBasedPreferred", makeBoolean())
    .add("previousTransitionalHome", makeBoolean())
    .add("previousHomeName", makeNullableString())
    .add("previousHomeCity", makeNullableString())
    .add("preferredDistrict", makeEnumArray(DISTRICT_OPTIONS))
    .add("preferredProviders", makeEnumArray(providerNames))
    .build();
}

export type VertexExtractionSchemas = {
  pageSchemas: Record<number, GeminiSchema>;
  responseSchema: GeminiSchema;
};

export function buildVertexExtractionSchemas(
  providerNames: readonly string[],
): VertexExtractionSchemas {
  const housingPreferencesSchema = buildHousingPreferencesSchema(providerNames);
  const page2Schema = buildPage2Schema(housingPreferencesSchema);

  const pageSchemas: Record<number, GeminiSchema> = {
    1: page1Schema,
    2: page2Schema,
    3: page3Schema,
    4: page4Schema,
  };

  const responseSchema = defineSchema()
    .add("caseManager", caseManagerSchema)
    .add("clientIdentity", clientIdentitySchema)
    .add("emergencyContact", emergencyContactSchema)
    .add("legalStatus", legalStatusSchema)
    .add("identification", identificationSchema)
    .add("military", militarySchema)
    .add("employment", employmentSchema)
    .add("medicalSupport", medicalSupportSchema)
    .add("benefits", benefitsSchema)
    .add("substanceUse", substanceUseSchema)
    .add("housingPreferences", housingPreferencesSchema)
    .add("signature", signatureSchema)
    .add("reasonableAccommodations", reasonableAccommodationsSchema)
    .add("childVisitation", childVisitationSchema)
    .add("violenceAndDischarge", violenceAndDischargeSchema)
    .add("supportPlan", supportPlanSchema)
    .build();

  return { pageSchemas, responseSchema };
}

export function geminiSchemaToZod(schema: GeminiSchema): z.ZodTypeAny {
  function convertString(s: GeminiSchema): z.ZodTypeAny {
    return s.enum?.length
      ? z.enum(s.enum as [string, ...string[]])
      : z.string();
  }

  function convertArray(s: GeminiSchema): z.ZodTypeAny {
    if (!s.items) throw new Error("Array schema must define items");
    return z.array(geminiSchemaToZod(s.items));
  }

  function convertInteger(s: GeminiSchema): z.ZodTypeAny {
    let fieldSchema: z.ZodNumber = z.number().int();
    if (s.minimum !== undefined) {
      fieldSchema = fieldSchema.min(s.minimum);
    }
    if (s.maximum !== undefined) {
      fieldSchema = fieldSchema.max(s.maximum);
    }
    return fieldSchema;
  }

  function convertObject(s: GeminiSchema): z.ZodTypeAny {
    const properties = s.properties ?? {};
    const requiredSet = new Set(s.required ?? []);

    const shape = Object.fromEntries(
      Object.entries(properties).map(([key, value]) => {
        const fieldSchema = geminiSchemaToZod(value);
        return [
          key,
          requiredSet.has(key) ? fieldSchema : fieldSchema.optional(),
        ];
      }),
    );

    return z.object(shape);
  }

  const TYPE_CONVERTERS: Record<string, (s: GeminiSchema) => z.ZodTypeAny> = {
    string: convertString,
    integer: convertInteger,
    number: () => z.number(),
    boolean: () => z.boolean(),
    array: convertArray,
    object: convertObject,
  };

  const converter = TYPE_CONVERTERS[schema.type as string];

  if (!converter) {
    throw new Error(
      `Unsupported schema type: "${String(schema.type)}". ` +
        `Add a converter to TYPE_CONVERTERS to support it.`,
    );
  }

  const base = converter(schema);
  return schema.nullable ? base.nullable() : base;
}
