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

import { sortBy, startCase, toLower } from "lodash";

import { Card, HomepageSectionHeading } from "~@jii/common-ui";
import { useResidentMetadata } from "~@jii/data";
import { OpenTable } from "~@jii/earned-good-time";
import { useUsNeTranslations } from "~@jii/translation";

const UsNeGoodTimeAdjustments = () => {
  const metadata = useResidentMetadata("US_NE");
  const { t, i18n } = useUsNeTranslations();

  const colSpec = [
    {
      label: t(($) => $.home.goodTimeAdjustments.tableColumns.adjustmentType),
      key: "adjustmentType",
    },
    {
      label: t(
        ($) => $.home.goodTimeAdjustments.tableColumns.misconductReportNumber,
      ),
      key: "misconductReportNumber",
    },
    {
      label: t(($) => $.home.goodTimeAdjustments.tableColumns.days),
      key: "days",
    },
    {
      label: t(($) => $.home.goodTimeAdjustments.tableColumns.transactionDate),
      key: "transactionDate",
    },
  ];

  const rows = sortBy(
    metadata.creditActivity,
    ({ creditDate }) => -creditDate,
  ).map(
    ({
      creditsEarned,
      violationDescription,
      misconductReportNumber,
      creditDate,
    }) => {
      const adjustmentType =
        (creditsEarned > 0
          ? t(($) => $.home.goodTimeAdjustments.adjustmentType.addition)
          : t(($) => $.home.goodTimeAdjustments.adjustmentType.removal)) +
        (violationDescription
          ? `: ${startCase(toLower(violationDescription))}`
          : "");

      const days = i18n.format(
        creditsEarned,
        "withSign",
        i18n.resolvedLanguage,
      );

      const transactionDate = i18n.format(
        creditDate,
        "formatFullDate",
        i18n.resolvedLanguage,
      );

      return {
        adjustmentType,
        misconductReportNumber: misconductReportNumber ?? "",
        days,
        transactionDate,
      };
    },
  );

  return (
    <section>
      <HomepageSectionHeading>
        {t(($) => $.home.goodTimeAdjustments.sectionTitle)}
      </HomepageSectionHeading>
      <Card>
        {rows.length === 0 ? (
          t(($) => $.home.goodTimeAdjustments.emptyMessage)
        ) : (
          <OpenTable columns={colSpec} data={rows} />
        )}
      </Card>
    </section>
  );
};

export default UsNeGoodTimeAdjustments;
