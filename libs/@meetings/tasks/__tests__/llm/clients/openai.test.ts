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

import { beforeEach, describe, expect, test, vi } from "vitest";
import { z } from "zod";

import {
  completeChatWithZodSchema,
  zodToOpenAIStructuredOutputSchema,
} from "~@meetings/tasks/llm/clients/openai";
import { ExtractionOutputSchema } from "~@meetings/tasks/llm/schemas";
import { mockOpenAI } from "~@meetings/tasks/test/setup";

describe("OpenAI Client", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("zodToOpenAIStructuredOutputSchema", () => {
    test("should convert simple Zod schema to OpenAI format", () => {
      const schema = z.object({
        name: z.string(),
        age: z.number(),
      });

      const result = zodToOpenAIStructuredOutputSchema(schema, {
        strict: false,
        name: "test_schema",
      });

      expect(result.type).toBe("json_schema");
      expect(result.json_schema?.name).toBe("test_schema");
      expect(result.json_schema?.strict).toBe(false);
      expect(result.json_schema?.schema).toBeDefined();
      expect(result.json_schema?.schema?.["additionalProperties"]).toBe(true);
    });

    test("should set additionalProperties to false for strict mode", () => {
      const schema = z.object({
        name: z.string(),
      });

      const result = zodToOpenAIStructuredOutputSchema(schema, {
        strict: true,
        name: "strict_schema",
      });

      expect(result.json_schema?.strict).toBe(true);
      expect(result.json_schema?.schema?.["additionalProperties"]).toBe(false);
    });

    test("should convert complex nested schema", () => {
      const result = zodToOpenAIStructuredOutputSchema(ExtractionOutputSchema, {
        strict: false,
        name: "extraction",
      });

      expect(result.json_schema?.name).toBe("extraction");
      expect(result.json_schema?.schema).toBeDefined();
      expect(result.json_schema?.schema?.["properties"]).toBeDefined();
    });

    test("should remove $schema and definitions from output", () => {
      const schema = z.object({
        id: z.string(),
      });

      const result = zodToOpenAIStructuredOutputSchema(schema, {
        strict: false,
        name: "test",
      });

      expect(result.json_schema?.schema).not.toHaveProperty("$schema");
      expect(result.json_schema?.schema).not.toHaveProperty("definitions");
    });
  });

  describe("completeChatWithZodSchema", () => {
    test("should successfully complete chat with valid response", async () => {
      const schema = z.object({
        actionItems: z.array(z.object({ task: z.string() })),
      });

      const mockResponse = {
        actionItems: [{ task: "Complete application" }],
      };

      vi.mocked(mockOpenAI.chat.completions.create).mockResolvedValueOnce({
        id: "test-completion",
        object: "chat.completion",
        created: Date.now(),
        model: "gpt-5",
        choices: [
          {
            index: 0,
            message: {
              role: "assistant",
              content: JSON.stringify(mockResponse),
            },
            finish_reason: "stop",
          },
        ],
      } as never);

      const messages = [
        { role: "system" as const, content: "You are a helpful assistant" },
        { role: "user" as const, content: "Extract action items" },
      ];

      const result = await completeChatWithZodSchema({
        client: mockOpenAI,
        messages,
        schema,
      });

      expect(result).toEqual(mockResponse);
      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          messages,
        }),
      );
    });

    test("should use structured output format", async () => {
      const schema = ExtractionOutputSchema;

      vi.mocked(mockOpenAI.chat.completions.create).mockResolvedValueOnce({
        id: "test-completion",
        object: "chat.completion",
        created: Date.now(),
        choices: [
          {
            index: 0,
            message: {
              role: "assistant",
              content: JSON.stringify({
                actionItems: [],
                criticalUpdates: [],
                entities: [],
              }),
            },
            finish_reason: "stop",
          },
        ],
      } as never);

      await completeChatWithZodSchema({
        client: mockOpenAI,
        messages: [{ role: "user", content: "Test" }],
        schema,
      });

      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          response_format: expect.objectContaining({
            type: "json_schema",
            json_schema: expect.objectContaining({
              name: "extraction",
              strict: false,
            }),
          }),
        }),
      );
    });

    test("should throw error when no response content", async () => {
      vi.mocked(mockOpenAI.chat.completions.create).mockResolvedValueOnce({
        id: "test-completion",
        object: "chat.completion",
        created: Date.now(),
        choices: [
          {
            index: 0,
            message: {
              role: "assistant",
              content: null,
            },
            finish_reason: "stop",
          },
        ],
      } as never);

      const schema = z.object({ test: z.string() });

      await expect(
        completeChatWithZodSchema({
          client: mockOpenAI,
          messages: [{ role: "user", content: "Test" }],
          schema,
        }),
      ).rejects.toThrow("No response from OpenAI");
    });

    test("should validate response against Zod schema", async () => {
      const schema = z.object({
        requiredField: z.string(),
      });

      // Mock response missing required field
      vi.mocked(mockOpenAI.chat.completions.create).mockResolvedValueOnce({
        id: "test-completion",
        object: "chat.completion",
        created: Date.now(),
        choices: [
          {
            index: 0,
            message: {
              role: "assistant",
              content: JSON.stringify({ wrongField: "value" }),
            },
            finish_reason: "stop",
          },
        ],
      } as never);

      await expect(
        completeChatWithZodSchema({
          client: mockOpenAI,
          messages: [{ role: "user", content: "Test" }],
          schema,
        }),
      ).rejects.toThrow();
    });

    test("should handle complex extraction schema", async () => {
      const mockExtraction = {
        actionItems: [
          {
            assignee: "Client",
            task: "Submit proof of residence",
            deadline: "2025-01-20",
          },
        ],
        criticalUpdates: [
          {
            category: "Housing",
            updateType: "Change",
            details: "Moved to new apartment",
          },
        ],
        entities: [
          {
            value: "SAGE Program",
            entityKind: "Program",
          },
        ],
      };

      vi.mocked(mockOpenAI.chat.completions.create).mockResolvedValueOnce({
        id: "test-completion",
        object: "chat.completion",
        created: Date.now(),
        choices: [
          {
            index: 0,
            message: {
              role: "assistant",
              content: JSON.stringify(mockExtraction),
            },
            finish_reason: "stop",
          },
        ],
      } as never);

      const result = await completeChatWithZodSchema({
        client: mockOpenAI,
        messages: [
          { role: "system", content: "Extract from transcript" },
          { role: "user", content: "Transcript text here" },
        ],
        schema: ExtractionOutputSchema,
      });

      expect(result).toEqual(mockExtraction);
      expect(result.actionItems).toHaveLength(1);
      expect(result.actionItems[0]?.assignee).toBe("Client");
    });

    test("should throw on invalid JSON in response", async () => {
      vi.mocked(mockOpenAI.chat.completions.create).mockResolvedValueOnce({
        id: "test-completion",
        object: "chat.completion",
        created: Date.now(),
        choices: [
          {
            index: 0,
            message: {
              role: "assistant",
              content: "invalid json {",
            },
            finish_reason: "stop",
          },
        ],
      } as never);

      const schema = z.object({ test: z.string() });

      await expect(
        completeChatWithZodSchema({
          client: mockOpenAI,
          messages: [{ role: "user", content: "Test" }],
          schema,
        }),
      ).rejects.toThrow();
    });
  });
});
