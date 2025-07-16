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

import { baseProcedure, router } from "~@reentry/trpc/init";
import { processAudioInputSchema } from "~@reentry/trpc/routes/transcription-intake/transcription-intake.schema";

export const transcriptionIntakeRouter = router({
  processAudio: baseProcedure
    .input(processAudioInputSchema)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    .mutation(async ({ input: { clientId } }) => {
      // TODO: Implement the logic to process audio for a client
    }),
});
