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

import { JIIButton, SlateCopy } from "~@jii/common-ui";
import { useUsNeTranslations } from "~@jii/translation";
import { Icon } from "~design-system";

import { useResidentGivenNames } from "../hooks/useResidentGivenNames";
import { InfoBox } from "../styles";
import {
  Heading,
  HeadingGroup,
  IconCircle,
  IconHalo,
  InfoCopy,
  Wrapper,
} from "./UsNeCheckInCompletion.styles";

type UsNeCheckInCompletionProps = {
  onClose: () => void;
};

export const UsNeCheckInCompletion = ({
  onClose,
}: UsNeCheckInCompletionProps) => {
  const { t } = useUsNeTranslations();
  const { heading, subheading, description, close } = t(
    ($) => $.checkIn.completion,
    {
      returnObjects: true,
      name: useResidentGivenNames(),
    },
  );

  return (
    <Wrapper>
      <IconHalo>
        <IconCircle>
          <Icon kind="Check" size={20} />
        </IconCircle>
      </IconHalo>

      <HeadingGroup>
        <Heading>{heading}</Heading>
        <SlateCopy>{subheading}</SlateCopy>
      </HeadingGroup>

      <InfoBox>
        <InfoCopy>{description}</InfoCopy>
      </InfoBox>

      <JIIButton kind="primary" onClick={onClose}>
        {close}
      </JIIButton>
    </Wrapper>
  );
};
