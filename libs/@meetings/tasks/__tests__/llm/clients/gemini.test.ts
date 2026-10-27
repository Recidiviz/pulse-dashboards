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

import { GoogleGenAI } from "@google/genai";
import { File } from "@google-cloud/storage";
import type { MockInstance } from "vitest";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { z } from "zod";

import {
  audioFilePart,
  createVertexGeminiClient,
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

  describe("createVertexGeminiClient", () => {
    afterEach(() => {
      vi.unstubAllEnvs();
    });

    test("should throw when GOOGLE_CLOUD_PROJECT is not set", () => {
      vi.stubEnv("GOOGLE_CLOUD_PROJECT", "");

      expect(() => createVertexGeminiClient()).toThrow(
        "Missing GOOGLE_CLOUD_PROJECT environment variable",
      );
      expect(GoogleGenAI).not.toHaveBeenCalled();
    });

    test("should default the location to us", () => {
      vi.stubEnv("GOOGLE_CLOUD_PROJECT", "test-project");
      delete process.env["GOOGLE_CLOUD_LOCATION"];

      createVertexGeminiClient();

      expect(GoogleGenAI).toHaveBeenCalledWith({
        vertexai: true,
        project: "test-project",
        location: "us",
      });
    });

    test("should use GOOGLE_CLOUD_LOCATION when set", () => {
      vi.stubEnv("GOOGLE_CLOUD_PROJECT", "test-project");
      vi.stubEnv("GOOGLE_CLOUD_LOCATION", "us-east4");

      createVertexGeminiClient();

      expect(GoogleGenAI).toHaveBeenCalledWith({
        vertexai: true,
        project: "test-project",
        location: "us-east4",
      });
    });
  });

  describe("generateContentWithZodSchema", () => {
    const generateContent = vi.mocked(mockGemini.models.generateContent);

    function mockResponseText(text: string | undefined) {
      generateContent.mockResolvedValue({ text } as never);
    }

    function lastRequest() {
      const request = generateContent.mock.calls.at(-1)?.[0];
      if (!request) {
        throw new Error("generateContent was not called");
      }
      return request;
    }

    test("should return the parsed response", async () => {
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
      mockResponseText(JSON.stringify(mockResponse));

      const result = await generateContentWithZodSchema({
        client: mockGemini,
        systemInstruction: "You are a verification assistant",
        parts: "Verify these claims",
        schema,
      });

      expect(result).toEqual(mockResponse);
    });

    test("should use the default model when not specified", async () => {
      mockResponseText(JSON.stringify({ test: "value" }));

      await generateContentWithZodSchema({
        client: mockGemini,
        systemInstruction: "Test",
        parts: "Test message",
        schema: z.object({ test: z.string() }),
      });

      expect(lastRequest().model).toBe("gemini-3.8-flash");
    });

    test("should use a custom model name when provided", async () => {
      mockResponseText(JSON.stringify({ test: "value" }));

      await generateContentWithZodSchema({
        client: mockGemini,
        systemInstruction: "Test",
        parts: "Test message",
        schema: z.object({ test: z.string() }),
        modelName: "gemini-1.5-pro",
      });

      expect(lastRequest().model).toBe("gemini-1.5-pro");
    });

    test("should send the system instruction, JSON mime type, and zero temperature", async () => {
      mockResponseText(JSON.stringify({ data: "test" }));

      await generateContentWithZodSchema({
        client: mockGemini,
        systemInstruction: "You are a verification assistant",
        parts: "Test",
        schema: z.object({ data: z.string() }),
      });

      expect(lastRequest().config).toEqual(
        expect.objectContaining({
          systemInstruction: "You are a verification assistant",
          responseMimeType: "application/json",
          temperature: 0,
        }),
      );
    });

    test("should send the converted schema as responseJsonSchema", async () => {
      const schema = z.object({ items: z.array(z.string()) });
      mockResponseText(JSON.stringify({ items: ["a", "b"] }));

      await generateContentWithZodSchema({
        client: mockGemini,
        systemInstruction: "Test",
        parts: "Test",
        schema,
      });

      expect(lastRequest().config?.responseJsonSchema).toEqual(
        zodToGeminiResponseSchema(schema),
      );
    });

    test("should pass the timeout as httpOptions.timeout", async () => {
      mockResponseText(JSON.stringify({ test: "value" }));

      await generateContentWithZodSchema({
        client: mockGemini,
        systemInstruction: "Test",
        parts: "Test",
        schema: z.object({ test: z.string() }),
        timeout: 1800000,
      });

      expect(lastRequest().config?.httpOptions).toEqual({ timeout: 1800000 });
    });

    test("should omit httpOptions when no timeout is specified", async () => {
      mockResponseText(JSON.stringify({ test: "value" }));

      await generateContentWithZodSchema({
        client: mockGemini,
        systemInstruction: "Test",
        parts: "Test",
        schema: z.object({ test: z.string() }),
      });

      expect(lastRequest().config).not.toHaveProperty("httpOptions");
    });

    test("should send a string message as the contents", async () => {
      mockResponseText(JSON.stringify({ result: "success" }));

      await generateContentWithZodSchema({
        client: mockGemini,
        systemInstruction: "System prompt",
        parts: "User prompt with specific content",
        schema: z.object({ result: z.string() }),
      });

      expect(lastRequest().contents).toBe("User prompt with specific content");
    });

    test("should wrap content parts in a single user turn", async () => {
      mockResponseText(JSON.stringify({ result: "success" }));
      const parts = [
        {
          fileData: {
            fileUri: "gs://test-audio-bucket/meetings/final.m4a",
            mimeType: "audio/mp4",
          },
        },
        { text: "Compare the transcripts" },
      ];

      await generateContentWithZodSchema({
        client: mockGemini,
        systemInstruction: "System prompt",
        parts,
        schema: z.object({ result: z.string() }),
      });

      expect(lastRequest().contents).toEqual([{ role: "user", parts }]);
    });

    test("should validate the response against the Zod schema", async () => {
      mockResponseText(JSON.stringify({ wrong_field: "value" }));

      await expect(
        generateContentWithZodSchema({
          client: mockGemini,
          systemInstruction: "Test",
          parts: "Test",
          schema: z.object({ required_field: z.string() }),
        }),
      ).rejects.toThrow();
    });

    test("should handle a complex verification payload", async () => {
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
      mockResponseText(JSON.stringify(mockVerification));

      const result = await generateContentWithZodSchema({
        client: mockGemini,
        systemInstruction: "Verify claims",
        parts: "Claims and transcript",
        schema: VerificationPayloadSchema,
      });

      expect(result).toEqual(mockVerification);
      expect(result.verifications).toHaveLength(2);
      expect(result.verifications[0]?.evidenceQuotes).toHaveLength(2);
    });

    test("should throw on invalid JSON in the response", async () => {
      mockResponseText("invalid json {");

      await expect(
        generateContentWithZodSchema({
          client: mockGemini,
          systemInstruction: "Test",
          parts: "Test",
          schema: z.object({ test: z.string() }),
        }),
      ).rejects.toThrow();
    });

    test("should throw when the response has no text", async () => {
      mockResponseText(undefined);

      await expect(
        generateContentWithZodSchema({
          client: mockGemini,
          systemInstruction: "Test",
          parts: "Test",
          schema: z.object({ test: z.string() }),
        }),
      ).rejects.toThrow("Gemini returned a response with no text");
    });
  });

  describe("audioFilePart", () => {
    let getMetadataSpy: MockInstance;

    beforeEach(() => {
      vi.stubEnv("AUDIO_RECORDINGS_BUCKET_NAME", "test-audio-bucket");
      getMetadataSpy = vi.spyOn(File.prototype, "getMetadata");
    });

    afterEach(() => {
      getMetadataSpy.mockRestore();
      vi.unstubAllEnvs();
    });

    test("should return a gs:// file part with the object's content type", async () => {
      getMetadataSpy.mockResolvedValue([{ contentType: "audio/mp4" }]);

      const part = await audioFilePart(
        "test-audio-bucket",
        "US_XX/meetings/final.m4a",
      );

      expect(part).toEqual({
        fileData: {
          fileUri: "gs://test-audio-bucket/US_XX/meetings/final.m4a",
          mimeType: "audio/mp4",
        },
      });
    });

    test("should fall back to audio/mpeg when the object has no content type", async () => {
      getMetadataSpy.mockResolvedValue([{}]);

      const part = await audioFilePart("test-audio-bucket", "final.mp3");

      expect(part.fileData?.mimeType).toBe("audio/mpeg");
    });

    test("should reject a bucket other than the audio recordings bucket", async () => {
      await expect(
        audioFilePart("some-other-bucket", "final.m4a"),
      ).rejects.toThrow(
        "Requested audio from bucket some-other-bucket, expected test-audio-bucket",
      );
      expect(getMetadataSpy).not.toHaveBeenCalled();
    });
  });
});
