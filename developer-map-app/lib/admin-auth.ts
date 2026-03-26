export function isAdminAuthorized(request: Request) {
  const expected = process.env.ADMIN_API_TOKEN;
  const provided = request.headers.get("x-admin-token");

  if (!expected) {
    return false;
  }

  return provided === expected;
}
