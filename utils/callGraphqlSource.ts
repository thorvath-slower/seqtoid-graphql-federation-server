import { ResolverContext, getEnrichedToken } from "./enrichToken";

export const callGraphqlSource = async (args, context) => {
  const enrichedToken = await getEnrichedToken(context as unknown as ResolverContext);

  // TODO: Implement the actual call to the graphql source, something like the below
  // const resp = await fetch(url, {
  //   method: "POST",
  //   headers: {
  //     Cookie: context.request.headers.get("cookie"),
  //     "Content-Type": "application/json",
  //     Authorization: `Bearer ${enrichedToken}`,
  //   },
  // );
};
