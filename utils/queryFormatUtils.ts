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
  if (fedIndex !== -1 && fedIndex < secondCurlyBracket && fedIndex > firstCurlyBracket) {
    const splitOnFirstFed = [query.substring(0, fedIndex + 4), query.substring(fedIndex + 4)];
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
