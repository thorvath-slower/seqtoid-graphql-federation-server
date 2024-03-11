import fetch from "node-fetch";
import { getEnrichedToken } from "./enrichToken";
import { formatFedQueryForNextGen } from "./queryFormatUtils";

export const get = async ({
  url,
  args,
  context,
  serviceType,
  fullResponse,
  customQuery,
}: {
  url?: string;
  args: any;
  context: any;
  serviceType?: "workflows" | "entities";
  fullResponse?: boolean;
  customQuery?: string;
}) => {
  try {
    const nextGenEnabled = await shouldReadFromNextGen(context);
    const shouldQueryNextGen = nextGenEnabled && serviceType;
    if (shouldQueryNextGen) {
      return fetchFromNextGen({
        args,
        context,
        serviceType,
        fullResponse,
        customQuery,
      });
    } else {
      if (!url) {
        console.error("You must pass a url to call rails. If you meant to call NextGen, set the serviceType.");
        throw new Error("You must pass a url to call rails. If you meant to call NextGen, set the serviceType.");
      }
      return getFromRails({ url, args, context, fullResponse });
    }
  } catch (e) {
    return Promise.reject(e.response);
  }
};

export const postWithCSRF = async ({
  url,
  body,
  args,
  context,
}: {
  url: string;
  body: any;
  args: any;
  context: any;
}) => {
  try {
    const response = await fetch(process.env.API_URL + url, {
      method: "POST",
      headers: {
        Cookie: context.request.headers.get("cookie"),
        "Content-Type": "application/json",
        "X-CSRF-Token": args?.input?.authenticityToken,
      },
      body: JSON.stringify(body),
    });
    checkForLogin(response?.url);
    return await response.json();
  } catch (e) {
    return Promise.reject(e.response ? e.response : e);
  }
};

export const notFound = (message: string) => {
  return Promise.reject({
    status: 404,
    message: message,
  });
};

export const getFeatureFlagsFromRequest = context => {
  return context.request.headers.get("x-should-read-from-nextgen");
};

export const shouldReadFromNextGen = async context => {
  let shouldReadFromNextGen = getFeatureFlagsFromRequest(context);
  if (shouldReadFromNextGen === "true") {
    // if the header is set, return the value
    return true;
  }
  return false;
};

export const fetchFromNextGen = async ({
  args,
  context,
  serviceType,
  fullResponse,
  customQuery,
  customVariables,
}: {
  args;
  context;
  serviceType: "workflows" | "entities";
  fullResponse?: boolean;
  customQuery?: string;
  customVariables?: object;
}) => {
  try {
    const enrichedToken = await getEnrichedToken(context);
    const baseUrl =
      serviceType === "workflows"
        ? process.env.NEXTGEN_WORKFLOWS_URL
        : process.env.NEXTGEN_ENTITIES_URL;
    const formattedQuery = customQuery
      ? customQuery
      : formatFedQueryForNextGen(context.params.query);
    console.log(formattedQuery);
    const response = await fetch(`${baseUrl}/graphql`, {
      method: "POST",
      headers: {
        Cookie: context.request.headers.get("cookie"),
        "Content-Type": "application/json",
        "X-CSRF-Token": args?.input?.authenticityToken,
        Authorization: `Bearer ${enrichedToken}`,
      },
      body: JSON.stringify({
        query: formattedQuery,
        variables: customVariables ?? context.params.variables,
      }),
    });
    if (fullResponse === true) {
      return response;
    } else {
      return await response.json();
    }
  } catch (e) {
    return Promise.reject(e.response);
  }
};

export const getFromRails = async ({
  url,
  args,
  context,
  fullResponse,
}: {
  url: string;
  args: any;
  context: any;
  fullResponse?: boolean;
}) => {
  try {
    const baseURL = process.env.API_URL;
    const urlPrefix = args.snapshotLinkId ? `/pub/${args.snapshotLinkId}` : "";

    const response = await fetch(baseURL + urlPrefix + url, {
      method: "GET",
      headers: {
        Cookie: context.request.headers.get("cookie"),
        "Content-Type": "application/json",
      },
    });
    if (fullResponse === true) {
      return response;
    } else {
      return await response.json();
    }
  } catch (e) {
    return Promise.reject(e.response);
  }
};

const checkForLogin = (responseUrl: string | null) => {
  if (responseUrl?.includes("/auth0/refresh_token?mode=login")) {
    throw new Error("You must be logged in to perform this action.");
  }
};
