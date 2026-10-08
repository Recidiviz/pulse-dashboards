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

import { checkInQuestionConfig, SupportSystemContact } from "~@jii/configs";
import { useUsNeTranslations } from "~@jii/translation";

import { useResidentGivenNames } from "./hooks/useResidentGivenNames";
import { QuestionScreenProps } from "./types";
import { UsNeCheckInFooter } from "./UsNeCheckInFooter/UsNeCheckInFooter";
import {
  OptionalHint,
  QuestionText,
  QuestionWrapper,
  SupportSystemTable,
  SupportSystemTextEntry,
} from "./UsNeCheckInQuestion.styles";

const SupportSystemPersonRow = ({
  index,
  contact,
  setContact,
}: {
  index: number;
  contact: SupportSystemContact;
  setContact: (contact: SupportSystemContact) => void;
}) => {
  const { t } = useUsNeTranslations();
  const placeholder = t(($) => $.checkIn.supportSystem.placeholder);

  const { name, relationship } = contact;
  const hasName = !!name;

  return (
    <tr>
      <td>
        <SupportSystemTextEntry
          id={`name${index}`}
          placeholder={placeholder}
          value={name}
          onChange={(e) => {
            const newName = e.target.value;
            const newRelationship = newName ? relationship : undefined;
            setContact({ name: newName, relationship: newRelationship });
          }}
        />
      </td>
      <td>
        {hasName ? (
          <SupportSystemTextEntry
            id={`relationship${index}`}
            placeholder={placeholder}
            value={relationship ?? ""}
            onChange={(e) => setContact({ name, relationship: e.target.value })}
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
  saveAnswer,
  saveIsPending,
  footerProps,
}: QuestionScreenProps) => {
  const [contacts, setContacts] = useState<readonly SupportSystemContact[]>([
    { name: "", relationship: undefined },
    { name: "", relationship: undefined },
    { name: "", relationship: undefined },
    { name: "", relationship: undefined },
  ]);
  const nonEmptyContacts = contacts.filter(({ name }) => !!name);

  const { t } = useUsNeTranslations();

  const questionCopy = t(($) => $.checkIn.questions[id], {
    returnObjects: true,
    name: useResidentGivenNames(),
  });

  const isOptional = !!checkInQuestionConfig[id].optional;

  return (
    <>
      <QuestionWrapper>
        <QuestionText>{questionCopy.question}</QuestionText>
        {isOptional && (
          <OptionalHint>
            {t(($) => $.checkIn.questionPage.optional)}
          </OptionalHint>
        )}
        <SupportSystemTable>
          <thead>
            <tr>
              <th>{t(($) => $.checkIn.supportSystem.name)}</th>
              <th>{t(($) => $.checkIn.supportSystem.howDoYouKnowThem)}</th>
            </tr>
          </thead>
          <tbody>
            {contacts.map((contact, i) => (
              <SupportSystemPersonRow
                index={i}
                contact={contact}
                setContact={(contact: SupportSystemContact) => {
                  setContacts(contacts.toSpliced(i, 1, contact));
                }}
              />
            ))}
          </tbody>
        </SupportSystemTable>
      </QuestionWrapper>

      <UsNeCheckInFooter
        onButtonClick={() => {
          saveAnswer(nonEmptyContacts.length > 0 ? nonEmptyContacts : null);
        }}
        isDisabled={
          saveIsPending || (!isOptional && nonEmptyContacts.length === 0)
        }
        {...footerProps}
      />
    </>
  );
};
