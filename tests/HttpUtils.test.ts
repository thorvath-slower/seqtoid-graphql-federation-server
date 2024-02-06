import { formatUrlParams } from "../utils/httpUtils";

describe("HttpUtils:", () => {
  describe("formatUrlParams:", () => {
    it("Returns empty string", () => {
      expect(
        formatUrlParams({
          param1: 123,
          param2: "456",
        })
      ).toBe("?&param1=123&param2=456");
    });

    it("Filters out undefined", () => {
      expect(
        formatUrlParams({
          param1: 123,
          param2: undefined,
          param3: 456,
        })
      ).toBe("?&param1=123&param3=456");
    });

    it("Handles arrays", () => {
      expect(
        formatUrlParams({
          param1: [123, 456],
          param2: [],
        })
      ).toBe("?&param1[]=123&param1[]=456");
    });
  });
});
