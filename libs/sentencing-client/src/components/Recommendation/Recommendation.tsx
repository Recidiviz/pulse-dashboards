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

import { observer } from "mobx-react-lite";
import React from "react";

import { SARDetailsPresenter } from "../../presenters/SARDetailsPresenter";
import { SkippableSection } from "../shared/SkippableSection";
import { SkippableTextArea } from "../shared/SkippableTextArea";

interface RecommendationProps {
  presenter: SARDetailsPresenter;
}

export const Recommendation: React.FC<RecommendationProps> = observer(
  function Recommendation({ presenter }) {
    const {
      communityStrategyRecommendation,
      institutionalStrategyRecommendation,
    } = presenter.SARData ?? {};

    return (
      <SkippableSection
        title="Summarize Recommendation"
        skipped={presenter.recommendationSkipped}
        onSkipChange={(skipped) =>
          presenter.updateFieldSkipped("recommendation", skipped)
        }
      >
        <SkippableTextArea
          label="Community Strategies"
          value={communityStrategyRecommendation ?? null}
          onChange={(value) =>
            presenter.updateCommunityStrategyRecommendation(value)
          }
          placeholder="Please enter a summary of community strategies and family/social support"
          disabled={presenter.recommendationSkipped}
          onLocalChange={() =>
            presenter.markFieldAsEditedLocally("recommendation")
          }
        />
        <SkippableTextArea
          label="Institutional Strategies"
          value={institutionalStrategyRecommendation ?? null}
          onChange={(value) =>
            presenter.updateInstitutionalStrategyRecommendation(value)
          }
          placeholder="Please enter a summary of institutional strategies and programming"
          disabled={presenter.recommendationSkipped}
          onLocalChange={() =>
            presenter.markFieldAsEditedLocally("recommendation")
          }
        />
      </SkippableSection>
    );
  },
);
