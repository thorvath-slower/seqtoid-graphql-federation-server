import { getEnrichedToken } from "./enrichToken";
import { formatFedQueryForNextGen } from "./queryFormatUtils";

export const get = async ({
  url,
  args,
  context,
  serviceType,
  fullResponse,
  customQuery,
  securityToken,
}: {
  url?: string;
  args: any;
  context: any;
  serviceType?: "workflows" | "entities";
  fullResponse?: boolean;
  customQuery?: string;
  securityToken?: string;
}) => {
  try {
    const nextGenEnabled = await shouldReadFromNextGen(context);
    const shouldQueryNextGen = nextGenEnabled && serviceType;
    if (shouldQueryNextGen) {
      return fetchFromNextGen({
        args,
        context,
        serviceType,
        customQuery,
        securityToken,
      });
    } else {
      if (!url) {
        console.error(
          `You must pass a url to call rails. If you meant to call NextGen, set the serviceType. url: ${url}, serviceType: ${serviceType}`,
        );
        throw new Error(
          `You must pass a url to call rails. If you meant to call NextGen, set the serviceType. url: ${url}, serviceType: ${serviceType}`,
        );
      }
      return getFromRails({ url, args, context, fullResponse });
    }
  } catch (e) {
    handleFetchError(e);
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
    handleFetchError(e);
  }
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

/**
 * Gets an enriched token and then makes a call to NextGen.
 *
 * undefined properties in variables will not be sent (due to JSON.stringify() ignoring them).
 */
export const fetchFromNextGen = async ({
  args,
  context,
  serviceType,
  customQuery,
  customVariables,
  securityToken,
}: {
  args;
  context;
  serviceType: "workflows" | "entities";
  customQuery?: string;
  customVariables?: object;
  securityToken?: string;
}) => {
  try {
    const enrichedToken = securityToken || (await getEnrichedToken(context));
    const baseUrl =
      serviceType === "workflows"
        ? process.env.NEXTGEN_WORKFLOWS_URL
        : process.env.NEXTGEN_ENTITIES_URL;
    const formattedQuery = customQuery
      ? customQuery
      : formatFedQueryForNextGen(context.params.query);
    console.log("fetchFromNextGen");
    console.log({ formattedQuery });
    console.log("%j", customVariables);
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

    const responseJson = await response.json();
    if (responseJson.errors?.length) {
      throw new Error(
        `${responseJson.errors.length} error(s) from NextGen: ${responseJson.errors.map((error, i) => `${i + 1}. ${error.message}`).join(" ")}`,
      );
    }
    return responseJson;
  } catch (e) {
    handleFetchError(e);
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
    handleFetchError(e);
  }
};

const checkForLogin = (responseUrl: string | null) => {
  if (responseUrl?.includes("/auth0/refresh_token?mode=login")) {
    throw new Error("You must be logged in to perform this action.");
  }
};

/**
 * Ensures that whatever is thrown will be logged with a stacktrace by wrapping non-Error values in
 * Errors.
 *
 * For whatever reason, Node.js's json() doesn't throw an Error with a stacktrace. In fact, what it
 * throws isn't even instance of Error, but just an object that looks like one.
 */
const handleFetchError = (thrownValue: any): void => {
  if (thrownValue?.name === "SyntaxError") {
    throw new Error(
      `Could not json() deserialize fetch response: ${thrownValue.message}`,
    );
  }

  if (thrownValue instanceof Error) {
    throw thrownValue;
  }

  throw new Error(JSON.stringify(thrownValue));
};
