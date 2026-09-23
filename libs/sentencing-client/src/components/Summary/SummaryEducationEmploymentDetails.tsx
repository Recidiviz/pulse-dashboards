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

import { observer } from "mobx-react-lite";
import React from "react";

import { SARDetailsPresenter } from "../../presenters/SARDetailsPresenter";
import { formatBooleanDisplay, formatDateRange } from "../../utils/utils";
import { MissingBadge } from "./MissingBadge";
import * as Styled from "./Summary.styles";

interface SummaryEducationEmploymentDetailsProps {
  presenter: SARDetailsPresenter;
}

export const SummaryEducationEmploymentDetails: React.FC<SummaryEducationEmploymentDetailsProps> =
  observer(function SummaryEducationEmploymentDetails({ presenter }) {
    const sarData = presenter.SARData;
    const { employmentHistories } = presenter;

    return (
      <>
        <div>
          Highest Level of Education:{" "}
          {sarData?.levelOfEducation || <MissingBadge />}
        </div>
        <div>
          Employed at Time of Offense:{" "}
          {sarData?.employedAtOffense !== undefined ? (
            formatBooleanDisplay(sarData.employedAtOffense)
          ) : (
            <MissingBadge />
          )}
        </div>
        {employmentHistories.length > 0 && (
          <Styled.AssessmentTable>
            <Styled.TableHeaderRow>
              <Styled.TableHeaderCell>Name of Employer</Styled.TableHeaderCell>
              <Styled.TableHeaderCell>Start/End Date</Styled.TableHeaderCell>
              <Styled.TableHeaderCell>
                Verified by Report Author
              </Styled.TableHeaderCell>
            </Styled.TableHeaderRow>
            {employmentHistories.map((history) => (
              <Styled.TableDataRow key={history.id}>
                <Styled.TableDataCell>
                  {history.employerName || "—"}
                </Styled.TableDataCell>
                <Styled.TableDataCell>
                  {formatDateRange(history.startDate, history.endDate)}
                </Styled.TableDataCell>
                <Styled.TableDataCell>
                  {formatBooleanDisplay(history.verifiedByReportAuthor)}
                </Styled.TableDataCell>
              </Styled.TableDataRow>
            ))}
          </Styled.AssessmentTable>
        )}
      </>
    );
  });
