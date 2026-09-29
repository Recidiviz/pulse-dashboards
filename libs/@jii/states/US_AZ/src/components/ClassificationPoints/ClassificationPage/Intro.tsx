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

import assertNever from "assert-never";

import { CopyWrapper } from "~@jii/common-ui";
import { useUsAzTranslations } from "~@jii/translation";
import { UsAzResidentJiiData } from "~datatypes";

export const Intro = ({
  classType,
}: {
  classType: UsAzResidentJiiData["mostRecentClassificationType"];
}) => {
  const { t } = useUsAzTranslations();

  let intro: string;

  const { initialClassIntro, reclassIntro, noClassIntro } = t(
    ($) => $.classificationPoints.page,
    { returnObjects: true },
  );
  switch (classType) {
    case "INITIAL":
      intro = initialClassIntro;
      break;
    case "RECLASSIFICATION":
      intro = reclassIntro;
      break;
    case undefined:
      intro = noClassIntro;
      break;
    default:
      assertNever(classType);
  }

  return <CopyWrapper>{intro}</CopyWrapper>;
};
