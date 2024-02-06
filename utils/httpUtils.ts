import fetch from "node-fetch";

/**
 * Converts an object into a query param string.
 *
 * Array values are spread out into separate params with "[]" appended to the key, e.g.
 *  { items: [1, 2] } would become "items[]=1&items[]=2".
 */
export const formatUrlParams = (params: { [s: string]: unknown }) => {
  const paramList = Object.entries(params)
    .filter(([_, value]) => value !== undefined)
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
    const baseURL = process.env.API_URL;
    const urlPrefix = args.snapshotLinkId ? `/pub/${args.snapshotLinkId}` : "";
    const response = await fetch(baseURL + urlPrefix + url, {
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

export const getFullResponse = async (url: string, args: any, context: any) => {
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
    return response;
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
    const baseURL = process.env.API_URL;
    const urlPrefix = args.snapshotLinkId ? `/pub/${args.snapshotLinkId}` : "";
    const response = await fetch(baseURL + urlPrefix + url, {
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
