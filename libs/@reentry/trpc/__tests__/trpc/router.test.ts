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

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck Need to fix typing in followup

import { describe, expect, test } from "vitest";

import { testTRPCClient } from "~@reentry/trpc/test/setup";
import { intakeId } from "~@reentry/trpc/test/setup/seed";

describe("search", () => {
  test(
    "should work if all parameters are passed",
    { timeout: 10_000 },
    async () => {
      let subData;

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const sub = testTRPCClient.intakeChat.intakeChat.subscribe(
        { intakeId: intakeId },
        {
          onData(data) {
            subData = data;
          },
          onError(error) {
            console.error(">>> anon:sub:randomNumber:error:", error);
          },
          onComplete() {
            console.log(">>> anon:sub:randomNumber:", "unsub() called");
          },
        },
      );

      await vi.waitFor(() => {
        return subData !== undefined;
      });

      expect(subData).toEqual({
        type: "response",
        lastId: 123123,
        messages: ["Hello, how are you?", "I'm doing well, thank you!"],
      });

      subData = undefined;

      await testTRPCClient.intakeChat.reply.mutate({
        intakeId: "intake-id",
        response: "Hello, how are you?",
      });

      await vi.waitFor(() => {
        expect(subData).toBeDefined();
      });

      expect(subData).toBeDefined();
    },
  );
});
