import { ExecuteMeshFn } from "@graphql-mesh/runtime";
import * as httpUtils from "../../utils/httpUtils";
import { getExampleQuery } from "../../tests/utils/ExampleQueryFiles";
import { getMeshInstance } from "../../tests/utils/MeshInstance";

jest.spyOn(httpUtils, "getFromRails");

beforeEach(() => {
  (httpUtils.getFromRails as jest.Mock).mockClear();
});

describe("SampleForReport query:", () => {
  let execute: ExecuteMeshFn;
  const query = getExampleQuery("sample-for-report-query");

  beforeEach(async () => {
    const mesh$ = await getMeshInstance();
    ({ execute } = mesh$);
  });

  (httpUtils.getFromRails as jest.Mock).mockImplementation(() => ({
    // This is the first response from the rails server
    name: "sample_sars-cov-2_paired_2",
    created_at: "2024-02-29T15:09:07.000-08:00",
    updated_at: "2024-02-29T15:09:11.000-08:00",
    project_id: 1247,
    status: "checked",
    host_genome_id: 1,
    user_id: 345,
    upload_error: null,
    initial_workflow: "consensus-genome",
    project: { id: 1247, name: "ryan-new-project" },
    default_background_id: 93,
    default_pipeline_run_id: null,
    editable: true,
    pipeline_runs: [],
    workflow_runs: [
      {
        id: 7126,
        status: "SUCCEEDED",
        workflow: "consensus-genome",
        wdl_version: "3.5.0",
        executed_at: "2024-02-29T15:09:11.000-08:00",
        deprecated: false,
        input_error: {
          label: "Error label",
          message: "Error message",
        },
        inputs: {
          accession_id: "MN908947.3",
          accession_name:
            "Severe acute respiratory syndrome coronavirus 2 isolate Wuhan-Hu-1, complete genome",
          taxon_id: 2697049,
          taxon_name: "Severe acute respiratory syndrome coronavirus 2",
          technology: "Illumina",
          wetlab_protocol: "artic_v4",
          creation_source: "SARS-CoV-2 Upload",
        },
        parsed_cached_results: {
          coverage_viz: {
            coverage_breadth: 0.9983279269638498,
            coverage_depth: 223.1055746915025,
            max_aligned_length: 29903,
            total_length: 29903,
          },
          quality_metrics: {
            ercc_mapped_reads: 0,
            mapped_reads: 47053,
            n_actg: 29812,
            n_ambiguous: 0,
            n_missing: 41,
            ref_snps: 7,
            total_reads: 47108,
            percent_identity: 100,
            gc_percent: 38,
            percent_genome_called: 99.7,
            reference_genome_length: 29903,
          },
          taxon_info: {
            accession_id: "MN908947.3",
            accession_name:
              "Severe acute respiratory syndrome coronavirus 2 isolate Wuhan-Hu-1, complete genome",
            taxon_id: 2697049,
            taxon_name: "Severe acute respiratory syndrome coronavirus 2",
          },
        },
        run_finalized: true,
      },
    ],
  }));

  it("Responds with data from rails", async () => {
    const result = await execute(query, {
      railsSampleId: "35611",
      snapshotLinkId: "",
    });
    expect(result.data.SampleForReport).toEqual(
      expect.objectContaining({
        id: "35611",
        created_at: "2024-02-29T15:09:07.000-08:00",
        default_background_id: 93,
        default_pipeline_run_id: null,
        editable: true,
        host_genome_id: 1,
        initial_workflow: "consensus-genome",
        name: "sample_sars-cov-2_paired_2",
        pipeline_runs: [],
        project: {
          id: "1247",
          name: "ryan-new-project",
        },
        project_id: 1247,
        railsSampleId: "35611",
        status: "checked",
        updated_at: "2024-02-29T15:09:11.000-08:00",
        upload_error: null,
        user_id: 345,
        workflow_runs: [
          {
            deprecated: false,
            executed_at: "2024-02-29T15:09:11.000-08:00",
            id: "7126",
            input_error: {
              label: "Error label",
              message: "Error message",
            },
            inputs: {
              accession_id: "MN908947.3",
              accession_name:
                "Severe acute respiratory syndrome coronavirus 2 isolate Wuhan-Hu-1, complete genome",
              creation_source: "SARS-CoV-2 Upload",
              ref_fasta: null,
              taxon_id: 2697049,
              taxon_name: "Severe acute respiratory syndrome coronavirus 2",
              technology: "Illumina",
            },
            run_finalized: true,
            status: "SUCCEEDED",
            wdl_version: "3.5.0",
            workflow: "consensus-genome",
          },
        ],
      }),
    );
  });

  // Tests to add:
  // test with snampshotLinkId
  // test for deduplication edge cases
});
