export const get = async ({
  url,
  args,
  context,
  fullResponse,
}: {
  url?: string;
  args: any;
  context: any;
  fullResponse?: boolean;
}) => {
  try {
    if (!url) {
      console.error(`You must pass a url to call rails. url: ${url}`);
      throw new Error(`You must pass a url to call rails. url: ${url}`);
    }
    return getFromRails({ url, args, context, fullResponse });
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
    const responseJson = await response.json();
    console.log(
      `Rails POST to ${url} response: ${JSON.stringify(responseJson)}`,
    );
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
