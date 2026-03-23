import { SetMetadata } from "@nestjs/common";
import type { PermissionSubject, PermissionAction } from "@prisma/client";

export const PERMISSIONS_KEY = "permissions";

type Permission = {
  subject: PermissionSubject;
  action: PermissionAction;
};

export const Permissions = (...permissions: Permission[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
