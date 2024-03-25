import { ExecuteMeshFn } from "@graphql-mesh/runtime";
import { getExampleQuery, getSampleResponse } from "./utils/ExampleQueryFiles";
import { getMeshInstance } from "./utils/MeshInstance";

import * as httpUtils from "../utils/httpUtils";
jest.mock("../utils/httpUtils");

jest.spyOn(httpUtils, "get");
jest.spyOn(httpUtils, "shouldReadFromNextGen");
jest.spyOn(httpUtils, "postWithCSRF");

beforeEach(() => {
  (httpUtils.postWithCSRF as jest.Mock).mockClear();
  (httpUtils.get as jest.Mock).mockClear();
  (httpUtils.shouldReadFromNextGen as jest.Mock).mockClear();
});

describe.only("BulkDownloadCGOverview Query", () => {
  let execute: ExecuteMeshFn;
  let query: string;

  beforeEach(() => {
    (httpUtils.postWithCSRF as jest.Mock).mockClear();
    (httpUtils.get as jest.Mock).mockClear();
    (httpUtils.shouldReadFromNextGen as jest.Mock).mockClear();
  });

  beforeEach(async () => {
    const mesh$ = await getMeshInstance();
    // Load BulkDownloadCGOverview example query
    ({ execute } = mesh$);
    query = getExampleQuery("bulk-download-cg-overview-query");
  });

  describe("BulkDownloadCGOverview successful response - next gen ON", () => {
    const bulkDownloadCGOverviewResponse = getSampleResponse("cgOverview");
    const nextGenGetResponse = {
      data: {
        consensusGenomes: [
          {
            metrics: {
              coverageDepth: 165.91836734693877,
              totalReads: 127140,
              mappedReads: 9592,
              percentGenomeCalled: 99.8,
              percentIdentity: 100,
              referenceGenomeLength: 7056,
              gcPercent: 43.1,
              refSnps: 0,
              nMissing: 11,
              nAmbiguous: 0,
              nActg: 7042,
            },
            sequencingRead: {
              sample: {
                name: "NO_DELETE_PipelineVz",
              },
            },
            referenceGenome: {
              name: "Rhinovirus C isolate CO03302015 polyprotein mRNA, complete cds\n",
              id: "MG148341.1",
            },
          },
          {
            metrics: {
              coverageDepth: 101.22595656670114,
              totalReads: 127140,
              mappedReads: 9622,
              percentGenomeCalled: 99.8,
              percentIdentity: 100,
              referenceGenomeLength: 11604,
              gcPercent: 50.3,
              refSnps: 0,
              nMissing: 18,
              nAmbiguous: 0,
              nActg: 11581,
            },
            sequencingRead: {
              sample: {
                name: "NO_DELETE_PipelineVz",
              },
            },
            referenceGenome: {
              name: "Chikungunya virus isolate CHIKV/ITA/Lazio-INMI1-2017, complete genome\n",
              id: "MG049915.1",
            },
          },
        ],
      },
    };
    (httpUtils.shouldReadFromNextGen as jest.Mock).mockReturnValueOnce(() =>
      Promise.resolve(true),
    );

    it("should give correct response", async () => {
      (httpUtils.get as jest.Mock).mockImplementation(() => nextGenGetResponse);
      const result = await execute(query, {
        authenticityToken: "authtoken1234",
        downloadType: "consensus_genome_overview",
        includeMetadata: false,
        workflow: "consensus_genome",
        workflowRunIds: [1991, 2007],
        workflowRunIdsStrings: ["1991", "2007"],
      });
      expect(result.data.BulkDownloadCGOverview.cgOverviewRows).toStrictEqual(
        bulkDownloadCGOverviewResponse.cg_overview_rows,
      );
    });
  });
  describe("BulkDownloadCGOverview successful response - next gen OFF", () => {
    const bulkDownloadCGOverviewResponse = getSampleResponse("cgOverview");
    (httpUtils.shouldReadFromNextGen as jest.Mock).mockReturnValueOnce(() =>
      Promise.resolve(false),
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
      expect(result.data.BulkDownloadCGOverview.cgOverviewRows).toStrictEqual(
        bulkDownloadCGOverviewResponse.cg_overview_rows,
      );
    });
  });
});
