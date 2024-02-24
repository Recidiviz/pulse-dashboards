import { palette, typography } from "@recidiviz/design-system";
import styled from "styled-components/macro";

const responsiveLg = `
  @media screen and (max-width: 1920px) { 
    margin: 0 0 0 3rem;
  }
`;

const responsiveMl = `
  @media screen and (max-width: 1760px) {
    width: 23rem - 2rem;
  }
`;

const responsiveMd = `
  @media screen and (max-width: 1366px) {
    width: 23rem - 5rem;
  }
`;

const responsiveTitleSm = `
  @media screen and (max-width: 1280px) {
    width: 100%;
    margin-right: 0;
    padding: 1rem 2.5rem;
    margin: 0;
    background: ${palette.marble4};
    display: none;
}  
`;

const responsiveDescriptionSm = `
  @media screen and (max-width: 1280px) {
    width: 100%;
    margin-right: 0;
    padding: 1rem 2.5rem;
    margin: 0;
    background: ${palette.marble4};
    padding-bottom: 0;
    max-width: 100%;
  }
`;

export const ImpactLeftPanelContainer = styled.div`
  position: sticky;
  margin: 0 4.5rem;
  top: 64px;
  width: 23rem;

  ${responsiveLg}
  ${responsiveMl}
  ${responsiveMd}
`;

export const ImpactLeftPanelTitle = styled.div`
  ${typography.Serif34};
  color: ${palette.pine3};
  padding-bottom: 1rem;

  ${responsiveTitleSm}
`;

export const ImpactLeftPanelDescription = styled.div`
  ${typography.Body16};
  color: ${palette.slate80};
  max-width: 23rem;

  ${responsiveDescriptionSm}
`;
