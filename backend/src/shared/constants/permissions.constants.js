const PERMISSIONS = {
  /*
  ==========================
  USERS
  ==========================
  */
  USER_READ: "user:read",
  USER_UPDATE: "user:update",

  /*
  ==========================
  SESSIONS
  ==========================
  */
  SESSION_READ: "session:read",
  SESSION_DELETE: "session:delete",

  /*
  ==========================
  ROLES
  ==========================
  */
  ROLE_READ: "role:read",

  /*
  ==========================
  ORGANIZATIONS
  ==========================
  */
  ORG_CREATE: "org:create",
  ORG_READ: "org:read",
  ORG_UPDATE: "org:update",
  ORG_DELETE: "org:delete",

  ORG_MEMBER_READ: "org_member:read",
  ORG_MEMBER_INVITE: "org_member:invite",
  ORG_MEMBER_UPDATE_ROLE: "org_member:update_role",
  ORG_MEMBER_REMOVE: "org_member:remove",

  /*
  ==========================
  DEPARTMENTS
  ==========================
  */
  DEPARTMENT_CREATE: "department:create",
  DEPARTMENT_READ: "department:read",
  DEPARTMENT_UPDATE: "department:update",
  DEPARTMENT_DELETE: "department:delete",

  DEPARTMENT_MEMBER_ADD: "department_member:add",
  DEPARTMENT_MEMBER_REMOVE: "department_member:remove",

  /*
  ==========================
  TEAMS
  ==========================
  */
  TEAM_CREATE: "team:create",
  TEAM_READ: "team:read",
  TEAM_UPDATE: "team:update",
  TEAM_DELETE: "team:delete",

  TEAM_MEMBER_ADD: "team_member:add",
  TEAM_MEMBER_REMOVE: "team_member:remove",
};

module.exports = PERMISSIONS;