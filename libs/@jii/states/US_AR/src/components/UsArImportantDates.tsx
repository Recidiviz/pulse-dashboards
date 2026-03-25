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

import { spacing } from "@recidiviz/design-system";
import { rem } from "polished";
import styled from "styled-components";

import { GoButton, HomepageSectionHeading } from "~@jii/common-ui";
import { State } from "~@jii/paths";
import { useUsArTranslations } from "~@jii/translation";
import { UsArResidentMetadata } from "~datatypes";

import { DateInfoCard, DateInfoProps } from "./DateInfoCard";

const LinkContainer = styled.div`
  margin-top: ${rem(spacing.lg)};
  margin-bottom: ${rem(spacing.lg)};
`;

export function UsArImportantDates({
  metadata,
}: {
  metadata: UsArResidentMetadata;
}) {
  const { t } = useUsArTranslations();
  const dates: DateInfoProps[] = [
    {
      date: metadata.eligibilityDate,
      label: t(
        ($) =>
          $.importantDates.eligibilityDate.labels[metadata.eligibilityDateName],
      ),
      description: t(($) => $.importantDates.eligibilityDate.description),
    },
    {
      date: metadata.maximumReleaseDate,
      label: t(($) => $.importantDates.maximumReleaseDate.label),
      description: t(($) => $.importantDates.maximumReleaseDate.description),
    },
  ];

  return (
    <section>
      <HomepageSectionHeading>
        {t(($) => $.importantDates.sectionHeader)}
      </HomepageSectionHeading>

      {dates.map((dateInfo) => (
        <DateInfoCard {...dateInfo} />
      ))}

      <LinkContainer>
        <GoButton
          to={State.Resident.$.UsArMoreInformation.ImportantDates.buildRelativePath(
            {},
          )}
        >
          {t(($) => $.importantDates.moreInfoLink)}
        </GoButton>
      </LinkContainer>
    </section>
  );
}
