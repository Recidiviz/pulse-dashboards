// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2022 Recidiviz, Inc.
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
import moment from "moment";
import React, { useEffect, useState } from "react";

import { FormBase } from "../../WorkflowsStore/Opportunity/Forms/FormBase";
import { LastEditedMessagePulse } from "../controls/WorkflowsNotePreview";

type FormLastEditedProps = {
  form?: FormBase<any>;
  agencyName: string;
  dataProviso?: string;
  darkMode?: boolean;
};

export const FormLastEdited: React.FC<FormLastEditedProps> = observer(
  function FormLastEdited({ agencyName, form, dataProviso, darkMode }) {
    const { formLastUpdated } = form || {};
    const [isHighlighted, setIsHighlighted] = useState(false);
    const [intermediateTime, setIntermediateTime] = useState(
      formLastUpdated?.date.seconds,
    );

    const showHighlight =
      formLastUpdated &&
      intermediateTime &&
      intermediateTime - formLastUpdated?.date.seconds !== 0;

    useEffect(() => {
      if (showHighlight) {
        setIsHighlighted(true);
        setIntermediateTime(formLastUpdated?.date.seconds);
        setTimeout(() => {
          setIsHighlighted(false);
        }, 3000);
      }
    }, [formLastUpdated?.date.seconds, showHighlight]);

    if (formLastUpdated) {
      return (
        <>
          Last edited by {formLastUpdated.by}{" "}
          <LastEditedMessagePulse
            darkMode={darkMode}
            isHighlighted={isHighlighted}
          >
            {moment(formLastUpdated.date.seconds * 1000).fromNow()}
          </LastEditedMessagePulse>
        </>
      );
    }
    return (
      <>
        Prefilled with data from {agencyName} on {moment().format("MM-DD-YYYY")}
        . {dataProviso}
      </>
    );
  },
);
