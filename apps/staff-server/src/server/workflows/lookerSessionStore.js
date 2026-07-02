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

import Redis from "ioredis";

const KEY_PREFIX = "looker:session:";

export function createRedisStore() {
  const client = new Redis({
    host: process.env.REDISHOST || "localhost",
    port: Number(process.env.REDISPORT ?? 6380),
    password: process.env.REDISAUTH || "",
  });
  client.on("error", (err) =>
    console.error("ERR:REDIS (looker sessions):", err),
  );
  return {
    get: async (key) => {
      const raw = await client.get(KEY_PREFIX + key);
      return raw ? JSON.parse(raw) : null;
    },
    set: async (key, value, ttl) => {
      await client.set(KEY_PREFIX + key, JSON.stringify(value), "EX", ttl);
    },
    delete: async (key) => {
      await client.del(KEY_PREFIX + key);
    },
  };
}
