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

import { useUsMaTranslations } from "~@jii/translation";
import { Icon, palette } from "~design-system";

import {
  CompletedCheck,
  MarkerDot,
  SectionListLabel,
  SectionListMarker,
  SectionListRow,
  SectionStatusPill,
} from "./SectionProgress.styles";
import { SectionVariant } from "./types";

type SectionListItemProps = {
  number: number;
  label: string;
  variant: SectionVariant;
};

export const SectionListItem = ({
  number,
  label,
  variant,
}: SectionListItemProps) => {
  const { t } = useUsMaTranslations();

  const itemLabel = t(($) => $.reentry.questionnaire.sectionProgress.listItem, {
    number,
    label,
  });

  return (
    <SectionListRow>
      <SectionListMarker>
        {variant === "completed" ? (
          <CompletedCheck>
            <Icon kind="Check" size={10} color={palette.marble1} />
          </CompletedCheck>
        ) : (
          <MarkerDot $variant={variant} />
        )}
      </SectionListMarker>
      <SectionListLabel $muted={variant === "upcoming"}>
        {itemLabel}
      </SectionListLabel>
      {variant !== "upcoming" && (
        <SectionStatusPill $variant={variant}>
          {t(($) => $.reentry.questionnaire.sectionProgress[variant])}
        </SectionStatusPill>
      )}
    </SectionListRow>
  );
};
