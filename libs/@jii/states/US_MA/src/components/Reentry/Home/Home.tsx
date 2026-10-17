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

import { useState } from "react";

import { usePageTitle } from "~@jii/common-ui";
import { firstNameLastName, useSingleResidentContext } from "~@jii/data";
import { useUsMaTranslations } from "~@jii/translation";

import { SuspenseQueryBoundary } from "../SuspenseQueryBoundary";
import { GuideCta } from "./GuideCta/GuideCta";
import { Greeting, Wrapper } from "./Home.styles";
import { QuestionnaireCta } from "./QuestionnaireCta/QuestionnaireCta";
import { QuestionnaireCtaError } from "./QuestionnaireCta/QuestionnaireCtaError";
import { QuestionnaireCtaLoading } from "./QuestionnaireCta/QuestionnaireCtaLoading";
import { REENTRY_VIDEO } from "./ReentryVideo/config";
import { ReentryVideoBanner } from "./ReentryVideo/ReentryVideoBanner/ReentryVideoBanner";
import { ReentryVideoModal } from "./ReentryVideo/ReentryVideoModal/ReentryVideoModal";
import { ResourceCategoryCta } from "./ResourceCategoryCta/ResourceCategoryCta";

export const Home = () => {
  const { t } = useUsMaTranslations();
  const { resident } = useSingleResidentContext();
  const [videoIsOpen, setVideoIsOpen] = useState(false);

  usePageTitle(t(($) => $.reentry.overview.pageTitle));

  const openVideo = () => setVideoIsOpen(true);

  return (
    <Wrapper>
      <ReentryVideoBanner onOpenVideo={openVideo} />

      <Greeting>
        {t(($) => $.reentry.overview.greeting, {
          name: firstNameLastName(resident),
        })}
      </Greeting>

      <SuspenseQueryBoundary
        loadingFallback={<QuestionnaireCtaLoading />}
        errorFallback={QuestionnaireCtaError}
      >
        <QuestionnaireCta />
      </SuspenseQueryBoundary>

      <ResourceCategoryCta />

      <GuideCta onOpenVideo={openVideo} />

      <ReentryVideoModal
        isOpen={videoIsOpen}
        onClose={() => setVideoIsOpen(false)}
        video={REENTRY_VIDEO}
      />
    </Wrapper>
  );
};
