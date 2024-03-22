import { ExecuteMeshFn } from "@graphql-mesh/runtime";
import { getExampleQuery, getSampleResponse } from "./utils/ExampleQueryFiles";
import { getMeshInstance } from "./utils/MeshInstance";

import * as httpUtils from "../utils/httpUtils";
jest.mock("../utils/httpUtils");

beforeEach(() => {
  (httpUtils.postWithCSRF as jest.Mock).mockClear();
  (httpUtils.shouldReadFromNextGen as jest.Mock).mockClear();
});

describe.only("BulkDownloadCGOverview Query", () => {
  let execute: ExecuteMeshFn;
  let query: string;

  beforeEach(async () => {
    const mesh$ = await getMeshInstance();
    // Load BulkDownloadCGOverview example query
    ({ execute } = mesh$);
    query = getExampleQuery("bulk-download-cg-overview-query");
  });

  describe("BulkDownloadCGOverview successful response - next gen OFF", () => {
    const bulkDownloadCGOverviewResponse = getSampleResponse("cgOverview");

    (httpUtils.shouldReadFromNextGen as jest.Mock).mockImplementation(
      () => false,
    );

    it("should give correct response", async () => {
      (httpUtils.postWithCSRF as jest.Mock).mockImplementation(
        () => bulkDownloadCGOverviewResponse,
      );
      const result = await execute(query, {
        authenticityToken: "authtoken1234",
        downloadType: "consensus_genome_overview",
        includeMetadata: false,
        workflow: "consensus_genome",
        workflowRunIds: [1991, 2007],
        workflowRunIdsStrings: ["1991", "2007"],
      });
      console.log("result", result);
      expect(result.data.BulkDownloadCGOverview.cgOverviewRows).toStrictEqual(
        bulkDownloadCGOverviewResponse.cg_overview_rows,
      );
    });
  });

  // describe("BulkDownloadCGOverview successful response - next gen ON", () => {
  //   const bulkDownloadCGOverviewResponse = getSampleResponse("cgOverview");

  //   (httpUtils.shouldReadFromNextGen as jest.Mock).mockImplementation(
  //     () => true,
  //   );

  //   it("should give correct response", async () => {
  //     (httpUtils.get as jest.Mock).mockImplementation(
  //       () => bulkDownloadCGOverviewResponse,
  //     );
  //     const result = await execute(query, {
  //       authenticityToken: "authtoken1234",
  //       downloadType: "consensus_genome_overview",
  //       includeMetadata: false,
  //       workflow: "consensus_genome",
  //       workflowRunIds: [1991, 2007],
  //       workflowRunIdsStrings: ["1991", "2007"],
  //     });
  //     console.log("result", result);
  //     expect(result.data.BulkDownloadCGOverview.cgOverviewRows).toStrictEqual(
  //       bulkDownloadCGOverviewResponse.cg_overview_rows,
  //     );
  //   });
  // });
});
