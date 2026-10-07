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

import { Chip } from "~@jii/common-ui";
import { useUsMaTranslations } from "~@jii/translation";

import { useReentryChecklist } from "../../../../hooks/useReentryChecklist";
import { useReentryQuestionnaire } from "../../../../hooks/useReentryQuestionnaire";
import { toChecklistSections } from "../../../../hooks/utils";
import { ChecklistItem } from "../ChecklistItem/ChecklistItem";
import { ChecklistSection } from "../ChecklistSection/ChecklistSection";
import { PersonalizationBanner } from "../PersonalizationBanner/PersonalizationBanner";
import { UpdateProfileCard } from "../UpdateProfileCard/UpdateProfileCard";

export const ChecklistContent = () => {
  const { t } = useUsMaTranslations();
  const { status } = useReentryQuestionnaire();
  const { items, personalizedItemCount, setChecked } = useReentryChecklist();

  const isProfileCompleted = status === "COMPLETED";
  const sections = toChecklistSections(items);
  const personalizedBadge = t(($) => $.reentry.checklist.personalizedBadge);

  return (
    <>
      <PersonalizationBanner
        isProfileCompleted={isProfileCompleted}
        personalizedItemCount={personalizedItemCount}
      />

      {sections.map((section) => {
        if (section.items.length === 0) return null;

        const sectionCopy = t(($) => $.reentry.checklist.sections[section.id], {
          returnObjects: true,
        });
        const progressLabel = t(($) => $.reentry.checklist.progress, {
          done: section.items.filter((item) => item.checked).length,
          total: section.items.length,
        });

        return (
          <ChecklistSection
            key={section.id}
            title={sectionCopy.title}
            description={sectionCopy.description}
            progressLabel={progressLabel}
          >
            {section.items.map((item) => (
              <ChecklistItem
                key={item.id}
                label={t(($) => $.reentry.checklist.itemCopy[item.id].label)}
                checked={item.checked}
                onCheckedChange={(checked) => setChecked(item.id, checked)}
                badge={
                  item.isPersonalized && (
                    <Chip color="blue">{personalizedBadge}</Chip>
                  )
                }
              />
            ))}
          </ChecklistSection>
        );
      })}

      {isProfileCompleted && <UpdateProfileCard />}
    </>
  );
};
