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

import { typography } from "@recidiviz/design-system";
import Markdown from "markdown-to-jsx";
import { rem } from "polished";
import styled from "styled-components";

import { Checkbox } from "~@jii/common-ui";
import { palette } from "~design-system";

import { useUsNeContext } from "../usNeContext";

const Item = styled.label`
  display: flex;
  align-items: flex-start;
  gap: ${rem(16)};
  padding: ${rem(8)} 0;

  &:first-child {
    padding-top: 0;
  }
`;

const ItemText = styled(Markdown)`
  ${typography.Sans16};
  color: ${palette.slate90};
  margin-top: ${rem(3)};
`;

const ItemBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${rem(4)};
`;

const VerifiedNote = styled.p`
  ${typography.Sans14};
  font-style: italic;
  color: ${palette.slate70};
  margin: 0;
`;

interface ChecklistItemProps {
  item: { id: string; isChecked: boolean; isVerifiable: boolean };
  onToggle: () => void;
}

export function ChecklistItem({ item, onToggle }: ChecklistItemProps) {
  const {
    copy: { reentryChecklist: copy },
  } = useUsNeContext();

  const verifiedCopy = {
    ...copy.verifiedItem,
    ...copy.verifiedItem.overrides[item.id],
  };

  return (
    <Item>
      <Checkbox
        $size={24}
        checked={item.isChecked}
        onChange={onToggle}
        id={item.id}
        disabled={item.isVerifiable}
      />
      <ItemBody>
        <ItemText>{copy.items[item.id]}</ItemText>
        {item.isVerifiable && (
          <VerifiedNote>
            {item.isChecked ? verifiedCopy.confirmed : verifiedCopy.unconfirmed}
          </VerifiedNote>
        )}
      </ItemBody>
    </Item>
  );
}
