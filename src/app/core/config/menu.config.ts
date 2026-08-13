import { PERMISSIONS } from '../constants/permissions';
import { MenuGroup } from '../models/menu.types';

/**
 * Configuración estática del árbol de navegación y menús de la aplicación con sus respectivos permisos requeridos.
 */
export const MENU: MenuGroup[] = [
  {
    title: 'Dashboard',
    icon: 'dashboard',
    children: [
      { label: 'Welcome', link: '/welcome', permission: PERMISSIONS.Welcome.View },
    ]
  },
  {
    title: 'Operaciones',
    icon: 'tool',
    children: [
      { label: 'Nueva Solicitud (Móvil)', link: '/work-orders/new', permission: PERMISSIONS.WorkOrders.Create },
      { label: 'Solicitudes de Servicio', link: '/work-orders', permission: PERMISSIONS.WorkOrders.View },
    ]
  },
  {
    title: 'Seguridad',
    icon: 'safety',
    children: [
      { label: 'Roles', link: '/roles', permission: PERMISSIONS.Roles.View },
      { label: 'Usuarios', link: '/users', permission: PERMISSIONS.Users.View },
    ]
  },
  {
    title: 'Organización',
    icon: 'bank',
    children: [
      { label: 'Sedes', link: '/branches', permission: PERMISSIONS.Branches.View },
    ]
  },
  {
    title: 'Recursos Humanos',
    icon: 'team',
    children: [
      { label: 'Empleados', link: '/employees', permission: PERMISSIONS.Employees.View },
    ]
  }
] as const;
