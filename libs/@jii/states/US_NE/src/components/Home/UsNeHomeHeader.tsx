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
import { isNumber } from "lodash";
import { observer } from "mobx-react-lite";
import styled from "styled-components";

import { useResidentMetadata } from "~@jii/data";
import { FullWidthBanner } from "~@jii/layout";
import { useUsNeTranslations } from "~@jii/translation";
import type { UsNeResidentMetadata } from "~datatypes";
import { palette } from "~design-system";

const headerFields = [
  { key: "numHoldsAndDetainers", metadataField: "numHoldsAndDetainers" },
  { key: "numNotifiers", metadataField: "numNotifiers" },
  { key: "deadTime", metadataField: "deadTimeDays" },
  { key: "minimumSentence", metadataField: "minimumSentenceYears" },
  { key: "maximumSentence", metadataField: "maximumSentenceYears" },
  { key: "goodTimeLaw", metadataField: "goodTimeLawNumber" },
] as const satisfies {
  key: string;
  metadataField: keyof UsNeResidentMetadata;
}[];

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
  const metadata = useResidentMetadata("US_NE");
  const { t } = useUsNeTranslations();

  const visibleFields = headerFields.filter(
    ({ metadataField }) => metadata[metadataField] !== null,
  );

  return (
    <>
      <FullWidthBanner>
        {t(($) => $.lastUpdated, {
          sentenceLastModifiedDate: metadata.sentenceLastModifiedDate,
        })}
      </FullWidthBanner>
      <header>
        <Header34 as="h1">{t(($) => $.home.pageTitle)}</Header34>
        <HeaderFieldsContainer>
          {visibleFields.map(({ key, metadataField }) => (
            <HeaderField key={key}>
              <SubtitleLabel>
                {t(($) => $.home.headerFields[key].label)}
              </SubtitleLabel>
              <span>
                {t(($) => $.home.headerFields[key].value, {
                  ...metadata,
                  count: isNumber(metadata[metadataField])
                    ? metadata[metadataField]
                    : undefined,
                })}
              </span>
            </HeaderField>
          ))}
        </HeaderFieldsContainer>
      </header>
    </>
  );
});

export default UsNeHomeHeader;
