/**
 * Objeto constante que contiene todas las claves de permisos de seguridad utilizadas en el frontend.
 */
export const PERMISSIONS = {
  /**
   * Permisos para el módulo de Roles.
   */
  Roles: {
    View: 'Permissions.Roles.View',
    Create: 'Permissions.Roles.Create',
    Edit: 'Permissions.Roles.Edit',
    Delete: 'Permissions.Roles.Delete',
  },

  /**
   * Permisos para el módulo de Usuarios.
   */
  Users: {
    View: 'Permissions.Users.View',
    Create: 'Permissions.Users.Create',
    Edit: 'Permissions.Users.Edit',
    Delete: 'Permissions.Users.Delete',
  },

  /**
   * Permisos para la vista de Bienvenida.
   */
  Welcome: {
    View: 'Permissions.Welcome.View',
  },

  /**
   * Permisos para el Dashboard.
   */
  Dashboard: {
    View: 'Permissions.Dashboard.View',
  },

  /**
   * Permisos para el módulo de Sedes.
   */
  Branches: {
    View: 'Permissions.Branches.View',
    Create: 'Permissions.Branches.Create',
    Edit: 'Permissions.Branches.Edit',
    Delete: 'Permissions.Branches.Delete',
  },

  /**
   * Permisos para el módulo de Empleados.
   */
  Employees: {
    View: 'Permissions.Employees.View',
    Create: 'Permissions.Employees.Create',
    Edit: 'Permissions.Employees.Edit',
    Delete: 'Permissions.Employees.Delete',
  }
} as const;
