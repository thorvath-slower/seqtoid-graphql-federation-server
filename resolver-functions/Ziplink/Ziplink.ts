import { get, shouldReadFromNextGen } from "../../utils/httpUtils";

export const ZiplinkResolver = async (root, args, context, info) => {
  /* --------------------- Next Gen ------------------------- */
  const nextGenEnabled = await shouldReadFromNextGen(context);
  if (nextGenEnabled) {
    const customQuery = `
      query GetZipLink {
        consensusGenomes(where: {producingRunId: {_eq: "${args.workflowRunId}"}}){
          intermediateOutputs {
            downloadLink {
              url
            }
          }
        }
      }
    `;
    const ret = await get({
      args,
      context,
      serviceType: "entities",
      customQuery,
    });
    if (ret.data?.consensusGenomes[0]?.intermediateOutputs?.downloadLink?.url) {
      return {
        url: ret.data.consensusGenomes[0].intermediateOutputs.downloadLink.url,
      };
    } else {
      return {
        url: null,
        error: ret.error,
      };
    }
  }
  /* --------------------- Rails ------------------------- */
  const res = await get({
    url: `/workflow_runs/${args.workflowRunId}/zip_link.json`,
    args,
    context,
    fullResponse: true,
  });
  if (res.status !== 200) {
    return {
      url: null,
      error: res.statusText,
    };
  }
  const url = res.url;
  return {
    url,
  };
};
