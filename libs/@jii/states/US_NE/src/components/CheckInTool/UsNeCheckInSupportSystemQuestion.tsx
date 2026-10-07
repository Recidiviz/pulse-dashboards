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

import { CheckInQuestionId } from "~@jii/configs";
import { useUsNeTranslations } from "~@jii/translation";

import { useResidentGivenNames } from "./hooks/useResidentGivenNames";
import {
  QuestionText,
  SupportSystemTable,
  SupportSystemTextEntry,
} from "./UsNeCheckInQuestion.styles";

const SupportSystemPersonRow = ({ index }: { index: number }) => {
  const { t } = useUsNeTranslations();
  const placeholder = t(($) => $.checkIn.supportSystem.placeholder);

  const [name, setName] = useState<string>("");
  const [relationship, setRelationship] = useState<string>("");

  const hasName = name !== "";

  return (
    <tr>
      <td>
        <SupportSystemTextEntry
          id={`name${index}`}
          placeholder={placeholder}
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (e.target.value === "") {
              setRelationship("");
            }
          }}
        />
      </td>
      <td>
        {hasName ? (
          <SupportSystemTextEntry
            id={`name${index}`}
            placeholder={placeholder}
            value={relationship}
            onChange={(e) => setRelationship(e.target.value)}
          />
        ) : (
          <SupportSystemTextEntry disabled value={"—"} />
        )}
      </td>
    </tr>
  );
};

export const UsNeCheckInSupportSystemQuestion = ({
  id,
}: {
  id: CheckInQuestionId;
}) => {
  const { t } = useUsNeTranslations();

  const questionCopy = t(($) => $.checkIn.questions[id], {
    returnObjects: true,
    name: useResidentGivenNames(),
  });

  return (
    <>
      <QuestionText>{questionCopy.question}</QuestionText>
      <SupportSystemTable>
        <thead>
          <tr>
            <th>{t(($) => $.checkIn.supportSystem.name)}</th>
            <th>{t(($) => $.checkIn.supportSystem.howDoYouKnowThem)}</th>
          </tr>
        </thead>
        <tbody>
          <SupportSystemPersonRow index={0} />
          <SupportSystemPersonRow index={1} />
          <SupportSystemPersonRow index={2} />
          <SupportSystemPersonRow index={3} />
        </tbody>
      </SupportSystemTable>
    </>
  );
};
