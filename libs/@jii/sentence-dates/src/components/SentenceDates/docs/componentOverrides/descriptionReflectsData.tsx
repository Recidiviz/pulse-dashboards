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

import { defaultComponents } from "../../../defaultComponents";
import { SentenceDates, SentenceDatesProps } from "../../SentenceDates";
import { SentenceDatesComponents } from "../../types";

const CustomDescription: SentenceDatesComponents["DateDescription"] = ({
  children,
  className,
  datePresenter,
}) => {
  let descriptionText = children;
  // here we are targeting missing dates specifically,
  // but you could define any relevant condition here
  if (!datePresenter.data.date) {
    // realistically you would probably have copy for any date type
    // and handle this more generically using translations, this is just a simplified example
    if (datePresenter.id === "parole_eligibility_date") {
      descriptionText = `You don't have a parole eligibility date. This is likely because
      you are not eligible for parole under the terms of your current sentence.`;
    }
  }

  return (
    // import the default component to avoid reimplementing it
    <defaultComponents.DateDescription
      // passing through required props
      className={className}
      datePresenter={datePresenter}
    >
      {descriptionText}
    </defaultComponents.DateDescription>
  );
};

const render = ({ data, stateCode }: SentenceDatesProps) => {
  return (
    <SentenceDates
      data={data}
      componentOverrides={{
        DateDescription: CustomDescription,
      }}
      stateCode={stateCode}
    />
  );
};

export default render;
