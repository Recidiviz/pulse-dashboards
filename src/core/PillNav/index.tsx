// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2022 Recidiviz, Inc.
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
import { palette, Sans14, spacing } from "@recidiviz/design-system";
import { rem, rgba } from "polished";
import { useEffect, useState } from "react";
import styled, { css } from "styled-components/macro";

interface PillNavProps {
  items: string[];
  onChange: (index: number) => void;
}

const PillNavContainer = styled.div`
  box-sizing: border-box;

  /* Auto layout */
  display: flex;
  flex-direction: row;
  align-items: center;

  height: 32px;
`;

interface PillNavItemProps {
  selected: boolean;
}

const PillNavItem = styled(Sans14)`
  padding: 8px 10px;
  cursor: pointer;

  ${(props: PillNavItemProps) =>
    props.selected
      ? css`
          background: ${rgba(palette.signal.highlight, 0.05)};
          border: 1px solid ${rgba(palette.signal.highlight, 0.5)};
          color: ${palette.signal.links};
        `
      : css`
          border: 1px solid ${palette.slate20};
          border-radius: 0 32px 32px 0;
          color: ${palette.slate85};
        `}
  &:first-child {
    border-radius: ${rem(spacing.xl)} 0 0 ${rem(spacing.xl)};
    padding-left: 12px;
    border-right-width: ${(props: PillNavItemProps) =>
      props.selected ? "1px" : 0};
  }

  &:last-child {
    border-radius: 0 ${rem(spacing.xl)} ${rem(spacing.xl)} 0;
    padding-right: 12px;

    border-left-width: ${(props: PillNavItemProps) =>
      props.selected ? "1px" : 0};
  }
`;

const PillNav: React.FC<PillNavProps> = ({ items, onChange }) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  useEffect(() => {
    onChange(selectedIndex);
  }, [onChange, selectedIndex]);

  return (
    <PillNavContainer>
      <>
        {items.map((children: string, index: number) => (
          <PillNavItem
            as="button"
            type="button"
            selected={selectedIndex === index}
            onClick={() => setSelectedIndex(index)}
          >
            {children}
          </PillNavItem>
        ))}
      </>
    </PillNavContainer>
  );
};

export default PillNav;
