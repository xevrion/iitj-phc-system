export const config = {
  jwt: {
    secret: process.env.JWT_SECRET || "dev-secret-change-in-production",
    expiry: process.env.JWT_EXPIRY || "7d",
  },
  ldap: {
    url: process.env.LDAP_URL || "ldap://127.0.0.1:1389",
    baseDn: process.env.LDAP_BASE_DN || "dc=iitj,dc=ac,dc=in",
    usersOu: process.env.LDAP_USERS_OU || "ou=users",
  },
  nodeEnv: process.env.NODE_ENV || "development",
};
