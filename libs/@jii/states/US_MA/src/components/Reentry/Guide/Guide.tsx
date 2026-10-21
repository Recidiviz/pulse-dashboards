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

import { ComponentType } from "react";
import { useTypedParams } from "react-router-typesafe-routes/dom";

import { NotFound } from "~@jii/common-ui";
import { useScrollToHash } from "~@jii/layout";
import { State } from "~@jii/paths";
import { useUsMaTranslations, UsMaTFunction } from "~@jii/translation";

import { GUIDE_TOPICS } from "../ctaConfigs";
import { GuideTopicSlug } from "../types";
import { Wrapper } from "./Guide.styles";
import { GuideHeader } from "./GuideHeader/GuideHeader";
import { HousingGuide } from "./HousingGuide/HousingGuide";
import { IdDocumentsGuide } from "./IdDocumentsGuide/IdDocumentsGuide";

const GUIDE_PAGES: Record<
  GuideTopicSlug,
  { intro: (t: UsMaTFunction) => string; Content: ComponentType }
> = {
  "id-documents": {
    intro: (t) => t(($) => $.reentry.guide.idDocuments.intro),
    Content: IdDocumentsGuide,
  },
  housing: {
    intro: (t) => t(($) => $.reentry.guide.housing.intro),
    Content: HousingGuide,
  },
};

export const Guide = () => {
  const { t } = useUsMaTranslations();
  const { topicSlug } = useTypedParams(State.Resident.UsMaReentry.Guide);

  useScrollToHash();

  const topic = GUIDE_TOPICS.find(({ slug }) => slug === topicSlug);
  if (!topic) return <NotFound />;

  const { intro, Content } = GUIDE_PAGES[topic.slug];

  return (
    <Wrapper>
      <GuideHeader
        title={topic.label(t)}
        iconSrc={topic.iconSrc}
        intro={intro(t)}
      />
      <Content />
    </Wrapper>
  );
};
