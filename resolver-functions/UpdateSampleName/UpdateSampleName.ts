import { postWithCSRF } from "../../utils/httpUtils";

export const UpdateSampleNameResolver = async (root, args, context, info) => {
  const body = {
    field: "name",
    value: args?.input?.value,
  };
  const res = await postWithCSRF({
    url: `/samples/${args.sampleId}/save_metadata`,
    body,
    args,
    context,
  });
  return res;
};
