import { palette, typography } from "@recidiviz/design-system";
import styled from "styled-components/macro";

export const ChartTitle = styled.div`
  ${typography.Sans18};
  color: ${palette.pine1};
  margin-bottom: 8px;
`;

export const ChartSubTitle = styled.div`
  ${typography.Sans14};
  font-weight: 600;
  margin-bottom: 8px;
  color: ${palette.slate80};

  span {
    font-weight: 400;
    font-style: italic;
  }
`;
