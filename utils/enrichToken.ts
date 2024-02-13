const getCzidServicesTokenFromCookie = (httpCookieStr: string) => {
  const tokenKeyVal = httpCookieStr
    .split(";")
    .map((keyValStr: string) => keyValStr.split("="))
    .map((keyValArr: [string, string]) => ([
      decodeURIComponent(keyValArr[0].trim()),
      decodeURIComponent(keyValArr[1].trim()),
    ]))
    .find((keyValArr) => keyValArr[0] === "czid_services_token");

  return tokenKeyVal ? tokenKeyVal[1] : null;
}

export interface ResolverContext {
  request: {
    headers: Headers
  }
}

export const getEnrichedToken = async (context: ResolverContext) => {
  const headers = context.request.headers;
  const httpCookieStr = headers.get("cookie");

  const czidServicesToken = getCzidServicesTokenFromCookie(httpCookieStr);

  if (!czidServicesToken) {
    console.error("No czid_services_token found in cookie");
    return;
  }

  try {
    const enrichTokenURL = `${process.env.API_URL}/enrich_token`;
    const enrichedTokenResp = await fetch(enrichTokenURL, {
      method: "GET",
      headers: {
        Cookie: context.request.headers.get("cookie"),
        "Content-Type": "application/json",
        Authorization: `Bearer ${czidServicesToken}`,
      },
    });

    if (enrichedTokenResp.status !== 200) {
      const respJson = await enrichedTokenResp.json();
      console.error("Enrich token request failed", respJson);
      return null;
    } else {
      return (await enrichedTokenResp.json()).token;
    }
  } catch (e) {
    console.error("Error while retrieving enriched token", e);
  }
}
