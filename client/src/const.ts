const DEFAULT_RETURN_PATH = "/dashboard";

function normalizeReturnPath(returnPath?: string | null) {
  if (!returnPath) {
    return DEFAULT_RETURN_PATH;
  }

  if (!returnPath.startsWith("/") || returnPath.startsWith("//")) {
    return DEFAULT_RETURN_PATH;
  }

  return returnPath;
}

export const getLoginUrl = (
  returnPath?: string,
  options?: { email?: string | null; provider?: string | null },
) => {
  const url = new URL("/api/auth/login", window.location.origin);
  url.searchParams.set("returnPath", normalizeReturnPath(returnPath));

  const email = options?.email?.trim();
  if (email) {
    url.searchParams.set("email", email);
  }

  const provider = options?.provider?.trim();
  if (provider) {
    url.searchParams.set("provider", provider);
  }

  return url.toString();
};
