import { PERMISSIONS } from '../constants/permissions';
import { MenuGroup } from '../models/menu.types';

/**
 * Configuración estática del árbol de navegación y menús de la aplicación con sus respectivos permisos requeridos.
 */
export const MENU: MenuGroup[] = [
  {
    title: 'Operaciones',
    icon: 'tool',
    children: [
      { label: 'Bandeja Operativa', link: '/backoffice-workbench', permission: PERMISSIONS.WorkOrders.View },
      { label: 'Solicitudes de Venta', link: '/vendedor-requests', permission: PERMISSIONS.WorkOrders.View },
    ]
  },


  {
    title: 'Analítica',
    icon: 'bar-chart',
    children: [
      { label: 'Liquidación y Reportería', link: '/reports', permission: PERMISSIONS.WorkOrders.View },
      { label: 'Matriz de Tarifas', link: '/tariffs', permission: PERMISSIONS.WorkOrders.View },
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
