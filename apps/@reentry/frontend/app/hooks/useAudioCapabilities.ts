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

import { useEffect, useState } from "react";

import type { SupportedAudioFormat } from "@/app/types/audio";
import type { AudioCapabilities, MediaDevice } from "@/app/types/recording";
import {
	detectMediaRecorderSupport,
	detectSupportedAudioFormat,
} from "@/app/utils/audioCapabilities";

export const useAudioCapabilities = () => {
	const [hasMediaRecorder, setHasMediaRecorder] = useState<boolean>(false);
	const [supportedFormat, setSupportedFormat] =
		useState<SupportedAudioFormat | null>(null);
	const [microphones, setMicrophones] = useState<MediaDevice[]>([]);

	useEffect(() => {
		const mediaRecorderSupported = detectMediaRecorderSupport();
		const audioFormat = detectSupportedAudioFormat();

		setHasMediaRecorder(mediaRecorderSupported);
		setSupportedFormat(audioFormat);
	}, []);

	useEffect(() => {
		const loadMicrophones = async () => {
			try {
				await navigator.mediaDevices.getUserMedia({ audio: true });
				const devices = await navigator.mediaDevices.enumerateDevices();
				const audioInputs = devices
					.filter((device) => device.kind === "audioinput")
					.map((device) => ({
						deviceId: device.deviceId,
						label:
							device.label || `Microphone ${device.deviceId.slice(0, 8)}...`,
					}));

				setMicrophones(audioInputs);
			} catch (error) {
				console.error("Error accessing microphones:", error);
			}
		};

		loadMicrophones();
	}, []);

	const audioCapabilities: AudioCapabilities = {
		hasMediaRecorder,
		supportedFormat,
		isRecordingSupported: hasMediaRecorder && supportedFormat !== null,
	};

	return {
		...audioCapabilities,
		microphones,
	};
};
