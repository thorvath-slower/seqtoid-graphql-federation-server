import { ExecuteMeshFn } from "@graphql-mesh/runtime";
import { getMeshInstance } from "./utils/MeshInstance";

import * as httpUtils from "../utils/httpUtils";
import { getExampleQuery } from "./utils/ExampleQueryFiles";
jest.spyOn(httpUtils, "get");

const query = getExampleQuery("samples-query");

beforeEach(() => {
  (httpUtils.get as jest.Mock).mockClear();
});

describe("samples query:", () => {
  let execute: ExecuteMeshFn;

  beforeEach(async () => {
    const mesh$ = await getMeshInstance();
    ({ execute } = mesh$);
  });

  it("Returns empty list", async () => {
    (httpUtils.get as jest.Mock).mockImplementation(() => ({
      workflow_runs: [],
    }));

    const response = await execute(query, {});

    expect(httpUtils.get).toHaveBeenCalledWith({
      url: "/workflow_runs.json?&mode=basic&search=abc",
      args: expect.anything(),
      context: expect.anything(),
    });
    expect(response.data.fedSamples).toHaveLength(0);
  });

  it("Returns IDs", async () => {
    (httpUtils.get as jest.Mock).mockImplementation(() => ({
      workflow_runs: [
        {
          sample: { info: { id: 123 } },
        },
        {
          sample: { info: { id: 456 } },
        },
      ],
    }));

    const result = await execute(query, {});

    const samples = result.data.fedSamples;
    expect(samples).toHaveLength(2);
    expect(samples[0].id).toEqual("123");
    expect(samples[1].id).toEqual("456");
  });
});
