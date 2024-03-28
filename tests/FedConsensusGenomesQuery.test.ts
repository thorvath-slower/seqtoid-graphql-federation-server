import { ExecuteMeshFn } from "@graphql-mesh/runtime";
import { getMeshInstance } from "./utils/MeshInstance";
import * as httpUtils from "../utils/httpUtils";
import { getExampleQuery } from "./utils/ExampleQueryFiles";

jest.spyOn(httpUtils, "get");
jest.spyOn(httpUtils, "shouldReadFromNextGen");

beforeEach(() => {
  (httpUtils.get as jest.Mock).mockClear();
});

beforeEach(() => {
  (httpUtils.shouldReadFromNextGen as jest.Mock).mockClear();
});

describe("fedConsensusGenomes DiscoveryView query:", () => {
  const query = getExampleQuery("consensus-genomes-query");
  let execute: ExecuteMeshFn;

  beforeEach(async () => {
    const mesh$ = await getMeshInstance();
    ({ execute } = mesh$);
    (httpUtils.shouldReadFromNextGen as jest.Mock).mockImplementation(
      () => false,
    );
  });

  it("Returns empty list", async () => {
    (httpUtils.get as jest.Mock).mockImplementation(() => ({
      workflow_runs: [],
    }));
    const response = await execute(query, {});
    expect(httpUtils.get).toHaveBeenCalledWith({
      url: "/workflow_runs.json?&mode=basic&search=abc&limit=10000000&offset=0&listAllIds=false",
      args: expect.anything(),
      context: expect.anything(),
    });
    expect(response.data.fedConsensusGenomes).toHaveLength(0);
  });
});

describe("fedConsensusGemomes SampleReport query:", () => {
  let execute: ExecuteMeshFn;
  const query = getExampleQuery("sample-report-consensus-genomes-query");

  beforeEach(async () => {
    const mesh$ = await getMeshInstance();
    ({ execute } = mesh$);
  });

  it("Returns data from next gen", async () => {
    (httpUtils.get as jest.Mock).mockImplementation(() => ({
      data: {
        consensusGenomes: [
          {
            taxon: {
              commonName: "Severe acute respiratory syndrome coronavirus 2",
              id: "018ded47-34ac-7f3a-9dff-a43e5036393a",
            },
            metrics: {
              mappedReads: 47054,
              nActg: 29821,
              nAmbiguous: 0,
              nMissing: 4,
              refSnps: 7,
              percentIdentity: 100,
              gcPercent: 38,
              percentGenomeCalled: 99.7,
              coverageBreadth: 0.9973915660636057,
              coverageDepth: 223.06430792897035,
              coverageTotalLength: 29903,
              coverageViz: [
                [496, 66.697, 1, 1, 0],
                [497, 29.065, 1, 1, 0],
                [498, 17.447, 0.88, 1, 0],
                [499, 0, 0, 1, 0],
              ],
              coverageBinSize: 59.806,
            },
            accession: {
              accessionId: "MN908947.3",
              accessionName:
                "Severe acute respiratory syndrome coronavirus 2 isolate Wuhan-Hu-1, complete genome",
            },
          },
        ],
      },
    }));
    (httpUtils.shouldReadFromNextGen as jest.Mock).mockImplementation(
      () => true,
    );

    const result = await execute(query, { workflowRunId: "abc" });

    expect(result.data.fedConsensusGenomes).toHaveLength(1);
    expect(result.data.fedConsensusGenomes[0]).toEqual(
      expect.objectContaining({
        taxon: {
          commonName: "Severe acute respiratory syndrome coronavirus 2",
          id: "018ded47-34ac-7f3a-9dff-a43e5036393a",
        },
        metrics: {
          mappedReads: 47054,
          nActg: 29821,
          nAmbiguous: 0,
          nMissing: 4,
          refSnps: 7,
          percentIdentity: 100,
          gcPercent: 38,
          percentGenomeCalled: 99.7,
          coverageBreadth: 0.9973915660636057,
          coverageDepth: 223.06430792897035,
          coverageTotalLength: 29903,
          coverageViz: [
            [496, 66.697, 1, 1, 0],
            [497, 29.065, 1, 1, 0],
            [498, 17.447, 0.88, 1, 0],
            [499, 0, 0, 1, 0],
          ],
          coverageBinSize: 59.806,
        },
        accession: {
          accessionId: "MN908947.3",
          accessionName:
            "Severe acute respiratory syndrome coronavirus 2 isolate Wuhan-Hu-1, complete genome",
        },
      }),
    );
  });

  it("Returns data from rails", async () => {
    (httpUtils.shouldReadFromNextGen as jest.Mock).mockImplementation(
      () => false,
    );
    (httpUtils.get as jest.Mock).mockImplementation(() => ({
      coverage_viz: {
        total_length: 7056,
        coverage: [
          [496, 66.697, 1, 1, 0],
          [497, 29.065, 1, 1, 0],
          [498, 17.447, 0.88, 1, 0],
          [499, 0, 0, 1, 0],
        ],
        coverage_bin_size: 14.112,
        max_aligned_length: 7056,
        coverage_depth: 165.91836734693877,
        coverage_breadth: 0.9995748299319728,
      },
      quality_metrics: {
        ercc_mapped_reads: 0,
        mapped_reads: 9592,
        n_actg: 7042,
        n_ambiguous: 0,
        n_missing: 11,
        ref_snps: 0,
        total_reads: 127140,
        percent_identity: 100,
        gc_percent: 43.1,
        percent_genome_called: 99.8,
        reference_genome_length: 7056,
      },
      taxon_info: {
        accession_id: "MG148341.1",
        accession_name:
          "Rhinovirus C isolate CO03302015 polyprotein mRNA, complete cds\n",
        taxon_id: "463676",
        taxon_name: "Rhinovirus C",
      },
    }));
    const result = await execute(query, { workflowRunId: "2794" });
    expect(result.data.fedConsensusGenomes).toHaveLength(1);
    expect(result.data.fedConsensusGenomes[0]).toEqual(
      expect.objectContaining({
        taxon: {
          commonName: "Rhinovirus C",
          id: "463676",
        },
        metrics: {
          mappedReads: 9592,
          nActg: 7042,
          nAmbiguous: 0,
          nMissing: 11,
          refSnps: 0,
          percentIdentity: 100,
          gcPercent: 43.1,
          percentGenomeCalled: 99.8,
          coverageBreadth: 0.9995748299319728,
          coverageDepth: 165.91836734693877,
          coverageTotalLength: 7056,
          coverageViz: [
            [496, 66.697, 1, 1, 0],
            [497, 29.065, 1, 1, 0],
            [498, 17.447, 0.88, 1, 0],
            [499, 0, 0, 1, 0],
          ],
          coverageBinSize: 14.112,
        },
        accession: {
          accessionId: "MG148341.1",
          accessionName:
            "Rhinovirus C isolate CO03302015 polyprotein mRNA, complete cds\n",
        },
      }),
    );
  });
});
