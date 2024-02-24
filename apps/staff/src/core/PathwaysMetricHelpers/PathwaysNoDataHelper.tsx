// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2023 Recidiviz, Inc.
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

import { spacing } from "@recidiviz/design-system";
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import styled from "styled-components/macro";

import { ReactComponent as NoDataLogo } from "../../assets/static/images/no_data_logo.svg";
import { StatusMessage } from "../../components/StatusMessage";
import { useCoreStore } from "../CoreStoreProvider";
import { HydratablePathwaysMetric } from "../models/types";

type NoDataHelperProps = {
  metric: HydratablePathwaysMetric;
};

const Wrapper = styled.div`
  align-items: center;
  display: flex;
  height: 100%;
  justify-content: center;
  padding: ${rem(spacing.xxl)};
  width: 100%;

  & > div {
    width: 100%;
  }
`;

const NoData: React.FC = () => {
  const { filtersStore } = useCoreStore();

  return (
    <Wrapper>
      <StatusMessage
        icon={<NoDataLogo />}
        title="No data available"
        subtitle={
          <>
            The criteria you selected may be too narrow.
            <br />
            Try choosing a different set of filters.
          </>
        }
      >
        <button type="button" onClick={filtersStore.resetFilters}>
          Reset filters
        </button>
      </StatusMessage>
    </Wrapper>
  );
};

export const PathwaysNoDataHelper: React.FC<NoDataHelperProps> = observer(
  function NoDataHelper({ metric, children }) {
    if (metric.isEmpty) {
      return <NoData />;
    }
    return <>{children}</>;
  }
);
