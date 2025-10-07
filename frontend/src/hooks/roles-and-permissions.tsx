
"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

// Define the types for roles and permissions
type Role = 'owner' | 'admin' | 'employee';

interface Permissions {
  canViewDashboard: boolean;
  canManageUsers: boolean;
  canManagePayroll: boolean;
  canViewOwnPayslips: boolean;
}

// Define the context state
interface RolesAndPermissionsState {
  role: Role;
  permissions: Permissions;
  setRole: (role: Role) => void;
}

// Define permission configurations for each role
const permissionConfigs: Record<Role, Permissions> = {
  owner: {
    canViewDashboard: true,
    canManageUsers: true,
    canManagePayroll: true,
    canViewOwnPayslips: true,
  },
  admin: {
    canViewDashboard: true,
    canManageUsers: true,
    canManagePayroll: true,
    canViewOwnPayslips: false,
  },
  employee: {
    canViewDashboard: false,
    canManageUsers: false,
    canManagePayroll: false,
    canViewOwnPayslips: true,
  },
};

// Create the context
const RolesAndPermissionsContext = createContext<RolesAndPermissionsState | undefined>(undefined);

// Create the provider component
export const RolesAndPermissionsProvider = ({ children }: { children: ReactNode }) => {
  const [role, setRole] = useState<Role>('owner'); // Default role
  const [permissions, setPermissions] = useState<Permissions>(permissionConfigs[role]);

  useEffect(() => {
    // Update permissions whenever the role changes
    setPermissions(permissionConfigs[role]);
  }, [role]);

  const value = { role, permissions, setRole };

  return (
    <RolesAndPermissionsContext.Provider value={value}>
      {children}
    </RolesAndPermissionsContext.Provider>
  );
};

// Create a custom hook to use the context
export const useRolesAndPermissions = () => {
  const context = useContext(RolesAndPermissionsContext);
  if (context === undefined) {
    throw new Error('useRolesAndPermissions must be used within a RolesAndPermissionsProvider');
  }
  return context;
};
