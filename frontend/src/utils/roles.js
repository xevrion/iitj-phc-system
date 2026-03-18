export function getDefaultRouteForRole(role) {
  if (role === "PATIENT") return "/patient";
  return "/unauthorized";
}
