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
  generateContentWithZodSchema,
  zodToGeminiResponseSchema,
} from "~@meetings/tasks/llm/clients/gemini";
import { VerificationPayloadSchema } from "~@meetings/tasks/llm/schemas";
import { mockGemini } from "~@meetings/tasks/test/setup";

describe("Gemini Client", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("zodToGeminiResponseSchema", () => {
    test("should convert simple Zod schema to JSON schema format", () => {
      const schema = z.object({
        name: z.string(),
        age: z.number(),
      });

      const result = zodToGeminiResponseSchema(schema);

      expect(result).toBeDefined();
      expect((result as unknown as Record<string, unknown>)["type"]).toBe(
        "object",
      );
      expect(
        (result as unknown as Record<string, unknown>)["properties"],
      ).toBeDefined();
      expect(
        (
          (result as unknown as Record<string, unknown>)[
            "properties"
          ] as Record<string, unknown>
        )?.["name"],
      ).toBeDefined();
      expect(
        (
          (result as unknown as Record<string, unknown>)[
            "properties"
          ] as Record<string, unknown>
        )?.["age"],
      ).toBeDefined();
    });

    test("should convert complex nested schema", () => {
      const schema = z.object({
        items: z.array(
          z.object({
            id: z.string(),
            metadata: z.object({
              count: z.number(),
            }),
          }),
        ),
      });

      const result = zodToGeminiResponseSchema(schema);

      expect((result as unknown as Record<string, unknown>)["type"]).toBe(
        "object",
      );
      expect(
        (
          (result as unknown as Record<string, unknown>)[
            "properties"
          ] as Record<string, unknown>
        )?.["items"],
      ).toBeDefined();
    });

    test("should convert verification payload schema", () => {
      const result = zodToGeminiResponseSchema(VerificationPayloadSchema);

      expect(result).toBeDefined();
      expect((result as unknown as Record<string, unknown>)["type"]).toBe(
        "object",
      );
      const properties = (result as unknown as Record<string, unknown>)[
        "properties"
      ] as Record<string, unknown> | undefined;
      expect(properties?.["verifications"]).toBeDefined();
    });

    test("should preserve required fields", () => {
      const schema = z.object({
        required_field: z.string(),
        optional_field: z.string().optional(),
      });

      const result = zodToGeminiResponseSchema(schema);

      expect(
        (result as unknown as Record<string, unknown>)["required"],
      ).toContain("required_field");
      expect(
        (result as unknown as Record<string, unknown>)["required"],
      ).not.toContain("optional_field");
    });
  });

  describe("generateContentWithZodSchema", () => {
    test("should successfully generate content with valid response", async () => {
      const schema = z.object({
        verifications: z.array(
          z.object({
            claimId: z.string(),
            evidenceQuotes: z.array(z.string()),
          }),
        ),
      });

      const mockResponse = {
        verifications: [
          {
            claimId: "ACT_0",
            evidenceQuotes: ["Quote from transcript"],
          },
        ],
      };

      const mockGenerateContent = vi.fn().mockResolvedValue({
        response: {
          text: () => JSON.stringify(mockResponse),
        },
      });

      vi.mocked(mockGemini.getGenerativeModel).mockReturnValue({
        generateContent: mockGenerateContent,
      } as never);

      const result = await generateContentWithZodSchema({
        client: mockGemini,
        systemInstruction: "You are a verification assistant",
        userMessage: "Verify these claims",
        schema,
      });

      expect(result).toEqual(mockResponse);
      expect(mockGemini.getGenerativeModel).toHaveBeenCalledWith(
        expect.objectContaining({
          systemInstruction: "You are a verification assistant",
          generationConfig: expect.objectContaining({
            responseMimeType: "application/json",
          }),
        }),
      );
    });

    test("should use custom model name when provided", async () => {
      const schema = z.object({ test: z.string() });

      const mockGenerateContent = vi.fn().mockResolvedValue({
        response: {
          text: () => JSON.stringify({ test: "value" }),
        },
      });

      vi.mocked(mockGemini.getGenerativeModel).mockReturnValue({
        generateContent: mockGenerateContent,
      } as never);

      await generateContentWithZodSchema({
        client: mockGemini,
        systemInstruction: "Test",
        userMessage: "Test message",
        schema,
        modelName: "gemini-1.5-pro",
      });

      expect(mockGemini.getGenerativeModel).toHaveBeenCalledWith(
        expect.objectContaining({
          model: "gemini-1.5-pro",
        }),
      );
    });

    test("should use default model when not specified", async () => {
      const schema = z.object({ test: z.string() });

      const mockGenerateContent = vi.fn().mockResolvedValue({
        response: {
          text: () => JSON.stringify({ test: "value" }),
        },
      });

      vi.mocked(mockGemini.getGenerativeModel).mockReturnValue({
        generateContent: mockGenerateContent,
      } as never);

      await generateContentWithZodSchema({
        client: mockGemini,
        systemInstruction: "Test",
        userMessage: "Test message",
        schema,
      });

      expect(mockGemini.getGenerativeModel).toHaveBeenCalledWith(
        expect.objectContaining({
          model: "gemini-2.5-flash",
        }),
      );
    });

    test("should pass user message to generateContent", async () => {
      const schema = z.object({ result: z.string() });

      const mockGenerateContent = vi.fn().mockResolvedValue({
        response: {
          text: () => JSON.stringify({ result: "success" }),
        },
      });

      vi.mocked(mockGemini.getGenerativeModel).mockReturnValue({
        generateContent: mockGenerateContent,
      } as never);

      await generateContentWithZodSchema({
        client: mockGemini,
        systemInstruction: "System prompt",
        userMessage: "User prompt with specific content",
        schema,
      });

      expect(mockGenerateContent).toHaveBeenCalledWith(
        "User prompt with specific content",
      );
    });

    test("should validate response against Zod schema", async () => {
      const schema = z.object({
        required_field: z.string(),
      });

      const mockGenerateContent = vi.fn().mockResolvedValue({
        response: {
          text: () => JSON.stringify({ wrong_field: "value" }),
        },
      });

      vi.mocked(mockGemini.getGenerativeModel).mockReturnValue({
        generateContent: mockGenerateContent,
      } as never);

      await expect(
        generateContentWithZodSchema({
          client: mockGemini,
          systemInstruction: "Test",
          userMessage: "Test",
          schema,
        }),
      ).rejects.toThrow();
    });

    test("should handle complex verification payload", async () => {
      const mockVerification = {
        verifications: [
          {
            claimId: "ACT_0",
            evidenceQuotes: ["First quote", "Second quote"],
            confidence: "HIGH",
            ambiguity: "LOW",
          },
          {
            claimId: "UPD_0",
            evidenceQuotes: ["Evidence for update"],
            confidence: "MEDIUM",
            ambiguity: "MEDIUM",
          },
        ],
      };

      const mockGenerateContent = vi.fn().mockResolvedValue({
        response: {
          text: () => JSON.stringify(mockVerification),
        },
      });

      vi.mocked(mockGemini.getGenerativeModel).mockReturnValue({
        generateContent: mockGenerateContent,
      } as never);

      const result = await generateContentWithZodSchema({
        client: mockGemini,
        systemInstruction: "Verify claims",
        userMessage: "Claims and transcript",
        schema: VerificationPayloadSchema,
      });

      expect(result).toEqual(mockVerification);
      expect(result.verifications).toHaveLength(2);
      expect(result.verifications[0]?.evidenceQuotes).toHaveLength(2);
    });

    test("should throw on invalid JSON in response", async () => {
      const schema = z.object({ test: z.string() });

      const mockGenerateContent = vi.fn().mockResolvedValue({
        response: {
          text: () => "invalid json {",
        },
      });

      vi.mocked(mockGemini.getGenerativeModel).mockReturnValue({
        generateContent: mockGenerateContent,
      } as never);

      await expect(
        generateContentWithZodSchema({
          client: mockGemini,
          systemInstruction: "Test",
          userMessage: "Test",
          schema,
        }),
      ).rejects.toThrow();
    });

    test("should set response mime type to application/json", async () => {
      const schema = z.object({ data: z.string() });

      const mockGenerateContent = vi.fn().mockResolvedValue({
        response: {
          text: () => JSON.stringify({ data: "test" }),
        },
      });

      vi.mocked(mockGemini.getGenerativeModel).mockReturnValue({
        generateContent: mockGenerateContent,
      } as never);

      await generateContentWithZodSchema({
        client: mockGemini,
        systemInstruction: "Test",
        userMessage: "Test",
        schema,
      });

      expect(mockGemini.getGenerativeModel).toHaveBeenCalledWith(
        expect.objectContaining({
          generationConfig: expect.objectContaining({
            responseMimeType: "application/json",
          }),
        }),
      );
    });

    test("should include response schema in generation config", async () => {
      const schema = z.object({
        items: z.array(z.string()),
      });

      const mockGenerateContent = vi.fn().mockResolvedValue({
        response: {
          text: () => JSON.stringify({ items: ["a", "b"] }),
        },
      });

      vi.mocked(mockGemini.getGenerativeModel).mockReturnValue({
        generateContent: mockGenerateContent,
      } as never);

      await generateContentWithZodSchema({
        client: mockGemini,
        systemInstruction: "Test",
        userMessage: "Test",
        schema,
      });

      expect(mockGemini.getGenerativeModel).toHaveBeenCalledWith(
        expect.objectContaining({
          generationConfig: expect.objectContaining({
            responseSchema: expect.any(Object),
          }),
        }),
      );
    });
  });
});
