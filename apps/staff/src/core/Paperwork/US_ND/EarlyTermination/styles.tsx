import styled from "styled-components/macro";

export const FormHeadingMotionSection = styled.section`
  text-align: center;
`;
export const FormHeadingSection = styled.section``;

export const FormHeadingLineItemSuffix = styled.span`
  display: inline-block;
  justify-self: flex-end;
  min-width: 2em;
  padding-left: 0.5em;
`;

export const FormHeadingContainer = styled.article`
  display: flex;
  color: gray;

  ${FormHeadingSection}:first-child {
    width: 200px;
    margin-right: 20px;
  }
  ${FormHeadingSection}:last-child ${FormHeadingLineItemSuffix} {
    display: none;
  }

  & div {
    display: flex;
    justify-content: space-between;
  }

  & div span:first-child {
    flex: 1;
  }
`;
