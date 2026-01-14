// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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

import { request } from "node:http";

import { DeepgramClient } from "@deepgram/sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { File } from "@google-cloud/storage";
import { AssemblyAI } from "assemblyai";
import OpenAI from "openai";
import { GenericContainer, Wait } from "testcontainers";
import { mock } from "vitest-mock-extended";

export const testPort = process.env["PORT"]
  ? Number(process.env["PORT"])
  : 3003;
export const testHost = process.env["HOST"] ?? "localhost";

const FAKE_GCS_PORT = 4443;

// Note: if you see the error "An error occurred getting a credential", try pulling the image
// first outside of the test with:
// docker pull fsouza/fake-gcs-server:1.52.3
// docker pull testcontainers/ryuk:0.12.0

// Start container with HTTP scheme (not HTTPS)
const gcsContainer = await new GenericContainer("fsouza/fake-gcs-server:1.52.3")
  .withExposedPorts(FAKE_GCS_PORT)
  .withCommand([
    "-scheme",
    "http",
    "-port",
    String(FAKE_GCS_PORT),
    "-external-url",
    "http://localhost:4443",
  ])
  .withStartupTimeout(120_000)
  .withWaitStrategy(Wait.forListeningPorts())
  .start();

const mappedPort = gcsContainer.getMappedPort(FAKE_GCS_PORT);
const host = gcsContainer.getHost();

export const GCS_API_ENDPOINT = `http://${host}:${mappedPort}`;

const data = JSON.stringify({ externalUrl: GCS_API_ENDPOINT });

// This updates the external url of the fake-gcs-server so that uploads work
const options = {
  hostname: new URL(GCS_API_ENDPOINT).hostname,
  port: new URL(GCS_API_ENDPOINT).port,
  path: `${new URL(GCS_API_ENDPOINT).pathname}/_internal/config`,
  method: "PUT",
  headers: {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(data),
  },
};

const req = request(options);
req.write(data);
req.end();

// Mock out the Storage constructor to use our fake-gcs-server endpoint
vi.mock("@google-cloud/storage", async (importOriginal) => {
  const mod: typeof import("@google-cloud/storage") = await importOriginal();
  return {
    ...mod,
    Storage: vi.fn(
      () =>
        new mod.Storage({ apiEndpoint: GCS_API_ENDPOINT, projectId: "test" }),
    ),
  };
});

// Mock the getSignedUrl method to return a predictable URL
vi.spyOn(File.prototype, "getSignedUrl").mockImplementation(async function (
  this: File,
) {
  return [`${GCS_API_ENDPOINT}/${this.bucket.name}/${this.name}`];
});

export const mockAssemblyAI = mock<AssemblyAI>({
  transcripts: {
    transcribe: vi.fn().mockResolvedValue({
      id: "mock-transcript-id",
      status: "completed",
      text: "This is a mock transcription.",
      summary: "This is a mock summary of the transcription.",
      words: [
        {
          text: "This",
          start: 0,
          end: 400,
          confidence: 0.95,
          speaker: "A",
        },
        {
          text: "is",
          start: 400,
          end: 600,
          confidence: 0.98,
          speaker: "A",
        },
        { text: "a", start: 600, end: 700, confidence: 0.97, speaker: "A" },
        {
          text: "mock",
          start: 700,
          end: 1100,
          confidence: 0.93,
          speaker: "A",
        },
        {
          text: "transcription",
          start: 1100,
          end: 1800,
          confidence: 0.96,
          speaker: "A",
        },
      ],
      utterances: [
        {
          confidence: 0.96,
          end: 1800,
          speaker: "A",
          start: 0,
          text: "This is a mock transcription.",
          words: [
            {
              text: "This",
              start: 0,
              end: 400,
              confidence: 0.95,
              speaker: "A",
            },
            {
              text: "is",
              start: 400,
              end: 600,
              confidence: 0.98,
              speaker: "A",
            },
            {
              text: "a",
              start: 600,
              end: 700,
              confidence: 0.97,
              speaker: "A",
            },
            {
              text: "mock",
              start: 700,
              end: 1100,
              confidence: 0.93,
              speaker: "A",
            },
            {
              text: "transcription",
              start: 1100,
              end: 1800,
              confidence: 0.96,
              speaker: "A",
            },
          ],
        },
      ],
      language_code: "en",
      audio_duration: 1.8,
    }),
  },
});

// Mock AssemblyAI client
vi.mock("assemblyai", () => ({
  AssemblyAI: vi.fn().mockImplementation(() => {
    return mockAssemblyAI;
  }),
}));

export const mockDeepgram = mock<DeepgramClient>({
  listen: {
    prerecorded: {
      transcribeUrl: vi.fn().mockResolvedValue({
        result: {
          summary: "This is a mock summary of the transcription.",
          utterances: [
            {
              confidence: 0.96,
              end: 1800,
              speaker: 0,
              start: 0,
              transcript: "This is a mock transcription.",
            },
          ],
        },
      }),
    },
  },
});

// Mock Deepgram client
vi.mock("@deepgram/sdk", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    // @ts-expect-error TS is unhappy about spreading 'actual' here
    ...actual,
    createClient: vi.fn().mockImplementation(() => {
      return mockDeepgram;
    }),
  };
});

// Mock OpenAI client
export const mockOpenAI = mock<OpenAI>({
  baseURL: "https://us.api.openai.com/v1",
  chat: {
    completions: {
      create: vi.fn().mockResolvedValue({
        id: "mock-completion-id",
        object: "chat.completion",
        created: Date.now(),
        model: "gpt-4o-mini",
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
      }),
    },
  },
});

vi.mock("openai", () => ({
  default: vi.fn().mockImplementation(() => {
    return mockOpenAI;
  }),
}));

// Mock Google Generative AI client
export const mockGemini = mock<GoogleGenerativeAI>({
  getGenerativeModel: vi.fn().mockReturnValue({
    generateContent: vi.fn().mockResolvedValue({
      response: {
        text: vi.fn().mockReturnValue(
          JSON.stringify({
            verifications: [],
          }),
        ),
      },
    }),
  }),
});

vi.mock("@google/generative-ai", () => ({
  GoogleGenerativeAI: vi.fn().mockImplementation(() => {
    return mockGemini;
  }),
}));
