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

import { Card } from "~@jii/common-ui";
import { useUsNcTranslations } from "~@jii/translation";

import { RNADescription, RNAHeading } from "../styles";

/**
 * Landing page for Risks and Needs Assessment when the form has been completed.
 */
export function UsNcRNASuccessfulSubmission({
  completedAt,
}: {
  completedAt: Date;
}) {
  const { t } = useUsNcTranslations();

  const { heading, description } = t(($) => $.rna.landing.resumeForm, {
    completedAt,
    returnObjects: true,
  });

  return (
    <Card>
      <RNAHeading>{heading}</RNAHeading>
      <RNADescription>{description}</RNADescription>
    </Card>
  );
}
