/**
 * Representa una opción o elemento individual dentro del menú de navegación.
 */
export interface MenuItem {
  /**
   * Texto amigable mostrado en el ítem de menú.
   */
  label: string;

  /**
   * Ruta de navegación de la aplicación vinculada.
   */
  link: string;

  /**
   * Clave opcional del permiso necesario para visualizar este ítem.
   */
  permission?: string;
}

/**
 * Representa un grupo o categoría desplegable del menú con múltiples sub-ítems.
 */
export interface MenuGroup {
  /**
   * Título principal del grupo de menú.
   */
  title: string;

  /**
   * Ícono de NG-ZORRO a renderizar junto al título.
   */
  icon: string;

  /**
   * Lista de opciones o sub-menús contenidos.
   */
  children: MenuItem[];
}
