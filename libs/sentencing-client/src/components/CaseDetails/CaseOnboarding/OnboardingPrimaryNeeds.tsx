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

import * as Styled from "../CaseDetails.styles";
import { Form } from "../Form/Elements/Form";
import { CaseOnboardingTopicProps } from "./types";

export const OnboardingPrimaryNeeds: React.FC<CaseOnboardingTopicProps> =
  observer(function OnboardingPrimaryNeeds({ form, firstName }) {
    return (
      <>
        <Styled.OnboardingHeaderWrapper>
          <Styled.OnboardingHeader>
            Gathering {firstName}&apos;s primary needs help pinpoint the best
            suited community opportunities
          </Styled.OnboardingHeader>
          <Styled.OnboardingDescription>
            We will use this data to generate opportunities for {firstName}.
            It&apos;s ok if you don&apos;t have this information yet. You can
            add it in later.{" "}
          </Styled.OnboardingDescription>
        </Styled.OnboardingHeaderWrapper>
        <Form
          form={form}
          formFields={form.onboardingFields.PRIMARY_NEEDS_FIELD}
        />
      </>
    );
  });
