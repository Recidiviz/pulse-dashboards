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

import { Header34, Sans14, spacing } from "@recidiviz/design-system";
import { observer } from "mobx-react-lite";
import styled from "styled-components";

import { hydrateTemplate, useSingleResidentContext } from "~@jii/data";
import { FullWidthBanner } from "~@jii/layout";
import { palette } from "~design-system";

import { useUsNeContext } from "./usNeContext";

const HeaderFieldsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${spacing.sm}px ${spacing.md}px;
  margin-top: ${spacing.xs}px;
`;

const HeaderField = styled(Sans14)`
  display: inline-flex;
  flex-shrink: 0;
  white-space: nowrap;
`;

const SubtitleLabel = styled(Sans14)`
  color: ${palette.slate80};
  margin-right: 4px;
`;

const UsNeHomeHeader = observer(function UsNeHomeHeader() {
  const { copy, metadata } = useUsNeContext();
  const { resident } = useSingleResidentContext();
  const sectionCopy = copy.home;
  const headerFields = sectionCopy.headerFields
    .map((f) => ({ ...f, hydrated: hydrateTemplate(f.value, resident) }))
    .filter((f) => f.hydrated !== ""); // drop empty (e.g., optional mandatory minimum sentence)
  return (
    <>
      <FullWidthBanner>
        {hydrateTemplate(copy.lastUpdated, metadata)}
      </FullWidthBanner>
      <header>
        <Header34 as="h1">{sectionCopy.pageTitle}</Header34>
        <HeaderFieldsContainer>
          {headerFields.map(({ label, hydrated }) => (
            <HeaderField key={label}>
              <SubtitleLabel>{label}</SubtitleLabel>
              <span>{hydrated}</span>
            </HeaderField>
          ))}
        </HeaderFieldsContainer>
      </header>
    </>
  );
});

export default UsNeHomeHeader;
