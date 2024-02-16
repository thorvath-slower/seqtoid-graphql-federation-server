import fetch from "node-fetch";
import { getEnrichedToken } from "./enrichToken";

/**
 * Converts an object into a query param string.
 *
 * Array values are spread out into separate params with "[]" appended to the key, e.g.
 *  { items: [1, 2] } would become "items[]=1&items[]=2".
 */
export const formatUrlParams = (params: { [s: string]: unknown }) => {
  const paramList = Object.entries(params)
    .filter(([_, value]) => value != null)
    .flatMap(([key, value]) =>
      Array.isArray(value)
        ? value.map((arrayElement) => `${key}[]=${arrayElement}`)
        : [`${key}=${value}`]
    );
  if (paramList.length === 0) {
    return "";
  }
  return "?&" + paramList.join("&");
};

export const get = async (url: string, args: any, context: any) => {
  try {
    let baseURL, urlPrefix;
    const nextGenEnabled = await isNextGenEnabled(context);
    if (nextGenEnabled) {
      // next gen details
      const czidServicesToken = await getEnrichedToken(context);
      const query = context.params.query;
      const response = await fetch(process.env.NEXTGEN_ENTITIES_API_URL, {
        method: "POST",
        headers: {
          Cookie: context.request.headers.get("cookie"),
          "Content-Type": "application/json",
          "X-CSRF-Token": args?.input?.authenticityToken,
          Authorization: `Bearer ${czidServicesToken}`,
        },
        body: JSON.stringify(query),
      });
      return await response.json();
    } else {
      baseURL = process.env.API_URL;
      urlPrefix = args.snapshotLinkId ? `/pub/${args.snapshotLinkId}` : "";
      const response = await fetch(baseURL + urlPrefix + url, {
        method: "GET",
        headers: {
          Cookie: context.request.headers.get("cookie"),
          "Content-Type": "application/json",
        },
      });
      return await response.json();
    }
  } catch (e) {
    return Promise.reject(e.response);
  }
};

export const getFullResponse = async (url: string, args: any, context: any) => {
  try {
    const baseURL = process.env.API_URL;
    const nextGenEnabled = await isNextGenEnabled(context);
    if (nextGenEnabled) {
      // next gen details
      const czidServicesToken = await getEnrichedToken(context);
      const query = context.params.query;
      const response = await fetch(process.env.NEXTGEN_ENTITIES_API_URL, {
        method: "POST",
        headers: {
          Cookie: context.request.headers.get("cookie"),
          "Content-Type": "application/json",
          "X-CSRF-Token": args?.input?.authenticityToken,
          Authorization: `Bearer ${czidServicesToken}`,
        },
        body: JSON.stringify(query),
      });
      return response;
    } else {
      const urlPrefix = args.snapshotLinkId
        ? `/pub/${args.snapshotLinkId}`
        : "";
      const response = await fetch(baseURL + urlPrefix + url, {
        method: "GET",
        headers: {
          Cookie: context.request.headers.get("cookie"),
          "Content-Type": "application/json",
        },
      });
      return response;
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

export const postWithCSRF = async (
  url: string,
  body: any,
  args: any,
  context: any
) => {
  try {
    const nextGenEnabled = await isNextGenEnabled(context);
    if (nextGenEnabled) {
      const czidServicesToken = await getEnrichedToken(context);
      const query = context.params.query;
      const response = await fetch(process.env.NEXTGEN_ENTITIES_API_URL, {
        method: "POST",
        headers: {
          Cookie: context.request.headers.get("cookie"),
          "Content-Type": "application/json",
          "X-CSRF-Token": args?.input?.authenticityToken,
          Authorization: `Bearer ${czidServicesToken}`,
        },
        body: JSON.stringify(query),
      });
      return await response.json();
      // next gen details
    } else {
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
    }
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

export const getFeatureFlags = async (context: any) => {
  try {
    const response = await fetch(process.env.API_URL + "/users/feature_flags", {
      method: "GET",
      headers: {
        Cookie: context.request.headers.get("cookie"),
        "Content-Type": "application/json",
      },
    });
    return await response.json();
  } catch (e) {
    return Promise.reject(e.response);
  }
};

export const getFeatureFlagsFromRequest = (context) => {
  return context.request.headers.get("readFromNextGen");
};

export const isNextGenEnabled = async (context) => {
  let readFromNextGen = getFeatureFlagsFromRequest(context);
  if (readFromNextGen !== null) {
    // if the header is set, return the value
    return readFromNextGen;
  }
  return false;
}
//   try {
//     const featureFlags = await getFeatureFlags(context);
//     const combinedFeatureFlags = featureFlags["launched_feature_list"].concat(
//       featureFlags["allowed_feature_list"]
//     );
//     const nextGenEnabled = combinedFeatureFlags?.includes("next_gen");
//     return nextGenEnabled;
//   } catch (e) {
//     return Promise.reject(e.response);
//   }
// };
