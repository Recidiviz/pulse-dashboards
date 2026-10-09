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

import { act, renderHook } from "@testing-library/react-native";

import { useRecorder } from "../useRecorder.web";

type MockOutput = {
  state: "pending" | "started" | "finalized" | "canceled";
  addAudioTrack: jest.Mock;
  start: jest.Mock;
  finalize: jest.Mock;
  cancel: jest.Mock;
};

const mockOutputs: MockOutput[] = [];
const mockAudioSources: { pause: jest.Mock; resume: jest.Mock }[] = [];
const mockTargets: { buffer: ArrayBuffer | null }[] = [];

jest.mock("@mediabunny/aac-encoder", () => ({
  registerAacEncoder: jest.fn(),
}));

jest.mock("mediabunny", () => ({
  canEncodeAudio: jest.fn().mockResolvedValue(true),
  BufferTarget: jest.fn().mockImplementation(() => {
    const target = { buffer: null };
    mockTargets.push(target);
    return target;
  }),
  Mp4OutputFormat: jest.fn(),
  Quality: jest.fn(),
  MediaStreamAudioTrackSource: jest.fn().mockImplementation(() => {
    const source = { pause: jest.fn(), resume: jest.fn() };
    mockAudioSources.push(source);
    return source;
  }),
  Output: jest.fn().mockImplementation(() => {
    const output: MockOutput = {
      state: "pending",
      addAudioTrack: jest.fn(),
      start: jest.fn(async () => {
        output.state = "started";
      }),
      finalize: jest.fn(async () => {
        output.state = "finalized";
        mockTargets[mockTargets.length - 1].buffer = new ArrayBuffer(8);
      }),
      cancel: jest.fn(async () => {
        output.state = "canceled";
      }),
    };
    mockOutputs.push(output);
    return output;
  }),
}));

const mockTrackStop = jest.fn();
const mockAudioCtxClose = jest.fn();

function stubBrowserApis() {
  const track = { stop: mockTrackStop };
  const stream = {
    getTracks: () => [track],
    getAudioTracks: () => [track],
  };
  Object.defineProperty(global.navigator, "mediaDevices", {
    configurable: true,
    value: { getUserMedia: jest.fn().mockResolvedValue(stream) },
  });

  global.AudioContext = jest.fn().mockImplementation(() => ({
    createMediaStreamSource: () => ({ connect: jest.fn() }),
    createAnalyser: () => ({
      fftSize: 0,
      getFloatTimeDomainData: jest.fn(),
    }),
    close: mockAudioCtxClose,
  })) as unknown as typeof AudioContext;

  global.URL.createObjectURL = jest.fn().mockReturnValue("blob:recording");
  global.URL.revokeObjectURL = jest.fn();
}

const latestOutput = () => mockOutputs[mockOutputs.length - 1];
const latestAudioSource = () => mockAudioSources[mockAudioSources.length - 1];

async function renderStartedRecorder() {
  const hook = renderHook(() => useRecorder());
  await act(() => hook.result.current.start());
  return hook;
}

function advance(ms: number) {
  act(() => {
    jest.advanceTimersByTime(ms);
  });
}

describe("useRecorder (web)", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    mockOutputs.length = 0;
    mockAudioSources.length = 0;
    mockTargets.length = 0;
    stubBrowserApis();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("starts idle with no audio level or duration", () => {
    const { result } = renderHook(() => useRecorder());

    expect(result.current.state).toBe("idle");
    expect(result.current.audioLevel).toBe(0);
    expect(result.current.durationMs).toBe(0);
  });

  it("start grabs the mic, starts the output, and begins timing", async () => {
    const { result } = await renderStartedRecorder();

    expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({
      audio: expect.objectContaining({ channelCount: 1 }),
    });
    expect(latestOutput().addAudioTrack).toHaveBeenCalledWith(
      latestAudioSource(),
    );
    expect(latestOutput().start).toHaveBeenCalled();
    expect(result.current.state).toBe("recording");

    advance(1000);
    expect(result.current.durationMs).toBe(1000);
  });

  it("does not count paused time toward durationMs", async () => {
    const { result } = await renderStartedRecorder();

    advance(1000);
    act(() => result.current.pause());

    expect(result.current.state).toBe("paused");
    expect(latestAudioSource().pause).toHaveBeenCalled();

    advance(5000);
    expect(result.current.durationMs).toBe(1000);

    act(() => result.current.resume());

    expect(result.current.state).toBe("recording");
    expect(latestAudioSource().resume).toHaveBeenCalled();

    advance(500);
    expect(result.current.durationMs).toBe(1500);
  });

  it("pause and resume are no-ops before start", () => {
    const { result } = renderHook(() => useRecorder());

    act(() => result.current.pause());
    expect(result.current.state).toBe("idle");

    act(() => result.current.resume());
    expect(result.current.state).toBe("idle");
  });

  it("stop finalizes the output, releases the mic, and freezes the duration", async () => {
    const { result } = await renderStartedRecorder();
    advance(2000);

    await act(() => result.current.stop());

    expect(latestOutput().finalize).toHaveBeenCalled();
    expect(mockTrackStop).toHaveBeenCalled();
    expect(mockAudioCtxClose).toHaveBeenCalled();
    expect(result.current.state).toBe("idle");
    expect(result.current.audioLevel).toBe(0);

    advance(2000);
    expect(result.current.durationMs).toBe(2000);
  });

  it("getUrl returns a blob URL only after the output is finalized", async () => {
    const { result } = await renderStartedRecorder();
    expect(result.current.getUrl()).toBeNull();

    await act(() => result.current.stop());

    expect(result.current.getUrl()).toBe("blob:recording");
    expect(URL.createObjectURL).toHaveBeenCalledWith(expect.any(Blob));
  });

  it("start → pause → resume → discard cancels the output and releases resources", async () => {
    const { result } = await renderStartedRecorder();
    advance(1000);
    act(() => result.current.pause());
    advance(1000);
    act(() => result.current.resume());
    advance(1000);

    await act(() => result.current.discard());

    expect(latestOutput().cancel).toHaveBeenCalled();
    expect(latestOutput().finalize).not.toHaveBeenCalled();
    expect(mockTrackStop).toHaveBeenCalled();
    expect(mockAudioCtxClose).toHaveBeenCalled();
    expect(result.current.state).toBe("idle");
    expect(result.current.audioLevel).toBe(0);
    expect(result.current.getUrl()).toBeNull();

    advance(1000);
    expect(result.current.durationMs).toBe(2000);
  });

  it("restarting resets the duration and uses a fresh output", async () => {
    const { result } = await renderStartedRecorder();
    advance(3000);
    await act(() => result.current.stop());

    await act(() => result.current.start());

    expect(mockOutputs).toHaveLength(2);
    expect(result.current.durationMs).toBe(0);
    advance(500);
    expect(result.current.durationMs).toBe(500);
  });
});
