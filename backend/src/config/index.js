export const config = {
  jwt: {
    secret: process.env.JWT_SECRET || "dev-secret-change-in-production",
    expiry: process.env.JWT_EXPIRY || "7d",
  },
  ldap: {
    // TBD-7: LDAP integration details. Set LDAP_URL in env to enable real auth.
    url: process.env.LDAP_URL || null,
    baseDn: process.env.LDAP_BASE_DN || "dc=iitj,dc=ac,dc=in",
  },
  nodeEnv: process.env.NODE_ENV || "development",
};
