import { Injectable, signal } from '@angular/core';

/**
 * Tipos de temas visuales soportados por la aplicación.
 */
export type ThemeType = 'theme-default' | 'theme-dark';

/**
 * Servicio encargado de la gestión y alternancia del tema visual (Claro / Oscuro) de la aplicación.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  /**
   * Señal reactiva que almacena el tema activo configurado.
   */
  readonly currentTheme = signal<ThemeType>(
    (localStorage.getItem('theme') as ThemeType) || 'theme-default'
  );

  /**
   * Inicializa el tema visual configurado al cargar la aplicación.
   * @returns Promesa resuelta tras aplicar el tema.
   */
  initTheme(): Promise<void> {
    return this.loadTheme(this.currentTheme());
  }

  /**
   * Alterna entre el tema predeterminado y el tema oscuro.
   */
  toggleTheme(): void {
    const nextTheme: ThemeType =
      this.currentTheme() === 'theme-default' ? 'theme-dark' : 'theme-default';
    this.loadTheme(nextTheme);
  }

  /**
   * Carga y aplica dinámicamente la hoja de estilos del tema correspondiente.
   * @param theme Identificador del tema a cargar.
   * @returns Promesa que se resuelve cuando el tema se ha aplicado.
   */
  loadTheme(theme: ThemeType): Promise<void> {
    return new Promise((resolve) => {
      this.currentTheme.set(theme);
      localStorage.setItem('theme', theme);

      // 1. Alternar clase 'dark' en <html> para utilidades dark: de Tailwind CSS
      if (theme === 'theme-dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }

      // 2. Cargar la hoja de estilos de NG-ZORRO usando ruta absoluta /${theme}.css
      const linkId = 'app-theme';
      let link = document.getElementById(linkId) as HTMLLinkElement;
      if (!link) {
        link = document.createElement('link');
        link.id = linkId;
        link.rel = 'stylesheet';
        document.head.appendChild(link);
      }
      link.href = `/${theme}.css`;
      resolve();
    });
  }
}
