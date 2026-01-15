// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

import { omit } from "lodash-es";
import OpenAI from "openai";
import { ChatCompletionMessageParam } from "openai/src/resources/chat/completions/completions";
import { ResponseFormatJSONSchema } from "openai/src/resources/shared";
import { ZodSchema } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

type StructuredOutputSchemaOptions = {
  strict: boolean;
  name: string;
};

export function zodToOpenAIStructuredOutputSchema(
  schema: ZodSchema,
  options: StructuredOutputSchemaOptions,
): ResponseFormatJSONSchema {
  const { strict = false, name = "schema" } = options;

  // Convert Zod schema to JSON Schema for structured outputs
  // Use "root" strategy to properly handle recursive schemas (e.g., MinuteItemSchema)
  const jsonSchemaRaw = zodToJsonSchema(schema, {
    $refStrategy: "root",
  });

  const openAISchema = {
    // Clean up the schema for OpenAI Structured Outputs
    ...omit(jsonSchemaRaw, ["$schema"]),
    // Ensure additionalProperties is false for strict mode
    additionalProperties: !strict,
  };

  return {
    type: "json_schema",
    json_schema: {
      name,
      strict,
      schema: openAISchema,
    },
  };
}

type ZodChatCompletionOptions<T extends ZodSchema> = {
  client: OpenAI;
  messages: Array<ChatCompletionMessageParam>;
  schema: T;
};

export async function completeChatWithZodSchema<T extends ZodSchema>({
  client,
  messages,
  schema,
}: ZodChatCompletionOptions<T>): Promise<T["_output"]> {
  const completion = await client.chat.completions.create({
    model: "gpt-5-mini",
    messages,
    response_format: zodToOpenAIStructuredOutputSchema(schema, {
      strict: false,
      name: "extraction",
    }),
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error("No response from OpenAI");
  }

  // Parse and validate with Zod
  return schema.parse(JSON.parse(content));
}
