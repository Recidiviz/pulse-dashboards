// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

import type { ReactNode } from "react";

import type { components } from "../recidiviz-schema";

export interface Section {
	title: string;
	description: string;
	status?: string;
}

export interface Topic {
	title: string;
	description: string;
	status?: string;
}

export interface SidebarProps {
	topics: Section[];
	currentTopicIndex: number;
	completedSections: string[];
}

export type Message = components["schemas"]["IntakeMessageResponse"] & {
	is_streaming?: boolean;
};

export interface UseChatMessagesResult {
	topicMessages: Message[][];
	currentTopicIndex: number;
	handleSend: (message: string) => void;
	inputValue: string;
	setInputValue: (value: string) => void;
	handleNextTopic: () => void;
}

export interface ChatInputProps {
	inputValue: string;
	onInputChange: (value: string) => void;
	onSend: () => void;
	onKeyPress: (e: React.KeyboardEvent<HTMLInputElement>) => void;
	isPaused?: boolean;
	connectionStatus?: string;
	isDisabled?: boolean;
	conversationEnded?: boolean;
}

export interface ChatMessagesProps {
	messages: Message[];
	isTyping: boolean;
	isLoading?: boolean;
	inputValue: string;
	setInputValue: (value: string) => void;
	handleSend: () => void;
	handleKeyPress: (e: React.KeyboardEvent<HTMLInputElement>) => void;
	isPaused: boolean;
	wsState?: string;
	connectionStatus: string;
	isDisabled: boolean;
	conversationEnded: boolean;
	scrollToBottom?: () => void;
}

export interface SocketProviderProps {
	children: ReactNode;
	clientId: string;
}
