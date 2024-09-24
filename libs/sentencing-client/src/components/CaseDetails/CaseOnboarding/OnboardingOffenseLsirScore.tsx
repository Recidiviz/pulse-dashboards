// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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

import { formatPossessiveName } from "../../../utils/utils";
import * as Styled from "../CaseDetails.styles";
import { Form } from "../Form/Elements/Form";
import { CaseOnboardingTopicProps } from "./types";

export const OnboardingOffenseLsirScoreGenderReportType: React.FC<CaseOnboardingTopicProps> =
  observer(function OnboardingOffenseLsirScore({ form, firstName }) {
    return (
      <>
        <Styled.OnboardingHeaderWrapper>
          <Styled.OnboardingHeader>
            Let&apos;s get some details about {formatPossessiveName(firstName)}{" "}
            case to enhance the historical insights
          </Styled.OnboardingHeader>
        </Styled.OnboardingHeaderWrapper>
        <Form
          form={form}
          formFields={
            form.onboardingFields.OFFENSE_LSIR_SCORE_GENDER_REPORT_TYPE_FIELDS
          }
        />
      </>
    );
  });
