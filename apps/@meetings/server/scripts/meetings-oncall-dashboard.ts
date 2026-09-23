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

/**
 * Serves a local oncall dashboard for recent meetings, with reprocessing and
 * audio re-upload actions.
 *
 * ## Prerequisites
 *
 * This script connects to Cloud SQL via the Cloud SQL Auth Proxy. Start it before
 * running the script:
 *
 *   # staging:
 *   cloud-sql-proxy --port 5432 recidiviz-dashboard-staging:us-central1:meetings
 *   # production:
 *   cloud-sql-proxy --port 5432 recidiviz-dashboard-production:us-central1:meetings
 *
 * ## Running
 *
 * Run `nx meetings-oncall @meetings/server --args="--help"` for usage.
 */

import { Command } from "@commander-js/extra-typings";
import { spawnSync } from "child_process";
import { randomBytes } from "crypto";
import Fastify from "fastify";

import { MEETINGS_STATE_CODES } from "~@meetings/config";
import {
  MAX_UPLOAD_BYTES,
  triggerReprocess,
  uploadReplacementAudio,
  validateMeetingId,
  validateStateCode,
  validateStep,
} from "~@meetings/server/scripts/meetings-oncall/actions";
import {
  FetchFilters,
  fetchRows,
} from "~@meetings/server/scripts/meetings-oncall/data";
import { diagnoseMeeting } from "~@meetings/server/scripts/meetings-oncall/diagnose";
import { renderHtml } from "~@meetings/server/scripts/meetings-oncall/render";

const DEFAULT_LIMIT = 10;
const DEFAULT_PORT = 4321;

interface ScriptArgs {
  limit: number;
  meetingId?: string;
  user?: string;
  port: number;
  open: boolean;
}

function parseArgs(): ScriptArgs {
  const program = new Command()
    .name("meetings-oncall-dashboard")
    .description(
      "Serve a local dashboard of recent meetings, with reprocessing actions",
    )
    .option(
      "--limit <limit>",
      "How many meetings to show",
      String(DEFAULT_LIMIT),
    )
    .option("--meeting-id <meeting-id>", "Show only this meeting")
    .option("--user <email>", "Show only meetings created by this staff email")
    .option("--port <port>", "Port to serve on", String(DEFAULT_PORT))
    .option("--no-open", "Don't open a browser automatically")
    .parse();

  const options = program.opts();

  const limit = Number(options.limit);
  if (!Number.isInteger(limit) || limit < 1) {
    console.error(`--limit must be a positive integer, got "${options.limit}"`);
    process.exit(1);
  }

  const port = Number(options.port);
  if (!Number.isInteger(port) || port < 1024 || port > 65535) {
    console.error(
      `--port must be between 1024 and 65535, got "${options.port}"`,
    );
    process.exit(1);
  }

  return {
    limit,
    meetingId: options.meetingId,
    user: options.user,
    port,
    open: options.open,
  };
}

/** Query-string overrides from the page's filter form. */
function filtersFromQuery(
  query: Record<string, unknown>,
  defaults: ScriptArgs,
): FetchFilters {
  const limit = Number(query["limit"]);
  const meetingId = query["meetingId"];
  const user = query["user"];

  return {
    limit:
      Number.isInteger(limit) && limit > 0
        ? Math.min(limit, 500)
        : defaults.limit,
    meetingId:
      typeof meetingId === "string" && meetingId
        ? meetingId
        : defaults.meetingId,
    user: typeof user === "string" && user ? user : defaults.user,
  };
}

async function main() {
  console.log("🩺 Meetings Oncall Dashboard\n");

  const dbUrlTemplate = process.env["DATABASE_URL_TEMPLATE"];
  if (!dbUrlTemplate) {
    throw new Error(
      "Missing DATABASE_URL_TEMPLATE environment variable.\n" +
        "Add it to env.meetings-oncall.<env>.enc.yaml (copy the value from env.export-label-studio-tasks.<env>.enc.yaml).",
    );
  }

  const args = parseArgs();
  const configuration = process.env["NX_TASK_TARGET_CONFIGURATION"];
  if (!configuration) {
    throw new Error(
      "NX_TASK_TARGET_CONFIGURATION is not set. " +
        "Run via nx (e.g. nx meetings-oncall @meetings/server --configuration=staging).",
    );
  }

  // The server performs authenticated writes against production on request, so
  // requests must carry this per-run secret. Without it, any process on this
  // machine could drive it.
  const token = randomBytes(16).toString("hex");

  const app = Fastify({ bodyLimit: MAX_UPLOAD_BYTES });

  app.addContentTypeParser(
    "application/octet-stream",
    { parseAs: "buffer" },
    (_req, body, done) => done(null, body),
  );

  app.addHook("onRequest", async (request, reply) => {
    const provided =
      request.headers["x-oncall-token"] ??
      (request.query as Record<string, unknown>)["t"];
    if (provided !== token) {
      await reply.code(403).send("Forbidden: missing or bad dashboard token.");
      return reply;
    }
  });

  app.get("/", async (request, reply) => {
    const filters = filtersFromQuery(
      request.query as Record<string, unknown>,
      args,
    );
    console.log(
      `\n🔎 Loading ${filters.limit} meeting(s)` +
        `${filters.meetingId ? ` id=${filters.meetingId}` : ""}` +
        `${filters.user ? ` user=${filters.user}` : ""}`,
    );

    const { rows, skippedStates } = await fetchRows(dbUrlTemplate, filters);

    return reply.type("text/html; charset=utf-8").send(
      renderHtml({
        rows,
        configuration,
        skippedStates,
        filters,
        token,
        stateCount: MEETINGS_STATE_CODES.length,
      }),
    );
  });

  app.post("/api/reprocess", async (request, reply) => {
    const body = (request.body ?? {}) as Record<string, unknown>;
    try {
      const stateCode = validateStateCode(body["stateCode"]);
      const meetingId = validateMeetingId(body["meetingId"]);
      const step = validateStep(body["step"]);
      const gcsPath =
        typeof body["gcsPath"] === "string" ? body["gcsPath"] : undefined;

      console.log(`\n🔄 Reprocess ${step} for ${meetingId} (${stateCode})`);
      const output = triggerReprocess({
        configuration,
        stateCode,
        meetingId,
        step,
        gcsPath,
      });
      return reply.type("text/plain; charset=utf-8").send(output);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`   ❌ ${message}`);
      return reply.code(400).type("text/plain; charset=utf-8").send(message);
    }
  });

  app.get("/api/diagnose", async (request, reply) => {
    const query = request.query as Record<string, unknown>;
    try {
      const stateCode = validateStateCode(query["stateCode"]);
      const meetingId = validateMeetingId(query["meetingId"]);

      console.log(`\n🔍 Inspecting GCS folder for ${meetingId} (${stateCode})`);
      const diagnosis = await diagnoseMeeting({
        dbUrlTemplate,
        stateCode,
        meetingId,
      });
      diagnosis.findings.forEach((finding) =>
        console.log(`   ${finding.level}: ${finding.message}`),
      );

      return reply.send(diagnosis);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`   ❌ ${message}`);
      return reply.code(400).type("text/plain; charset=utf-8").send(message);
    }
  });

  app.post("/api/upload", async (request, reply) => {
    const query = request.query as Record<string, unknown>;
    try {
      const stateCode = validateStateCode(query["stateCode"]);
      const meetingId = validateMeetingId(query["meetingId"]);
      const filename =
        typeof query["filename"] === "string" ? query["filename"] : "";
      const body = request.body;

      if (!Buffer.isBuffer(body)) {
        throw new Error("Expected a binary request body");
      }

      console.log(
        `\n⬆️  Uploading ${filename} (${body.length} bytes) for ${meetingId} (${stateCode})`,
      );
      const { gcsPath, bucket } = await uploadReplacementAudio({
        dbUrlTemplate,
        stateCode,
        meetingId,
        filename,
        body,
      });
      console.log(`   ✅ gs://${bucket}/${gcsPath}`);

      return reply.send({ gcsPath, bucket });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`   ❌ ${message}`);
      return reply.code(400).type("text/plain; charset=utf-8").send(message);
    }
  });

  // Loopback only: this server proxies authenticated production writes.
  await app.listen({ port: args.port, host: "127.0.0.1" });

  const url = `http://127.0.0.1:${args.port}/?t=${token}`;
  console.log(`\n✅ Dashboard ready (${configuration}):\n   ${url}\n`);
  console.log("   Ctrl-C to stop.");

  if (args.open && process.platform === "darwin") {
    const result = spawnSync("open", [url]);
    if (result.error) {
      console.warn(
        `   (could not open automatically: ${result.error.message})`,
      );
    }
  }
}

main().catch((error) => {
  console.error("\n❌ Error:", error instanceof Error ? error.message : error);
  process.exit(1);
});
