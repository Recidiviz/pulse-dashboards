import { palette, typography } from "@recidiviz/design-system";
import styled from "styled-components/macro";

export const Container = styled.div`
  display: flex;
  flex-direction: row;
  padding: 1.5rem 0;
  gap: 1rem;
`;

export const LargeText = styled.p`
  ${typography.Serif24}
  margin: 1rem 0;
`;

export const SmallText = styled.p`
  ${typography.Body16};
`;

export const XSmallText = styled.p`
  ${typography.Body14};
`;

export const TreatmentEffectSection = styled.div`
  padding: 1rem 1rem;
  position: sticky;
  color: ${palette.pine3};
  background: ${palette.marble5};
  border-radius: 0.5rem;
  &:hover {
    background-color: ${palette.marble4};
  }
  flex: 1;
`;

export const Bounds = styled.span`
  display: flex;
  flex: row;
  align-items: center;
  justify-content: space-between;

  p {
    margin: 0;
    padding: 5px;

    &.number {
      ${typography.Serif24}
    }

    &.text {
      ${typography.Body12}
      margin: 0;
    }
  }
`;

export const ConfidenceIntervalSection = styled.div`
  margin-left: 4.5rem;
  padding: 1rem 1rem;
  position: sticky;
  color: ${palette.pine3};
  background: ${palette.marble5};
  border-radius: 0.5rem;
  &:hover {
    background-color: ${palette.marble4};
  }
`;
