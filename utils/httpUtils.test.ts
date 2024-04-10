import { getContext } from "../tests/utils/MockContext";
import { getEnrichedToken } from "./enrichToken";
import * as httpUtils from "./httpUtils";

jest.mock("./enrichToken", () => ({
  getEnrichedToken: jest.fn().mockResolvedValue("mockEnrichedToken"),
}));

beforeEach(() => {
  jest.clearAllMocks();
});

const { get, fetchFromNextGen } = httpUtils;

describe("get", () => {
  let fetchFromNextGenSpy: jest.SpyInstance;

  beforeEach(() => {
    if (fetchFromNextGenSpy) {
      fetchFromNextGenSpy.mockRestore();
    }
  });

  describe("when nextGenEnabled", () => {
    let context: unknown;

    beforeEach(() => {
      context = getContext({ mockHeaderValue: "true" });
    });

    describe("when security token is provided", () => {
      it("calls fetchFromNextGen with security token", async () => {
        fetchFromNextGenSpy = jest.spyOn(httpUtils, "fetchFromNextGen");
        fetchFromNextGenSpy.mockImplementation(() =>
          Promise.resolve({ mockField: "mockValue" }),
        );
        const args = {};
        const serviceType = "entities";
        const securityToken = "mockSecurityToken";

        await get({
          args,
          context,
          serviceType,
          securityToken,
        });

        expect(fetchFromNextGenSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            securityToken,
          }),
        );
      });
    });
  });
});

describe("fetchFromNextGen", () => {
  describe("when security token is provided", () => {
    it("calls nextGen with provided security token ", async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        json: jest.fn().mockResolvedValue({ mockField: "mockValue" }),
      });
      global.fetch = mockFetch;

      const args = {};
      const context = getContext();
      const securityToken = "mockSecurityToken";

      await fetchFromNextGen({
        args,
        context,
        serviceType: "entities",
        securityToken,
      });

      expect(mockFetch).toHaveBeenCalledWith(
        `${process.env.NEXTGEN_ENTITIES_URL}/graphql`,
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: `Bearer ${securityToken}`,
          }),
        }),
      );
    });
  });

  describe("when no security token is provided", () => {
    it("calls Rails to get a token", async () => {
      const mockFetch = jest.fn().mockResolvedValueOnce({
        json: jest.fn().mockResolvedValue({ mockField: "mockValue" }),
      });
      global.fetch = mockFetch;

      const args = {};
      const context = getContext();

      await fetchFromNextGen({
        args,
        context,
        serviceType: "entities",
      });

      expect(getEnrichedToken).toHaveBeenCalled();
    });
  });

  it("throws when NextGen returns errors", async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      json: jest.fn().mockResolvedValue({
        errors: [{ message: "Mock error message" }, { message: "Another one" }],
      }),
    });
    global.fetch = mockFetch;

    expect(async () => {
      await fetchFromNextGen({
        args: {},
        context: getContext(),
        serviceType: "entities",
        securityToken: "mockSecurityToken",
      });
    }).rejects.toThrow(
      "2 error(s) from NextGen: 1. Mock error message 2. Another one",
    );
  });
});
