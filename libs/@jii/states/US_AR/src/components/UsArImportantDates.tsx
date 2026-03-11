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

import { Card, HomepageSectionHeading, SlateCopy } from "~@jii/common-ui";
import { CardDateInfo } from "~@jii/earned-good-time";
import { useUsArTranslations } from "~@jii/translation";
import { UsArResidentMetadata } from "~datatypes";

export function UsArImportantDates({
  metadata,
}: {
  metadata: UsArResidentMetadata;
}) {
  const { t } = useUsArTranslations();
  const dates = [
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
      {dates.map(({ date, label, description }) => {
        const localeAwareDate = t(($) => $.importantDates.formatFullDate, {
          replace: { date: date },
        });
        return (
          <Card key={label}>
            <CardDateInfo label={label} value={localeAwareDate} />
            <SlateCopy>{description}</SlateCopy>
          </Card>
        );
      })}
    </section>
  );
}
