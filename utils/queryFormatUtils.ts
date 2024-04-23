/** Matches "query" until the first { encountered. */
const QUERY_TO_BRACE_REGEX = /query [\s\S]*?{/;

/**
 *
 * Transforms a query from the Front End one compatible with the Next Gen server
 *   - Removes the fed prefix from the top level query (ie. fedConsensusGenomes to consensusGenomes)
 *   - Removes the input wrapper object from the variables (ie. input: { where: { id: { _eq: $workflowRunId }}} to where: { id: { _eq: $workflowRunId }})
 *   - Swaps any query specific types that are not consistent between the Front End and the Next Gen Server (ie. $workflowRunId: String to $workflowRunId: UUID)
 *       - This is extensible and should be added to as needed
 * @param {String} query
 * @return {String} formattedQuery
 * @example
 * formatFedQueryForNextGen(
 *  "query ConsensusGenomeReportQuery($workflowRunId: String) {fedConsensusGenomes(input: { where: { id: { _eq: $workflowRunId }}}) {...}}"
 * )
 * // returns "query ConsensusGenomeReportQuery($workflowRunId: UUID) {consensusGenomes( where: { id: { _eq: $workflowRunId }}) {...}}"
 *
 */
export const formatFedQueryForNextGen = (query: string): string => {
  let cleanQuery = query;
  // remove fed Prefix
  const firstCurlyBracket = query.indexOf("{");
  const secondCurlyBracket = query.indexOf("{", firstCurlyBracket + 1);
  const fedIndex = query.indexOf("fed");
  if (
    fedIndex !== -1 &&
    fedIndex < secondCurlyBracket &&
    fedIndex > firstCurlyBracket
  ) {
    const splitOnFirstFed = [
      query.substring(0, fedIndex + 4),
      query.substring(fedIndex + 4),
    ];
    const splitQueryOnFed = splitOnFirstFed[0].split("fed");
    const firstLetterLowerCase = splitQueryOnFed[1][0].toLowerCase();
    splitQueryOnFed[1] = splitQueryOnFed[1].slice(1);
    splitQueryOnFed.splice(1, 0, firstLetterLowerCase);
    cleanQuery = splitQueryOnFed.join("").concat(splitOnFirstFed[1]);
  }

  // remove input object from variables
  const finishedQuery = cleanQuery
    .replace("input: {", "")
    .replace("}}", "}")
    // Swaps any inconsistent types
    // (add any additional type switches here)
    .replace("$workflowRunId: String", "$workflowRunId: UUID")
    .replace(/query_fedConsensusGenomes_items/g, "ConsensusGenome");

  return finishedQuery;
};

export const convertValidateConsensusGenomeQuery = (query: string): string => {
  return (
    query
      // Replace Fed variables.
      .replace(QUERY_TO_BRACE_REGEX, "query ($where: WorkflowRunWhereClause) {")
      // Remove fed prefix.
      .replace("fedWorkflowRuns", "workflowRuns")
      // Replace Fed arguments.
      .replace(/input:[\s\S]*?\)/, "where: $where)")
  );
};

export const convertWorkflowRunsQuery = (query: string): string => {
  return (
    query
      // Replace Fed variables.
      .replace(
        QUERY_TO_BRACE_REGEX,
        "query ($where: WorkflowRunWhereClause, $orderBy: [WorkflowRunOrderByClause!]) {",
      )
      // Remove fed prefix.
      .replace("fedWorkflowRuns", "workflowRuns")
      // Replace Fed arguments.
      .replace("input: $input", "where: $where, orderBy: $orderBy")
      // TODO: Make FE do this.
      // Add entityInputs filter (Mesh can't expose nested argument types?).
      .replace(
        "entityInputs",
        `entityInputs(where: 
          { entityType: { _eq: "sequencing_read" }, inputEntityId: { _is_null: false } })`,
      )
  );
};

export const convertAdminSamplesQuery = (query: string): string => {
  return (
    query
      // Replace Fed variables.
      .replace(
        QUERY_TO_BRACE_REGEX,
        `query ($where: SampleWhereClause) {`,
      )
      // Remove fed prefix.
      .replaceAll("adminSamples", "samples")
      // Replace Fed arguments.
      .replace("input: $input", "where: $where")
  );
};

export const convertAdminWorkflowRunsQuery = (query: string): string => {
  return (
    query
      // Replace Fed variables.
      .replace(
        QUERY_TO_BRACE_REGEX,
        `query ($where: WorkflowRunWhereClause) {`,
      )
      // Remove fed prefix.
      .replace("adminWorkflowRuns", "workflowRuns")
      // Replace Fed arguments.
      .replace("input: $input", "where: $where")
  );
};

export const convertSequencingReadsQuery = (query: string): string => {
  // Remove fed prefix.
  query = query.replaceAll("fedSequencingReads", "sequencingReads");

  // Only querying ID.
  if (/{\s*id\s*}/.test(query)) {
    return (
      query
        // Replace Fed variables.
        .replace(
          QUERY_TO_BRACE_REGEX,
          `query ($where: SequencingReadWhereClause, $orderBy: [SequencingReadOrderByClause!]) {`,
        )
        // Replace Fed arguments.
        .replace("input: $input", "where: $where, orderBy: $orderBy")
        // Add railsSampleId field.
        .replace(
          /{\s*id\s*}/,
          `{
             id
             sample {
               railsSampleId
             }
           }`,
        )
    );
  }

  query = query
    // Replace Fed variables.
    .replace(
      QUERY_TO_BRACE_REGEX,
      `query ($where: SequencingReadWhereClause, 
              $orderBy: [SequencingReadOrderByClause!], 
              $limitOffset: LimitOffsetClause, 
              $producingRunIds: [UUID!]) {`,
    )
    // Replace Fed arguments.
    .replace(
      "input: $input",
      "where: $where, orderBy: $orderBy, limitOffset: $limitOffset",
    )
    // TODO: Make FE do this.
    // Add consensusGenomes filter (Mesh can't expose nested argument types?).
    .replace(
      "consensusGenomes",
      "consensusGenomes(where: { producingRunId: { _in: $producingRunIds } })",
    );

  for (const unsupportedField of [
    "nucleicAcid",
    "notes",
    "collectionLocation",
    "sampleType",
    "waterControl",
    "uploadError",
    "ownerUserName",
    /collection {[\s\S]*?}/,
  ]) {
    query = query.replace(unsupportedField, "");
  }

  return query;
};

export const convertConsensusGenomesQuery = (query: string): string => {
  return (
    query
      // Replace Fed variables.
      .replace(
        QUERY_TO_BRACE_REGEX,
        `query ($where: ConsensusGenomeWhereClause, $orderBy: [ConsensusGenomeOrderByClause!]!) {`,
      )
      // Remove fed prefix.
      .replace("fedConsensusGenomes", "consensusGenomes")
      // Replace Fed arguments.
      .replace("input: $input", "where: $where, orderBy: $orderBy")
  );
};
