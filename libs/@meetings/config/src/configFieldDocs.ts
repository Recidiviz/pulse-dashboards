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
  LabelsSchema,
  MeetingTypeConfigEntrySchema,
  MeetingTypeSchema,
  OutputSpecSchema,
} from "~@meetings/config/types";

export type ConfigFieldDoc = {
  key: string;
  typeLabel: string;
  required: boolean;
  description?: string;
  defaultValue?: string;
  nestedSchemaName?: string;
};

export type ConfigSchemaSection = {
  name: string;
  description?: string;
  fields: ConfigFieldDoc[];
};

type NamedSchema = { name: string; schema: z.ZodObject<z.ZodRawShape> };

// The nested schemas we would like to also include fields for. If not listed here
// defaults to a basic object label.
const NAMED_SCHEMAS: NamedSchema[] = [
  { name: "MeetingType", schema: MeetingTypeSchema },
  { name: "MeetingTypeConfigEntry", schema: MeetingTypeConfigEntrySchema },
  { name: "OutputSpec", schema: OutputSpecSchema },
  { name: "Labels", schema: LabelsSchema },
];

function findSchemaName(schema: z.ZodTypeAny): string | undefined {
  return NAMED_SCHEMAS.find((entry) => entry.schema === schema)?.name;
}

// Strips the optional/nullable/default wrappers Zod adds so the underlying
// type (string, array, object, etc.) can be labeled for display.
function unwrap(schema: z.ZodTypeAny): z.ZodTypeAny {
  if (
    schema instanceof z.ZodOptional ||
    schema instanceof z.ZodNullable ||
    schema instanceof z.ZodDefault
  ) {
    return unwrap(schema._def.innerType);
  }
  return schema;
}

type TypeDescription = { label: string; nestedSchemaName?: string };

function describeType(schema: z.ZodTypeAny): TypeDescription {
  const inner = unwrap(schema);
  if (inner instanceof z.ZodArray) {
    const element = describeType(inner._def.type);
    return {
      label: `array of ${element.label}`,
      nestedSchemaName: element.nestedSchemaName,
    };
  }
  if (inner instanceof z.ZodObject) {
    const name = findSchemaName(inner);
    return name ? { label: name, nestedSchemaName: name } : { label: "object" };
  }
  if (inner instanceof z.ZodRecord) {
    return { label: "record" };
  }
  if (inner instanceof z.ZodString) {
    return { label: "string" };
  }
  if (inner instanceof z.ZodNumber) {
    return { label: "number" };
  }
  if (inner instanceof z.ZodBoolean) {
    return { label: "boolean" };
  }
  return { label: "value" };
}

export function getConfigFieldDocs(
  schema: z.ZodObject<z.ZodRawShape>,
): ConfigFieldDoc[] {
  return Object.entries(schema.shape).map(([key, value]) => {
    const zodValue = value as z.ZodTypeAny;
    const { label, nestedSchemaName } = describeType(zodValue);
    return {
      key,
      typeLabel: label,
      required: !(zodValue instanceof z.ZodOptional),
      description: zodValue.description,
      defaultValue:
        zodValue instanceof z.ZodDefault
          ? String(zodValue._def.defaultValue())
          : undefined,
      nestedSchemaName,
    };
  });
}

export function getConfigSchemaSections(
  rootSchema: z.ZodObject<z.ZodRawShape>,
  rootName = "Config",
): ConfigSchemaSection[] {
  const sections: ConfigSchemaSection[] = [];
  const visited = new Set<string>([rootName]);
  const queue: NamedSchema[] = [{ name: rootName, schema: rootSchema }];

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) {
      break;
    }
    const fields = getConfigFieldDocs(current.schema);
    sections.push({
      name: current.name,
      description: current.schema.description,
      fields,
    });

    for (const field of fields) {
      if (field.nestedSchemaName && !visited.has(field.nestedSchemaName)) {
        const nested = NAMED_SCHEMAS.find(
          (entry) => entry.name === field.nestedSchemaName,
        );
        if (nested) {
          visited.add(nested.name);
          queue.push(nested);
        }
      }
    }
  }

  return sections;
}
