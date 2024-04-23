import { NextGenEntitiesTypes } from "../../.mesh/sources/NextGenEntities/types";
import { fetchFromNextGen } from "../../utils/httpUtils";
import { convertAdminSamplesQuery } from "../../utils/queryFormatUtils";

export const adminSamplesResolver = async (root, args, context: any, info) => {
  const query = convertAdminSamplesQuery(context.params.query);
  const response = await fetchFromNextGen({
    args,
    context,
    serviceType: "entities",
    customQuery: query,
    customVariables: {
      where: args.input?.where,
    }
  });
  const samples: NextGenEntitiesTypes.Sample[] = response?.data?.samples;
  if (!samples) {
    throw new Error(`Error fetching samples from NextGen: ${JSON.stringify(response)}`);
  }
  return samples;
};