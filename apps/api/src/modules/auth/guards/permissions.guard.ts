import type { CanActivate, ExecutionContext } from "@nestjs/common";
import { Injectable, ForbiddenException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { PERMISSIONS_KEY } from "../decorators/permissions.decorator";
import type { PermissionSubject, PermissionAction } from "@prisma/client";

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<
      Array<{
        subject: string;
        actions: PermissionAction[];
      }>
    >(PERMISSIONS_KEY, [context.getHandler(), context.getClass()]);

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (user?.isSuperadmin) {
      return true;
    }

    const userPermissions = new Set(
      user?.permissions?.map(
        (p: { subject: PermissionSubject; action: PermissionAction }) =>
          `${p.subject}:${p.action}`,
      ) || [],
    );

    for (const permission of requiredPermissions) {
      const hasPermission = permission.actions.some((action) => {
        return (
          userPermissions.has(`${permission.subject}:${action}`) ||
          userPermissions.has(`${permission.subject}:manage`)
        );
      });

      if (!hasPermission) {
        throw new ForbiddenException(
          `Недостаточно прав: ${permission.subject}:${permission.actions.join("|")}`,
        );
      }
    }

    return true;
  }
}
