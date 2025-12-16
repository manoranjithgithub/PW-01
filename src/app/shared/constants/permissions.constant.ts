export const PERM = {
  READ: 'read',
  WRITE: 'write',
  DELETE: 'delete',
  ADMIN: 'admin',
  ALL: '*'
};

export type PermissionKey = keyof typeof PERM;
