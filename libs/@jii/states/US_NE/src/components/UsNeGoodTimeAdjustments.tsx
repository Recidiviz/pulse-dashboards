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

import { Card, HomepageSectionHeading } from "~@jii/common-ui";
import { formatFullDate } from "~@jii/data";
import { OpenTable } from "~@jii/earned-good-time";

import { useUsNeContext } from "./usNeContext";

const UsNeGoodTimeAdjustments = () => {
  const { copy, metadata } = useUsNeContext();
  const sectionCopy = copy.home.goodTimeAdjustments;

  const rows = metadata.creditActivity.map(
    ({ creditDate, creditType, creditsEarned, misconductReportNumber }) => ({
      misconductReportNumber,
      creditDate: formatFullDate(creditDate),
      creditType,
      amount: `${creditsEarned > 0 ? "+" : ""}${creditsEarned} days`,
    }),
  );

  return (
    <section>
      <HomepageSectionHeading>
        {sectionCopy.sectionTitle}
      </HomepageSectionHeading>
      <Card>
        {rows.length === 0 ? (
          sectionCopy.emptyMessage
        ) : (
          <OpenTable columns={sectionCopy.tableColumns} data={rows} />
        )}
      </Card>
    </section>
  );
};

export default UsNeGoodTimeAdjustments;
