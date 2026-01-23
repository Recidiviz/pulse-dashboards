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

import type React from "react";

import WarningCircleIcon from "~@reentry/frontend/components/icons/WarningCircleIcon";

interface ValidationData {
  word_count: boolean;
  no_prompt_injection: boolean;
  diarization: boolean;
  minimum_duration: boolean;
}

interface TranscriptionValidationWarningsProps {
  validation: ValidationData;
  hasConversation?: boolean;
  lastUpdated?: string;
}

const TranscriptionValidationWarnings: React.FC<
  TranscriptionValidationWarningsProps
> = ({ validation, hasConversation = true, lastUpdated }) => {
  const hasAnyValidationFailure =
    !validation.word_count ||
    !validation.diarization ||
    !validation.minimum_duration ||
    !validation.no_prompt_injection ||
    !hasConversation;

  if (!hasAnyValidationFailure) {
    return null;
  }

  return (
    <div className="flex pl-5 pr-4 py-3 flex-col justify-center items-start gap-4 overflow-hidden">
      <div className="flex flex-col justify-start items-start gap-2">
        <div className="inline-flex justify-start items-center gap-2">
          <WarningCircleIcon />
          <div className="font-['Public_Sans'] text-sm font-medium leading-[120%] tracking-[-0.14px]">
            The recording contains insufficient information to generate output
            document(s). {lastUpdated && `Last updated: ${lastUpdated}`}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TranscriptionValidationWarnings;
