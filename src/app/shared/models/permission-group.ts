/**
 * Interfaz que representa un ítem individual de permiso en la interfaz de gestión.
 */
export interface PermissionItem {
  /**
   * Clave única del permiso.
   */
  key: string;

  /**
   * Nombre legible para el usuario.
   */
  display: string;

  /**
   * Explicación sobre lo que autoriza este permiso.
   */
  description: string;

  /**
   * Estado de asignación (activado/desactivado).
   */
  granted: boolean;

  /**
   * Origen del permiso: heredado de rol ('Role'), anulación personal ('Override') o nulo.
   */
  source: 'Role' | 'Override' | null;
}

/**
 * Interfaz para agrupar permisos por módulos o componentes funcionales.
 */
export interface PermissionGroup {
  /**
   * Título o categoría del grupo.
   */
  group: string;

  /**
   * Descripción del ámbito del grupo de permisos.
   */
  groupDescription: string;

  /**
   * Colección de permisos pertenecientes al grupo.
   */
  permissions: PermissionItem[];
}
