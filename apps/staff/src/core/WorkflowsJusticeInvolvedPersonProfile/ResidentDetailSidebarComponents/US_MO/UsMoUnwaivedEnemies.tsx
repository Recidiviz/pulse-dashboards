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
import { UsMoUnwaivedEnemyInfo } from "../../../../WorkflowsStore";
import {
  DetailsHeading,
  DetailsSubheading,
  SecureDetailsContent,
  SecureDetailsList,
} from "../../styles";

export function UsMoUnwaivedEnemies({
  unwaivedEnemies,
}: {
  unwaivedEnemies: UsMoUnwaivedEnemyInfo[] | undefined;
}): React.ReactElement {
  return (
    <SecureDetailsList>
      <DetailsHeading>Unwaived Enemies</DetailsHeading>
      <SecureDetailsContent>
        {unwaivedEnemies && unwaivedEnemies.length > 0
          ? unwaivedEnemies.map(
              ({
                enemyExternalId,
                enemyHousingUseCode,
                enemyBuildingNumber,
                enemyComplexNumber,
                enemyRoomNumber,
                enemyBedNumber,
              }: UsMoUnwaivedEnemyInfo) => {
                return (
                  <SecureDetailsList key={enemyExternalId}>
                    <DetailsSubheading>
                      DOC ID: #{enemyExternalId}
                    </DetailsSubheading>
                    <SecureDetailsContent>
                      Housing Use Code: <b>{enemyHousingUseCode}</b>
                      <br />
                      Building {enemyBuildingNumber}, Complex{" "}
                      {enemyComplexNumber}, Room {enemyRoomNumber}, Bed{" "}
                      {enemyBedNumber}
                    </SecureDetailsContent>
                  </SecureDetailsList>
                );
              }
            )
          : "None"}
      </SecureDetailsContent>
    </SecureDetailsList>
  );
}
