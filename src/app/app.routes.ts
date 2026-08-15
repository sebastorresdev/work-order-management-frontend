import { Routes } from '@angular/router';
import { authGuard, noAuthGuard } from './core/guards/auth.guard';
import { permissionGuard } from './core/guards/permission.guard';
import { PERMISSIONS } from './core/constants/permissions';

/**
 * Árbol principal de rutas de la aplicación Angular con carga perezosa (lazy loading) y protección mediante Guards.
 */
export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: '/login' },

  {
    path: 'login',
    canActivate: [noAuthGuard],
    loadComponent: () => import('./features/login/login').then(m => m.Login),
  },

  {
    path: '',
    loadComponent: () => import('./layout/layout').then(m => m.Layout),
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'work-orders', pathMatch: 'full' },

      {
        path: 'roles',
        canActivate: [permissionGuard(PERMISSIONS.Roles.View)],
        loadComponent: () => import('./features/role/pages/role-list/role-list').then(m => m.RoleList)
      },

      {
        path: 'users',
        canActivate: [permissionGuard(PERMISSIONS.Users.View)],
        children: [
          { path: '', loadComponent: () => import('./features/user/pages/user-list/user-list').then(m => m.UserList) },
          { path: 'new', loadComponent: () => import('./features/user/pages/user-form/user-form').then(m => m.UserForm) },
          { path: ':userId', loadComponent: () => import('./features/user/pages/user-form/user-form').then(m => m.UserForm) },
        ]
      },

      {
        path: 'branches',
        canActivate: [permissionGuard(PERMISSIONS.Branches.View)],
        loadComponent: () => import('./features/branch/pages/branch-list/branch-list').then(m => m.BranchList)
      },

      {
        path: 'employees',
        canActivate: [permissionGuard(PERMISSIONS.Employees.View)],
        children: [
          { path: '', loadComponent: () => import('./features/employee/pages/employee-list/employee-list').then(m => m.EmployeeList) },
          { path: 'new', loadComponent: () => import('./features/employee/pages/employee-form/employee-form').then(m => m.EmployeeForm) },
          { path: ':id', loadComponent: () => import('./features/employee/pages/employee-form/employee-form').then(m => m.EmployeeForm) },
        ]
      },

      {
        path: 'work-orders',
        canActivate: [permissionGuard(PERMISSIONS.WorkOrders.View)],
        children: [
          { path: '', loadComponent: () => import('./features/work-orders/pages/work-order-list/work-order-list').then(m => m.WorkOrderList) },
          { path: 'new', canActivate: [permissionGuard(PERMISSIONS.WorkOrders.Create)], loadComponent: () => import('./features/work-orders/pages/work-order-form/work-order-form').then(m => m.WorkOrderForm) }
        ]
      },

      {
        path: 'reports',
        canActivate: [permissionGuard(PERMISSIONS.WorkOrders.View)],
        loadComponent: () => import('./features/reports/reports').then(m => m.ReportsComponent)
      },

      {
        path: '404',
        loadComponent: () =>
          import('./features/errors/not-found/not-found')
            .then(m => m.NotFound),
      },

      {
        path: '403',
        loadComponent: () =>
          import('./features/errors/not-authorized/not-authorized')
            .then(m => m.NotAuthorized),
      },

      { path: '**', redirectTo: '404' },
    ],
  },
];
