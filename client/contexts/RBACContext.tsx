import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth, UserRole } from "./AuthContext";

// =============== RBAC TYPES & INTERFACES ===============

export interface Permission {
  id: string;
  name: string;
  nameArabic?: string;
  resource?: string;
  action?: string;
  description?: string;
  descriptionArabic?: string;
}

export interface Role {
  id: string;
  name: string;
  nameArabic: string;
  description: string;
  descriptionArabic: string;
  level: number; // Hierarchy level (1 = highest authority)
  permissions: Permission[];
  inheritsFrom?: string[]; // Role IDs this role inherits permissions from
  isSystemRole: boolean; // Cannot be deleted/modified
  isActive: boolean;
  color: string; // For UI display
  icon: string;
  maxUsers?: number; // Maximum users that can have this role
  createdAt: string;
  updatedAt: string;
}

export interface RolePermission extends Permission {
  inherited: boolean; // Whether this permission is inherited from another role
  inheritedFrom?: string; // Role ID it's inherited from
  conditions?: {
    timeRestrictions?: {
      allowedHours: { start: string; end: string }[];
      allowedDays: number[]; // 0-6 (Sunday-Saturday)
      timezone: string;
    };
    locationRestrictions?: {
      allowedIPs: string[];
      allowedCountries: string[];
      allowedRegions: string[];
    };
    dataRestrictions?: {
      ownDataOnly: boolean; // Can only access their own data
      regionRestricted: boolean; // Restricted to their region
      cropTypeRestricted: boolean; // Restricted to specific crop types
      seasonRestricted: boolean; // Restricted to current season only
    };
    quotaLimitations?: {
      maxAPICallsPerHour: number;
      maxDataExportPerDay: number;
      maxReportsPerMonth: number;
    };
  };
}

export interface PermissionGroup {
  id: string;
  name: string;
  nameArabic: string;
  description: string;
  descriptionArabic: string;
  permissions: Permission[];
  category: "core" | "dashboard" | "data" | "api" | "admin" | "reporting";
  icon: string;
  order: number;
}

export interface RoleAssignment {
  id: string;
  userId: string;
  roleId: string;
  assignedBy: string;
  assignedAt: string;
  expiresAt?: string;
  isActive: boolean;
  temporaryOverrides?: {
    addedPermissions: Permission[];
    removedPermissions: Permission[];
    reason: string;
    expiresAt: string;
  };
}

export interface AccessRequest {
  id: string;
  userId: string;
  requestedRoleId?: string;
  requestedPermissions?: Permission[];
  currentRoleId: string;
  reason: string;
  reasonArabic: string;
  businessJustification: string;
  requestedBy: string;
  requestedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  status: "pending" | "approved" | "rejected" | "expired";
  reviewComments?: string;
  approvalWorkflow: {
    steps: {
      approverRole: string;
      approverId?: string;
      status: "pending" | "approved" | "rejected";
      approvedAt?: string;
      comments?: string;
    }[];
    currentStep: number;
  };
}

export interface AuditLog {
  id: string;
  action:
    | "role_assigned"
    | "role_removed"
    | "permission_granted"
    | "permission_revoked"
    | "role_created"
    | "role_modified"
    | "role_deleted"
    | "access_granted"
    | "access_denied";
  resourceType: "user" | "role" | "permission" | "system";
  resourceId: string;
  performedBy: string;
  performedAt: string;
  ipAddress: string;
  userAgent: string;
  changes?: {
    before: any;
    after: any;
  };
  reason?: string;
  severity: "low" | "medium" | "high" | "critical";
  category: "security" | "compliance" | "administrative" | "user_action";
}

interface RBACContextType {
  // Role Management
  roles: Role[];
  permissionGroups: PermissionGroup[];
  getRoleById: (roleId: string) => Role | undefined;
  createRole: (
    roleData: Omit<Role, "id" | "createdAt" | "updatedAt">,
  ) => Promise<{ success: boolean; error?: string }>;
  updateRole: (
    roleId: string,
    updates: Partial<Role>,
  ) => Promise<{ success: boolean; error?: string }>;
  deleteRole: (roleId: string) => Promise<{ success: boolean; error?: string }>;

  // Permission Management
  getAllPermissions: () => Permission[];
  getPermissionsByRole: (roleId: string) => RolePermission[];
  addPermissionToRole: (
    roleId: string,
    permission: Permission,
  ) => Promise<{ success: boolean; error?: string }>;
  removePermissionFromRole: (
    roleId: string,
    permissionId: string,
  ) => Promise<{ success: boolean; error?: string }>;

  // User Role Assignment
  assignRole: (
    userId: string,
    roleId: string,
    expiresAt?: string,
  ) => Promise<{ success: boolean; error?: string }>;
  removeRole: (
    userId: string,
    roleId: string,
  ) => Promise<{ success: boolean; error?: string }>;
  getUserRoles: (userId: string) => Role[];

  // Access Control
  checkPermission: (
    permission: string,
    resource?: string,
    conditions?: any,
  ) => boolean;
  checkMultiplePermissions: (permissions: string[]) => {
    [key: string]: boolean;
  };
  canAccessResource: (
    resource: string,
    action: string,
    context?: any,
  ) => boolean;

  // Access Requests
  accessRequests: AccessRequest[];
  requestAccess: (
    request: Omit<
      AccessRequest,
      "id" | "requestedAt" | "status" | "approvalWorkflow"
    >,
  ) => Promise<{ success: boolean; error?: string }>;
  reviewAccessRequest: (
    requestId: string,
    decision: "approved" | "rejected",
    comments?: string,
  ) => Promise<{ success: boolean; error?: string }>;
  getAccessRequestsForApproval: () => AccessRequest[];

  // Audit & Compliance
  auditLogs: AuditLog[];
  logAction: (
    action: AuditLog["action"],
    resourceType: string,
    resourceId: string,
    changes?: any,
    reason?: string,
  ) => void;
  getAuditTrail: (filters?: {
    userId?: string;
    action?: string;
    dateRange?: { start: string; end: string };
  }) => AuditLog[];

  // Role Hierarchy
  getRoleHierarchy: () => { role: Role; children: Role[] }[];
  isRoleHigherThan: (roleA: string, roleB: string) => boolean;
  canManageRole: (managerRole: string, targetRole: string) => boolean;

  // Bulk Operations
  bulkAssignRoles: (
    assignments: { userId: string; roleId: string }[],
  ) => Promise<{ success: number; failed: number; errors: string[] }>;
  bulkRemoveRoles: (
    assignments: { userId: string; roleId: string }[],
  ) => Promise<{ success: number; failed: number; errors: string[] }>;

  // Temporary Permissions
  grantTemporaryPermission: (
    userId: string,
    permission: Permission,
    expiresAt: string,
    reason: string,
  ) => Promise<{ success: boolean; error?: string }>;
  revokeTemporaryPermission: (
    userId: string,
    permissionId: string,
  ) => Promise<{ success: boolean; error?: string }>;

  // Role Analytics
  getRoleStatistics: () => {
    totalRoles: number;
    activeRoles: number;
    totalAssignments: number;
    mostUsedRoles: { role: Role; count: number }[];
    permissionUsage: { permission: Permission; usage: number }[];
  };
}

const RBACContext = createContext<RBACContextType | undefined>(undefined);

export const useRBAC = () => {
  const context = useContext(RBACContext);
  if (context === undefined) {
    throw new Error("useRBAC must be used within an RBACProvider");
  }
  return context;
};

// =============== MOCK DATA ===============

const mockPermissionGroups: PermissionGroup[] = [
  {
    id: "group-dashboard",
    name: "Dashboard Access",
    nameArabic: "الوصول للوحات التحكم",
    description: "Access to various dashboard views",
    descriptionArabic: "الوصول لمختلف واجهات لوحات التحكم",
    category: "dashboard",
    icon: "Layout",
    order: 1,
    permissions: [
      {
        id: "perm-dashboard-farmer",
        name: "View Farmer Dashboard",
        nameArabic: "عرض لوحة الفلاح",
        resource: "dashboard",
        action: "read",
      },
      {
        id: "perm-dashboard-agronomist",
        name: "View Agronomist Dashboard",
        nameArabic: "عرض لوحة الخبير",
        resource: "dashboard",
        action: "read",
      },
      {
        id: "perm-dashboard-admin",
        name: "View Admin Dashboard",
        nameArabic: "عرض لوحة المدير",
        resource: "dashboard",
        action: "read",
      },
    ],
  },
  {
    id: "group-data",
    name: "Data Management",
    nameArabic: "إدارة البيانات",
    description: "Create, read, update, and delete data",
    descriptionArabic: "إنشاء وقراءة وتحديث وحذف البيانات",
    category: "data",
    icon: "Database",
    order: 2,
    permissions: [
      {
        id: "perm-soil-read",
        name: "View Soil Data",
        nameArabic: "عرض بيانات التربة",
        resource: "soil",
        action: "read",
      },
      {
        id: "perm-soil-write",
        name: "Manage Soil Data",
        nameArabic: "إدارة بيانات التربة",
        resource: "soil",
        action: "create",
      },
      {
        id: "perm-crop-read",
        name: "View Crop Data",
        nameArabic: "عرض بيانات المحاصيل",
        resource: "crops",
        action: "read",
      },
      {
        id: "perm-crop-write",
        name: "Manage Crop Data",
        nameArabic: "إدارة بيانات المحاصيل",
        resource: "crops",
        action: "create",
      },
    ],
  },
  {
    id: "group-admin",
    name: "Administration",
    nameArabic: "الإدارة",
    description: "Administrative functions and system management",
    descriptionArabic: "الوظائف الإداري�� وإدارة النظام",
    category: "admin",
    icon: "Settings",
    order: 3,
    permissions: [
      {
        id: "perm-user-manage",
        name: "Manage Users",
        nameArabic: "إدارة المستخدمين",
        resource: "users",
        action: "create",
      },
      {
        id: "perm-role-manage",
        name: "Manage Roles",
        nameArabic: "إدارة الأدوار",
        resource: "roles",
        action: "create",
      },
      {
        id: "perm-system-config",
        name: "System Configuration",
        nameArabic: "إعدادات النظام",
        resource: "system",
        action: "update",
      },
    ],
  },
];

const mockRoles: Role[] = [
  {
    id: "role-farmer",
    name: "Farmer",
    nameArabic: "فلاح",
    description: "Agricultural producer managing their farm operations",
    descriptionArabic: "منتج زراعي يدير عمليات مزرعته",
    level: 5,
    permissions: [
      {
        id: "perm-dashboard-farmer",
        name: "View Farmer Dashboard",
        nameArabic: "عرض لوحة الفلاح",
        resource: "dashboard",
        action: "read",
      },
      {
        id: "perm-soil-read",
        name: "View Soil Data",
        nameArabic: "عرض بيانات التربة",
        resource: "soil",
        action: "read",
      },
      {
        id: "perm-crop-read",
        name: "View Crop Data",
        nameArabic: "عرض بيانات المحاصيل",
        resource: "crops",
        action: "read",
      },
      {
        id: "perm-crop-write",
        name: "Manage Own Crops",
        nameArabic: "إدارة المحاصيل الخاصة",
        resource: "crops",
        action: "create",
      },
    ],
    isSystemRole: true,
    isActive: true,
    color: "#10b981",
    icon: "User",
    createdAt: "2023-01-01T00:00:00Z",
    updatedAt: "2023-01-01T00:00:00Z",
  },
  {
    id: "role-agronomist",
    name: "Agronomist",
    nameArabic: "خبير زراعي",
    description: "Agricultural expert providing consultation and analysis",
    descriptionArabic: "خبير زراعي يقدم الاستشارات والتحليل",
    level: 3,
    permissions: [
      {
        id: "perm-dashboard-agronomist",
        name: "View Agronomist Dashboard",
        nameArabic: "عرض لوحة الخبير",
        resource: "dashboard",
        action: "read",
      },
      {
        id: "perm-soil-read",
        name: "View All Soil Data",
        nameArabic: "عرض جميع بيانات التربة",
        resource: "soil",
        action: "read",
      },
      {
        id: "perm-soil-write",
        name: "Manage Soil Analysis",
        nameArabic: "إدارة تحليل التربة",
        resource: "soil",
        action: "create",
      },
      {
        id: "perm-crop-read",
        name: "View All Crop Data",
        nameArabic: "عرض جميع بيانات المحاصيل",
        resource: "crops",
        action: "read",
      },
      {
        id: "perm-recommendations",
        name: "Provide Recommendations",
        nameArabic: "تقديم التوصيات",
        resource: "recommendations",
        action: "create",
      },
    ],
    isSystemRole: true,
    isActive: true,
    color: "#3b82f6",
    icon: "Award",
    createdAt: "2023-01-01T00:00:00Z",
    updatedAt: "2023-01-01T00:00:00Z",
  },
  {
    id: "role-admin",
    name: "Platform Administrator",
    nameArabic: "مدير المنصة",
    description: "Full system access and administrative privileges",
    descriptionArabic: "وصول كامل للنظام وصلاحيات إدارية",
    level: 1,
    permissions: [
      {
        id: "perm-dashboard-admin",
        name: "View Admin Dashboard",
        nameArabic: "عرض لوحة المدير",
        resource: "dashboard",
        action: "read",
      },
      {
        id: "perm-user-manage",
        name: "Manage Users",
        nameArabic: "إدارة المستخدمين",
        resource: "users",
        action: "create",
      },
      {
        id: "perm-role-manage",
        name: "Manage Roles",
        nameArabic: "إدارة الأدوار",
        resource: "roles",
        action: "create",
      },
      {
        id: "perm-system-config",
        name: "System Configuration",
        nameArabic: "إعداد��ت النظام",
        resource: "system",
        action: "update",
      },
    ],
    isSystemRole: true,
    isActive: true,
    color: "#dc2626",
    icon: "Shield",
    createdAt: "2023-01-01T00:00:00Z",
    updatedAt: "2023-01-01T00:00:00Z",
  },
  {
    id: "role-government",
    name: "Government Official",
    nameArabic: "��سؤول حكومي",
    description: "Government oversight and policy management",
    descriptionArabic: "رقابة حكومية وإدارة السياسات",
    level: 2,
    permissions: [
      {
        id: "perm-dashboard-government",
        name: "View Government Dashboard",
        nameArabic: "عرض لوحة الحكومة",
        resource: "dashboard",
        action: "read",
      },
      {
        id: "perm-policy-manage",
        name: "Manage Policies",
        nameArabic: "إدارة السياسات",
        resource: "policies",
        action: "create",
      },
      {
        id: "perm-compliance-monitor",
        name: "Monitor Compliance",
        nameArabic: "مراقبة الامتثال",
        resource: "compliance",
        action: "read",
      },
      {
        id: "perm-reports-generate",
        name: "Generate Reports",
        nameArabic: "إنشاء التقارير",
        resource: "reports",
        action: "create",
      },
    ],
    isSystemRole: true,
    isActive: true,
    color: "#7c3aed",
    icon: "Flag",
    createdAt: "2023-01-01T00:00:00Z",
    updatedAt: "2023-01-01T00:00:00Z",
  },
];

// =============== RBAC PROVIDER ===============

export const RBACProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user } = useAuth();
  const [roles, setRoles] = useState<Role[]>(mockRoles);
  const [permissionGroups] = useState<PermissionGroup[]>(mockPermissionGroups);
  const [accessRequests, setAccessRequests] = useState<AccessRequest[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Permission checking logic
  const checkPermission = (
    permission: string,
    resource?: string,
    conditions?: any,
  ): boolean => {
    if (!user) return false;

    // Admin has all permissions
    if (user.role === "admin") return true;

    // Check user's permissions
    const hasPermission = user.permissions.some((p) => {
      if (resource) {
        return p.name === permission && p.resource === resource;
      }
      return p.name === permission;
    });

    // Check conditions if specified
    if (hasPermission && conditions) {
      return evaluateConditions(conditions, user);
    }

    return hasPermission;
  };

  const evaluateConditions = (conditions: any, user: any): boolean => {
    // Implement condition evaluation logic
    // For example: time restrictions, location restrictions, etc.
    return true; // Simplified for demo
  };

  const checkMultiplePermissions = (
    permissions: string[],
  ): { [key: string]: boolean } => {
    const result: { [key: string]: boolean } = {};
    permissions.forEach((permission) => {
      result[permission] = checkPermission(permission);
    });
    return result;
  };

  const canAccessResource = (
    resource: string,
    action: string,
    context?: any,
  ): boolean => {
    return checkPermission(`${action}_${resource}`, resource, context);
  };

  const getRoleById = (roleId: string): Role | undefined => {
    return roles.find((role) => role.id === roleId);
  };

  const getAllPermissions = (): Permission[] => {
    return permissionGroups.flatMap((group) => group.permissions);
  };

  const getPermissionsByRole = (roleId: string): RolePermission[] => {
    const role = getRoleById(roleId);
    if (!role) return [];

    return role.permissions.map((permission) => ({
      ...permission,
      inherited: false,
    }));
  };

  const getUserRoles = (userId: string): Role[] => {
    // In a real app, fetch from API
    if (userId === user?.id) {
      return roles.filter((role) => role.name.toLowerCase() === user.role);
    }
    return [];
  };

  const logAction = (
    action: AuditLog["action"],
    resourceType: string,
    resourceId: string,
    changes?: any,
    reason?: string,
  ) => {
    const auditEntry: AuditLog = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      action,
      resourceType: resourceType as any,
      resourceId,
      performedBy: user?.id || "system",
      performedAt: new Date().toISOString(),
      ipAddress: "192.168.1.100", // Would be actual IP in real app
      userAgent: navigator.userAgent,
      changes,
      reason,
      severity:
        action.includes("delete") || action.includes("revoked")
          ? "high"
          : "medium",
      category:
        action.includes("role") || action.includes("permission")
          ? "security"
          : "administrative",
    };

    setAuditLogs((prev) => [auditEntry, ...prev.slice(0, 999)]); // Keep last 1000 entries
  };

  const createRole = async (
    roleData: Omit<Role, "id" | "createdAt" | "updatedAt">,
  ) => {
    try {
      const newRole: Role = {
        ...roleData,
        id: `role-${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setRoles((prev) => [...prev, newRole]);
      logAction("role_created", "role", newRole.id, { role: newRole });

      return { success: true };
    } catch (error) {
      return { success: false, error: "Failed to create role" };
    }
  };

  const updateRole = async (roleId: string, updates: Partial<Role>) => {
    try {
      const existingRole = getRoleById(roleId);
      if (!existingRole) {
        return { success: false, error: "Role not found" };
      }

      if (existingRole.isSystemRole && (updates.name || updates.permissions)) {
        return { success: false, error: "Cannot modify system role" };
      }

      setRoles((prev) =>
        prev.map((role) =>
          role.id === roleId
            ? { ...role, ...updates, updatedAt: new Date().toISOString() }
            : role,
        ),
      );

      logAction("role_modified", "role", roleId, {
        before: existingRole,
        after: updates,
      });

      return { success: true };
    } catch (error) {
      return { success: false, error: "Failed to update role" };
    }
  };

  const deleteRole = async (roleId: string) => {
    try {
      const role = getRoleById(roleId);
      if (!role) {
        return { success: false, error: "Role not found" };
      }

      if (role.isSystemRole) {
        return { success: false, error: "Cannot delete system role" };
      }

      setRoles((prev) => prev.filter((r) => r.id !== roleId));
      logAction("role_deleted", "role", roleId, { role });

      return { success: true };
    } catch (error) {
      return { success: false, error: "Failed to delete role" };
    }
  };

  const assignRole = async (
    userId: string,
    roleId: string,
    expiresAt?: string,
  ) => {
    try {
      // In a real app, this would update the user's roles
      logAction("role_assigned", "user", userId, { roleId, expiresAt });
      return { success: true };
    } catch (error) {
      return { success: false, error: "Failed to assign role" };
    }
  };

  const removeRole = async (userId: string, roleId: string) => {
    try {
      logAction("role_removed", "user", userId, { roleId });
      return { success: true };
    } catch (error) {
      return { success: false, error: "Failed to remove role" };
    }
  };

  const addPermissionToRole = async (
    roleId: string,
    permission: Permission,
  ) => {
    try {
      const role = getRoleById(roleId);
      if (!role) {
        return { success: false, error: "Role not found" };
      }

      if (role.permissions.some((p) => p.id === permission.id)) {
        return { success: false, error: "Permission already exists" };
      }

      setRoles((prev) =>
        prev.map((r) =>
          r.id === roleId
            ? {
                ...r,
                permissions: [...r.permissions, permission],
                updatedAt: new Date().toISOString(),
              }
            : r,
        ),
      );

      logAction("permission_granted", "role", roleId, { permission });

      return { success: true };
    } catch (error) {
      return { success: false, error: "Failed to add permission" };
    }
  };

  const removePermissionFromRole = async (
    roleId: string,
    permissionId: string,
  ) => {
    try {
      const role = getRoleById(roleId);
      if (!role) {
        return { success: false, error: "Role not found" };
      }

      const permission = role.permissions.find((p) => p.id === permissionId);
      if (!permission) {
        return { success: false, error: "Permission not found" };
      }

      setRoles((prev) =>
        prev.map((r) =>
          r.id === roleId
            ? {
                ...r,
                permissions: r.permissions.filter((p) => p.id !== permissionId),
                updatedAt: new Date().toISOString(),
              }
            : r,
        ),
      );

      logAction("permission_revoked", "role", roleId, { permission });

      return { success: true };
    } catch (error) {
      return { success: false, error: "Failed to remove permission" };
    }
  };

  const requestAccess = async (
    request: Omit<
      AccessRequest,
      "id" | "requestedAt" | "status" | "approvalWorkflow"
    >,
  ) => {
    try {
      const newRequest: AccessRequest = {
        ...request,
        id: `req-${Date.now()}`,
        requestedAt: new Date().toISOString(),
        status: "pending",
        approvalWorkflow: {
          steps: [{ approverRole: "admin", status: "pending" }],
          currentStep: 0,
        },
      };

      setAccessRequests((prev) => [newRequest, ...prev]);
      return { success: true };
    } catch (error) {
      return { success: false, error: "Failed to submit access request" };
    }
  };

  const reviewAccessRequest = async (
    requestId: string,
    decision: "approved" | "rejected",
    comments?: string,
  ) => {
    try {
      setAccessRequests((prev) =>
        prev.map((req) =>
          req.id === requestId
            ? {
                ...req,
                status: decision,
                reviewedBy: user?.id,
                reviewedAt: new Date().toISOString(),
                reviewComments: comments,
              }
            : req,
        ),
      );

      logAction("access_granted", "access_request", requestId, {
        decision,
        comments,
      });

      return { success: true };
    } catch (error) {
      return { success: false, error: "Failed to review access request" };
    }
  };

  const getAccessRequestsForApproval = (): AccessRequest[] => {
    return accessRequests.filter((req) => req.status === "pending");
  };

  const getAuditTrail = (filters?: {
    userId?: string;
    action?: string;
    dateRange?: { start: string; end: string };
  }): AuditLog[] => {
    let filteredLogs = auditLogs;

    if (filters?.userId) {
      filteredLogs = filteredLogs.filter(
        (log) => log.performedBy === filters.userId,
      );
    }

    if (filters?.action) {
      filteredLogs = filteredLogs.filter(
        (log) => log.action === filters.action,
      );
    }

    if (filters?.dateRange) {
      const { start, end } = filters.dateRange;
      filteredLogs = filteredLogs.filter(
        (log) => log.performedAt >= start && log.performedAt <= end,
      );
    }

    return filteredLogs;
  };

  const getRoleHierarchy = (): { role: Role; children: Role[] }[] => {
    return roles
      .filter((role) => role.level <= 3) // Top level roles
      .map((role) => ({
        role,
        children: roles.filter(
          (r) => r.level > role.level && r.level <= role.level + 1,
        ),
      }));
  };

  const isRoleHigherThan = (roleA: string, roleB: string): boolean => {
    const roleAData = getRoleById(roleA);
    const roleBData = getRoleById(roleB);

    if (!roleAData || !roleBData) return false;

    return roleAData.level < roleBData.level; // Lower level number = higher authority
  };

  const canManageRole = (managerRole: string, targetRole: string): boolean => {
    return isRoleHigherThan(managerRole, targetRole);
  };

  const bulkAssignRoles = async (
    assignments: { userId: string; roleId: string }[],
  ) => {
    let success = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const assignment of assignments) {
      try {
        const result = await assignRole(assignment.userId, assignment.roleId);
        if (result.success) {
          success++;
        } else {
          failed++;
          errors.push(result.error || "Unknown error");
        }
      } catch (error) {
        failed++;
        errors.push("Assignment failed");
      }
    }

    return { success, failed, errors };
  };

  const bulkRemoveRoles = async (
    assignments: { userId: string; roleId: string }[],
  ) => {
    let success = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const assignment of assignments) {
      try {
        const result = await removeRole(assignment.userId, assignment.roleId);
        if (result.success) {
          success++;
        } else {
          failed++;
          errors.push(result.error || "Unknown error");
        }
      } catch (error) {
        failed++;
        errors.push("Removal failed");
      }
    }

    return { success, failed, errors };
  };

  const grantTemporaryPermission = async (
    userId: string,
    permission: Permission,
    expiresAt: string,
    reason: string,
  ) => {
    try {
      logAction("permission_granted", "user", userId, {
        permission,
        expiresAt,
        reason,
        temporary: true,
      });
      return { success: true };
    } catch (error) {
      return { success: false, error: "Failed to grant temporary permission" };
    }
  };

  const revokeTemporaryPermission = async (
    userId: string,
    permissionId: string,
  ) => {
    try {
      logAction("permission_revoked", "user", userId, {
        permissionId,
        temporary: true,
      });
      return { success: true };
    } catch (error) {
      return { success: false, error: "Failed to revoke temporary permission" };
    }
  };

  const getRoleStatistics = () => {
    const activeRoles = roles.filter((role) => role.isActive);
    const totalAssignments = 100; // Mock number

    const mostUsedRoles = roles
      .map((role) => ({
        role,
        count: Math.floor(Math.random() * 50) + 1,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const allPermissions = getAllPermissions();
    const permissionUsage = allPermissions
      .map((permission) => ({
        permission,
        usage: Math.floor(Math.random() * 100) + 1,
      }))
      .sort((a, b) => b.usage - a.usage);

    return {
      totalRoles: roles.length,
      activeRoles: activeRoles.length,
      totalAssignments,
      mostUsedRoles,
      permissionUsage,
    };
  };

  const value: RBACContextType = {
    roles,
    permissionGroups,
    getRoleById,
    createRole,
    updateRole,
    deleteRole,
    getAllPermissions,
    getPermissionsByRole,
    addPermissionToRole,
    removePermissionFromRole,
    assignRole,
    removeRole,
    getUserRoles,
    checkPermission,
    checkMultiplePermissions,
    canAccessResource,
    accessRequests,
    requestAccess,
    reviewAccessRequest,
    getAccessRequestsForApproval,
    auditLogs,
    logAction,
    getAuditTrail,
    getRoleHierarchy,
    isRoleHigherThan,
    canManageRole,
    bulkAssignRoles,
    bulkRemoveRoles,
    grantTemporaryPermission,
    revokeTemporaryPermission,
    getRoleStatistics,
  };

  return <RBACContext.Provider value={value}>{children}</RBACContext.Provider>;
};
