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
              railsSampleId: 1991,
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
              railsSampleId: 2007,
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
  describe("BulkDownloadCGOverview successful response - next gen ON, includeMetadata OFF", () => {
    const bulkDownloadCGOverviewResponse = getSampleResponse("cgOverview");

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
  describe("BulkDownloadCGOverview successful response - next gen ON, includeMetadata ON", () => {
    const bulkDownloadCGOverviewResponse = [
      [
        "Sample Name",
        "Reference Accession",
        "Reference Accession ID",
        "Reference Length",
        "% Genome Called",
        "%id",
        "GC Content",
        "ERCC Reads",
        "Total Reads",
        "Mapped Reads",
        "SNPs",
        "Informative Nucleotides",
        "Missing Bases",
        "Ambiguous Bases",
        "Coverage Depth",
        "Sample Type",
        "Nucleotide Type",
        "Collection Date",
        "Water Control",
        "Collection Location",
      ],
      [
        "NO_DELETE_PipelineVz",
        "Rhinovirus C isolate CO03302015 polyprotein mRNA, complete cds\n",
        "MG148341.1",
        "7056",
        "99.8",
        "100",
        "43.1",
        "0",
        "127140",
        "9592",
        "0",
        "7042",
        "11",
        "0",
        "165.91836734693877",
        "Kidney",
        "DNA",
        "2024-03",
        "No",
        "Los Angeles",
      ],
      [
        "NO_DELETE_PipelineVz",
        "Chikungunya virus isolate CHIKV/ITA/Lazio-INMI1-2017, complete genome\n",
        "MG049915.1",
        "11604",
        "99.8",
        "100",
        "50.3",
        "0",
        "127140",
        "9622",
        "0",
        "11581",
        "18",
        "0",
        "101.22595656670114",
        "CSF",
        "DNA",
        "2020-05",
        "No",
        "California, USA",
      ],
    ];
    const sampleMetadataResponse = {
      sample_metadata: {
        "1991": ["Kidney", "DNA", "2024-03", "No", "Los Angeles"],
        "2007": ["CSF", "DNA", "2020-05", "No", "California, USA"],
        headers: [
          "Sample Type",
          "Nucleotide Type",
          "Collection Date",
          "Water Control",
          "Collection Location",
        ],
      },
    };
    (httpUtils.shouldReadFromNextGen as jest.Mock).mockReturnValueOnce(() =>
      Promise.resolve(true),
    );
    (httpUtils.postWithCSRF as jest.Mock).mockReturnValueOnce(
      sampleMetadataResponse,
    );

    it("should give correct response", async () => {
      (httpUtils.get as jest.Mock).mockImplementation(() => nextGenGetResponse);
      const result = await execute(query, {
        authenticityToken: "authtoken1234",
        downloadType: "consensus_genome_overview",
        includeMetadata: true,
        workflow: "consensus_genome",
        workflowRunIds: [1991, 2007],
        workflowRunIdsStrings: ["1991", "2007"],
      });
      expect(result.data.BulkDownloadCGOverview.cgOverviewRows).toStrictEqual(
        bulkDownloadCGOverviewResponse,
      );
    });
  });
  describe("BulkDownloadCGOverview successful response - next gen OFF", () => {
    const bulkDownloadCGOverviewResponse = getSampleResponse("cgOverview");
    (httpUtils.shouldReadFromNextGen as jest.Mock).mockReturnValueOnce(() =>
      Promise.resolve(false),
    );

    it("should give correct response", async () => {
      (httpUtils.postWithCSRF as jest.Mock).mockReturnValueOnce(
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
