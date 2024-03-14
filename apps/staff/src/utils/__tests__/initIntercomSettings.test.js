const mockIntercomAppId = "some app id";

describe("initIntercomSettings tests", () => {
  const intercom = vi.fn();
  let initIntercomSettings;

  beforeEach(async () => {
    vi.resetModules();
    vi.stubGlobal("Intercom", intercom);
    vi.stubEnv("VITE_INTERCOM_APP_ID", mockIntercomAppId);

    initIntercomSettings = (await import("../initIntercomSettings")).default;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("should set intercom app id and boot hidden intercom with settings", () => {
    initIntercomSettings();

    expect(window.intercomSettings.app_id).toBe(mockIntercomAppId);
    expect(intercom).toHaveBeenCalledWith("boot", {
      app_id: mockIntercomAppId,
      hide_default_launcher: true,
    });
  });
});
