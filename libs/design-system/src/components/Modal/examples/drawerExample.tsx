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

import { rem } from "polished";
import { useEffect, useState } from "react";
import ReactModal from "react-modal";
import styled from "styled-components";

import { palette, spacing, typography } from "../../../styles";
import { Button } from "../../Button";
import { DrawerModal } from "../DrawerModal";
import { ModalHeading } from "../Modal";

const Layout = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
`;

const StickyHeader = styled.div`
  align-items: center;
  background: ${palette.white};
  border-bottom: 1px solid ${palette.slate20};
  display: flex;
  flex: 0 0 auto;
  gap: ${rem(spacing.md)};
  justify-content: space-between;
  padding: ${rem(spacing.lg)} ${rem(spacing.xl)};
`;

const ScrollBody = styled.div`
  ${typography.Sans14}
  color: ${palette.slate80};
  flex: 1 1 auto;
  overflow-y: auto;
  padding: ${rem(spacing.xl)};
`;

const StickyFooter = styled.div`
  background: ${palette.white};
  border-top: 1px solid ${palette.slate20};
  display: flex;
  flex: 0 0 auto;
  gap: ${rem(spacing.sm)};
  justify-content: flex-end;
  padding: ${rem(spacing.lg)} ${rem(spacing.xl)};
`;

const Paragraph = styled.p`
  margin: 0 0 ${rem(spacing.md)};
`;

const SAMPLE_PARAGRAPHS = [
  "The quick brown fox jumps over the lazy dog.",
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
  "Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
  "Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.",
  "Nisi ut aliquip ex ea commodo consequat duis aute irure dolor.",
  "In reprehenderit in voluptate velit esse cillum dolore eu fugiat.",
  "Nulla pariatur excepteur sint occaecat cupidatat non proident.",
  "Sunt in culpa qui officia deserunt mollit anim id est laborum.",
  "Curabitur pretium tincidunt lacus nulla gravida orci a odio.",
  "Nullam varius turpis et commodo pharetra est eros bibendum elit.",
  "Nunc euismod scelerisque dui sed bibendum sapien hendrerit eu.",
  "Donec gravida tincidunt nibh ac semper sed pellentesque arcu.",
];

export type DrawerWithFooterExampleArgs = {
  width?: number;
  contentLabel?: string;
};

export default function DrawerWithFooterExample({
  width,
  contentLabel,
}: DrawerWithFooterExampleArgs) {
  const [isOpen, setIsOpen] = useState(false);
  const close = () => setIsOpen(false);

  useEffect(() => {
    ReactModal.setAppElement(
      document.getElementById("storybook-root") ?? document.body,
    );
  }, []);

  return (
    <div style={{ padding: 24 }}>
      <Button kind="primary" onClick={() => setIsOpen(true)}>
        Open drawer
      </Button>
      <DrawerModal
        isOpen={isOpen}
        onRequestClose={close}
        width={width}
        contentLabel={contentLabel}
      >
        <Layout>
          <StickyHeader>
            <ModalHeading style={{ margin: 0 }}>Heading</ModalHeading>
            <Button
              kind="borderless"
              icon="Close"
              iconSize={12}
              onClick={close}
              aria-label="Close"
            />
          </StickyHeader>
          <ScrollBody>
            {SAMPLE_PARAGRAPHS.map((text) => (
              <Paragraph key={text}>{text}</Paragraph>
            ))}
          </ScrollBody>
          <StickyFooter>
            <Button kind="secondary" onClick={close}>
              Cancel
            </Button>
            <Button kind="primary" onClick={close}>
              Save
            </Button>
          </StickyFooter>
        </Layout>
      </DrawerModal>
    </div>
  );
}
