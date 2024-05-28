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

import { palette, spacing } from "@recidiviz/design-system";
import { rem } from "polished";
import { useEffect } from "react";
import toast from "react-hot-toast";
import useClipboard from "react-use-clipboard";
import styled from "styled-components/macro";

import copyIcon from "../../assets/static/images/copy.svg";

const PersonIdWithCopyIcon = styled.span<{ shiftIcon: boolean }>`
  color: ${palette.data.teal1};
  padding: 0 ${rem(spacing.xs)};
  border-radius: ${rem(spacing.xs / 2)};
  transition: all 0.3s ease;

  &::after {
    content: url("${copyIcon}");
    margin-left: ${rem(spacing.sm)};
    vertical-align: ${(props) => (props.shiftIcon ? "-15%" : "0")};
  }
  &:hover {
    background: rgba(53, 83, 98, 0.05);
    cursor: pointer;
  }
  &:active {
    background: ${palette.slate20};
    cursor: pointer;
  }
`;

const PersonId: React.FC<{
  children: React.ReactNode;
  personId: string;
  shiftIcon?: boolean;
  docLabel?: string;
}> = ({ children, personId, shiftIcon = false, docLabel = "DOC" }) => {
  const [isCopied, copyToClipboard] = useClipboard(personId, {
    successDuration: 5000,
  });

  useEffect(() => {
    if (isCopied) toast(`${docLabel} ID copied!`, { duration: 5000 });
  }, [isCopied, docLabel]);

  return (
    <PersonIdWithCopyIcon
      title={`Copy ${docLabel} ID to clipboard`}
      className="fs-exclude"
      onClick={() => copyToClipboard()}
      shiftIcon={shiftIcon}
    >
      {children}
    </PersonIdWithCopyIcon>
  );
};

export default PersonId;
