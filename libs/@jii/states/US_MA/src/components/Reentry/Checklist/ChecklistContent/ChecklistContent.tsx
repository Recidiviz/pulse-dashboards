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

import { useEffect, useState } from "react";

import type { ReentryChecklistSectionId } from "~@jii/configs";
import { useUsMaTranslations } from "~@jii/translation";

import type { ReentryChecklistItem } from "../../../../hooks/types";
import { useReentryAnalytics } from "../../../../hooks/useReentryAnalytics";
import { useReentryChecklist } from "../../../../hooks/useReentryChecklist";
import { useReentryQuestionnaire } from "../../../../hooks/useReentryQuestionnaire";
import { useReentryQuestionnaireDisplay } from "../../../../hooks/useReentryQuestionnaireDisplay";
import {
  getPersonalizationReasons,
  toChecklistSections,
} from "../../../../hooks/utils";
import { ChecklistItem } from "../ChecklistItem/ChecklistItem";
import { ChecklistSection } from "../ChecklistSection/ChecklistSection";
import { PersonalizationBanner } from "../PersonalizationBanner/PersonalizationBanner";
import { PersonalizedBadge } from "../PersonalizedBadge/PersonalizedBadge";
import { UpdateProfileCard } from "../UpdateProfileCard/UpdateProfileCard";

export const ChecklistContent = () => {
  const { t } = useUsMaTranslations();

  const { status, answers } = useReentryQuestionnaire();
  const { questions } = useReentryQuestionnaireDisplay();

  const { items, personalizedItemCount, setChecked } = useReentryChecklist();

  const isProfileCompleted = status === "COMPLETED";
  const sections = toChecklistSections(items);
  const itemSaveError = t(($) => $.reentry.checklist.itemSaveError);

  const trackEvent = useReentryAnalytics();

  // The checklist as it was when the page opened.
  const [initialSnapshot] = useState(() => ({
    itemsTotal: items.length,
    itemsChecked: items.filter((item) => item.checked).length,
    isPersonalized: isProfileCompleted,
  }));

  useEffect(() => {
    trackEvent("frontend_reentry_checklist_viewed", initialSnapshot);
  }, [trackEvent, initialSnapshot]);

  const toggleChecked = (
    item: ReentryChecklistItem,
    band: ReentryChecklistSectionId,
    checked: boolean,
  ) => {
    const itemProperties = {
      itemId: item.id,
      band,
      isPersonalizedItem: item.isPersonalized,
    };
    if (checked) {
      trackEvent("frontend_reentry_checklist_item_checked", itemProperties);
    } else {
      trackEvent("frontend_reentry_checklist_item_unchecked", itemProperties);
    }
    setChecked(item.id, checked);
  };

  return (
    <>
      <PersonalizationBanner
        status={status}
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
            {section.items.map((item) => {
              const error = item.hasSaveError ? itemSaveError : undefined;

              return (
                <ChecklistItem
                  key={item.id}
                  label={t(($) => $.reentry.checklist.itemCopy[item.id].label)}
                  checked={item.checked}
                  onCheckedChange={(checked) =>
                    toggleChecked(item, section.id, checked)
                  }
                  badge={
                    item.isPersonalized && (
                      <PersonalizedBadge
                        itemId={item.id}
                        reasons={getPersonalizationReasons(
                          item.id,
                          questions,
                          answers,
                        )}
                      />
                    )
                  }
                  error={error}
                />
              );
            })}
          </ChecklistSection>
        );
      })}

      {isProfileCompleted && <UpdateProfileCard />}
    </>
  );
};
