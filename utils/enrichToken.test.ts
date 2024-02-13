import { getEnrichedToken } from "./enrichToken";

describe("getEnrichedToken", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const getContext = (httpCookieStr: string) => {
    const mockedHeaders: unknown = {
      get: jest.fn().mockReturnValue(httpCookieStr),
    };

    return {
      request: {
        headers: mockedHeaders as Headers,
      },
    };
  };

  it("should log an error if czid_services_token is not found in cookie", async () => {
    const httpCookieStr = "key1=val1; key2=val2";
    const context = getContext(httpCookieStr);
    const consoleErrorMock = jest.spyOn(console, "error").mockImplementation();

    await getEnrichedToken(context);
    expect(consoleErrorMock).toHaveBeenCalledWith("No czid_services_token found in cookie");
  });

  it("should log an error if failed to validate token", async () => {
    const httpCookieStr = "czid_services_token=abc123; key1=val1";
    const context = getContext(httpCookieStr);
    const consoleErrorMock = jest.spyOn(console, "error").mockImplementation();

    const mockError = new Error("Failed to validate token");
    global.fetch = jest.fn().mockRejectedValue(mockError);

    await getEnrichedToken(context);
    expect(consoleErrorMock).toHaveBeenCalledWith("Error while retrieving enriched token", mockError);
  });

  it("should return null when the response status is not 200", async () => {
    const httpCookieStr = "czid_services_token=abc123; key2=val2";
    const context = getContext(httpCookieStr);
    const consoleErrorMock = jest.spyOn(console, "error").mockImplementation();
    const mockErrorResp = { errors: ["some error"] };

    global.fetch = jest.fn().mockResolvedValue({
      status: 500,
      json: jest.fn().mockResolvedValue(mockErrorResp),
    });

    const result = await getEnrichedToken(context);
    expect(consoleErrorMock).toHaveBeenCalledWith("Enrich token request failed", mockErrorResp);
    expect(result).toBe(null);
  });

  it("should return the enriched token", async () => {
    const mockCzidServicesToken = "abc123";
    const httpCookieStr = `czid_services_token=${mockCzidServicesToken}; key2=val2`;
    const context = getContext(httpCookieStr);

    const mockEnrichedToken = "enrichedToken";
    const mockFetch = jest.fn().mockResolvedValue({
      status: 200,
      json: jest.fn().mockResolvedValue({ token: mockEnrichedToken }),
    });
    global.fetch = mockFetch

    const result = await getEnrichedToken(context);

    expect(mockFetch).toHaveBeenCalledWith(`${process.env.API_URL}/enrich_token`, {
      method: "GET",
      headers: {
        Cookie: context.request.headers.get("cookie"),
        "Content-Type": "application/json",
        Authorization: `Bearer ${mockCzidServicesToken}`,
      },
    });
    expect(result).toBe(mockEnrichedToken);
  });
});
