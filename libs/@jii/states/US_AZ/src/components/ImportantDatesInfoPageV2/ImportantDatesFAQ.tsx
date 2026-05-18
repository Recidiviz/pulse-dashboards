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

import { useUsAzTranslations } from "~@jii/translation";

import { AccordionSection } from "./AccordionSection";

export function UsAzImportantDatesFAQ() {
  const { t } = useUsAzTranslations();

  const allDateHashes = [
    "tprDate",
    "dtpDate",
    "csbdDate-trToAddDate",
    "ercdDate-addDate",
    "sedDate",
    "csedDate",
  ] as const;

  // TODO(OBT-16919): Enable people to toggle between display of their own dates
  // and display of all dates
  return allDateHashes.map((hash) => (
    <AccordionSection
      key={hash}
      id={hash}
      accordionCopy={t(($) => $.importantDatesInfoPages[hash].questions, {
        returnObjects: true,
      })}
      sectionCopy={{
        header: t(($) => $.importantDatesInfoPages[hash].header),
        openAllCopy: t(($) => $.openAll),
        closeAllCopy: t(($) => $.closeAll),
      }}
    />
  ));
}
