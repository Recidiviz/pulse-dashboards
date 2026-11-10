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

import React from "react";

import CheckIcon from "../../../assets/tabler-icon-check.svg?react";
import CopyIcon from "../../../assets/tabler-icon-copy.svg?react";
import * as Styled from "./CopyButton.styles";

const COPY_FEEDBACK_DURATION_MS = 1000;

interface CopyButtonProps {
  text: string | null;
  ariaLabel: string;
  onCopy: (text: string) => Promise<boolean>;
}

export const CopyButton: React.FC<CopyButtonProps> = ({
  text,
  ariaLabel,
  onCopy,
}) => {
  const [copied, setCopied] = React.useState(false);
  const resetTimeoutRef =
    React.useRef<ReturnType<typeof setTimeout>>(undefined);

  React.useEffect(() => () => clearTimeout(resetTimeoutRef.current), []);

  if (!text) return null;

  const handleClick = async () => {
    const didCopy = await onCopy(text);
    if (!didCopy) return;

    clearTimeout(resetTimeoutRef.current);
    setCopied(true);
    resetTimeoutRef.current = setTimeout(
      () => setCopied(false),
      COPY_FEEDBACK_DURATION_MS,
    );
  };

  return (
    <Styled.CopyIconButton
      type="button"
      aria-label={ariaLabel}
      data-copied={copied}
      onClick={() => void handleClick()}
    >
      {copied ? <CheckIcon /> : <CopyIcon />}
    </Styled.CopyIconButton>
  );
};
