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

import { StateCode } from "@prisma/jii-texting-server/client";

import { TwilioAPIClient } from "~twilio-api";

export type processJiiArguments = {
  stateCode: StateCode;
  dryRun: boolean;
};

export function processJii({ stateCode, dryRun }: processJiiArguments) {
  console.log(
    `Starting the process-jii job for ${stateCode}, where dry-run is ${dryRun}`,
  );

  const twilioAccountSid = process.env["TWILIO_ACCOUNT_SID"] ?? "";
  const twilioAuthToken = process.env["TWILIO_AUTH_TOKEN"] ?? "";
  const twilioSubaccountSid =
    process.env[`TWILIO_MESSAGING_SERVICE_SID_${stateCode.toUpperCase()}`];

  const twilioClient = new TwilioAPIClient(
    twilioAccountSid,
    twilioAuthToken,
    twilioSubaccountSid,
  );

  twilioClient.createMessage("Hello from Recidiviz", "5514979687");
}
