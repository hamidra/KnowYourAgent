const { AUTH_ENDPOINT, AUTH_REDIRECT_URL } = process.env;

if (!AUTH_ENDPOINT || !AUTH_REDIRECT_URL) {
  throw new Error("AUTH_ENDPOINT or AUTH_REDIRECT_URL is not set");
}

export const getAuthURL = ({
  provider,
  resource,
  udid,
  redirectUrl = AUTH_REDIRECT_URL,
}: {
  provider: string;
  resource?: string;
  udid: string;
  redirectUrl?: string;
}) => {
  const authEndpointURL = new URL(provider, AUTH_ENDPOINT);
  resource && authEndpointURL.searchParams.set("resource", resource);
  authEndpointURL.searchParams.set(
    "redirectUrl",
    encodeURIComponent(redirectUrl),
  );
  authEndpointURL.searchParams.set("udid", encodeURIComponent(udid));
  return authEndpointURL;
};
