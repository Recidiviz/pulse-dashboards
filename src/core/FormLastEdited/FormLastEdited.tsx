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
import React from "react";

import { FormBase } from "../../WorkflowsStore/Opportunity/Forms/FormBase";

type FormLastEditedProps = {
  form?: FormBase<any>;
  agencyName: string;
};

export const FormLastEdited: React.FC<FormLastEditedProps> = observer(
  ({ agencyName, form }) => {
    const { formLastUpdated } = form || {};
    if (formLastUpdated) {
      return (
        <>
          Last edited by {formLastUpdated.by}{" "}
          {moment(formLastUpdated.date.seconds * 1000).fromNow()}
        </>
      );
    }
    return (
      <>
        Prefilled with data from {agencyName} on {moment().format("MM-DD-YYYY")}
      </>
    );
  }
);
