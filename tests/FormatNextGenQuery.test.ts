import { formatFedQueryForNextGen } from "../utils/queryFormatUtils";

describe("FormatFedQuery:", () => {
  describe("formatFedQuery:", () => {
    it("Removes fed prefix from the top level query", () => {
      expect(
        formatFedQueryForNextGen(
          "query ConsensusGenomeReportQuery($workflowRunId: String) {fedConsensusGenomes(input: { where: { id: { _eq: $workflowRunId }}}) {...}}",
        ),
      ).toBe(
        "query ConsensusGenomeReportQuery($workflowRunId: UUID) {consensusGenomes( where: { id: { _eq: $workflowRunId }}) {...}}",
      );
    });

    it("It does not remove fed from lower in the query", () => {
      expect(
        formatFedQueryForNextGen(
          "query ConsensusGenomeReportQuery($workflowRunId: String) {fedConsensusGenomes(input: { where: { id: { _eq: $workflowRunId }}}) {fedTopLevelName, offed}}",
        ),
      ).toBe(
        "query ConsensusGenomeReportQuery($workflowRunId: UUID) {consensusGenomes( where: { id: { _eq: $workflowRunId }}) {fedTopLevelName, offed}}",
      );
    });

    it("removes the input wrapper from the query variables", () => {
      expect(formatFedQueryForNextGen(`consensusGenomes(input: { where: { id: { _eq: $workflowRunId }}}) {`)).toBe(
        `consensusGenomes( where: { id: { _eq: $workflowRunId }}) {`,
      );
    });
  });
});
