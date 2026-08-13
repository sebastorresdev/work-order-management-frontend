import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
// NG-ZORRO
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzDropdownModule } from 'ng-zorro-antd/dropdown';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzMessageService } from 'ng-zorro-antd/message';
// PROYECTO
import { EmployeeResponse } from '../../models/employee-response';
import { EmployeeService } from '../../services/employee-service';
import { parseApiErrorMessage } from '../../../../shared/utils/api-error.util';
import { DocumentType } from '../../models/document-type';

/**
 * Componente principal para el listado, búsqueda y administración de empleados.
 */
@Component({
  selector: 'app-employee-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzTableModule,
    NzIconModule,
    NzButtonModule,
    NzDropdownModule,
    NzMenuModule,
    NzModalModule,
    NzInputModule,
    NzSpaceModule
  ],
  templateUrl: './employee-list.html',
})
export class EmployeeList implements OnInit {
  /**
   * Servicio de empleados.
   */
  private _employeeService = inject(EmployeeService);

  /**
   * Servicio de notificaciones.
   */
  private _messageService = inject(NzMessageService);

  /**
   * Servicio de modales.
   */
  private _modalService = inject(NzModalService);

  /**
   * Enrutador para navegación.
   */
  private _router = inject(Router);

  /**
   * Señal reactiva con todos los empleados.
   */
  allEmployees = signal<EmployeeResponse[]>([]);

  /**
   * Señal reactiva con el texto del buscador.
   */
  search = signal('');

  /**
   * Propiedad computada para filtrar empleados por nombre, código o número de documento.
   */
  filteredEmployees = computed(() => {
    const term = this.search().toLowerCase().trim();
    if (!term) return this.allEmployees();
    return this.allEmployees().filter(r => 
      r.firstName.toLowerCase().includes(term) || 
      r.lastName.toLowerCase().includes(term) || 
      r.code.toLowerCase().includes(term) ||
      r.documentNumber.toLowerCase().includes(term)
    );
  });

  /**
   * Estado de selección completa.
   */
  checked = false;

  /**
   * Estado de selección indeterminada.
   */
  indeterminate = false;

  /**
   * Datos de la página actual de la tabla.
   */
  listOfCurrentPageData: readonly EmployeeResponse[] = [];

  /**
   * Conjunto de IDs seleccionados.
   */
  setOfCheckedId = new Set<string>();

  /**
   * Inicializa el componente y carga la lista de empleados.
   */
  ngOnInit(): void {
    this.loadEmployees();
  }

  /**
   * Carga los empleados llamando al servicio.
   */
  loadEmployees(): void {
    this._employeeService.getAll().subscribe({
      next: (data) => this.allEmployees.set(data),
      error: (error) => {
        console.error('Error loading employees', error);
        this._messageService.error('No se pudieron cargar los empleados');
      },
    });
  }

  /**
   * Redirige al formulario de registro de un nuevo empleado.
   */
  navigateToNew(): void {
    this._router.navigate(['/employees/new']);
  }

  /**
   * Redirige al formulario de edición del empleado.
   * @param employee Empleado a editar.
   */
  navigateToEdit(employee: EmployeeResponse): void {
    this._router.navigate(['/employees', employee.id]);
  }

  /**
   * Convierte la enumeración del tipo de documento a su etiqueta amigable.
   * @param type Tipo de documento.
   * @returns Cadena con el texto representativo.
   */
  getDocumentTypeName(type: DocumentType): string {
    switch (type) {
      case DocumentType.Dni: return 'DNI';
      case DocumentType.Ce: return 'CE';
      case DocumentType.Passport: return 'Pasaporte';
      default: return 'Desconocido';
    }
  }

  /**
   * Actualiza el conjunto de casillas marcadas.
   * @param id ID del empleado.
   * @param checked Estado.
   */
  updateCheckedSet(id: string, checked: boolean): void {
    if (checked) {
      this.setOfCheckedId.add(id);
    } else {
      this.setOfCheckedId.delete(id);
    }
  }

  /**
   * Actualiza la selección de un elemento individual.
   * @param id ID del empleado.
   * @param checked Estado seleccionado.
   */
  onItemChecked(id: string, checked: boolean): void {
    this.updateCheckedSet(id, checked);
    this.refreshCheckedStatus();
  }

  /**
   * Selecciona o deselecciona todos los elementos visibles de la tabla.
   * @param value Estado global.
   */
  onAllChecked(value: boolean): void {
    this.listOfCurrentPageData.forEach((item) => this.updateCheckedSet(item.id, value));
    this.refreshCheckedStatus();
  }

  /**
   * Maneja el cambio de datos de la página actual.
   * @param data Lista de empleados en la página.
   */
  onCurrentPageDataChange(data: readonly EmployeeResponse[]): void {
    this.listOfCurrentPageData = data;
    this.refreshCheckedStatus();
  }

  /**
   * Actualiza la bandera checked e indeterminate.
   */
  refreshCheckedStatus(): void {
    this.checked = this.listOfCurrentPageData.length > 0 && this.listOfCurrentPageData.every((item) => this.setOfCheckedId.has(item.id));
    this.indeterminate =
      this.listOfCurrentPageData.some((item) => this.setOfCheckedId.has(item.id)) && !this.checked;
  }

  /**
   * Muestra la confirmación para eliminar un empleado individual.
   * @param employee Empleado a eliminar.
   */
  showDeleteConfirm(employee: EmployeeResponse): void {
    this._modalService.confirm({
      nzTitle: `¿Estás seguro de que quieres eliminar al empleado '${employee.firstName} ${employee.lastName}'?`,
      nzOkText: 'Confirmar',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzOnOk: () => {
        this._employeeService.delete(employee.id).subscribe({
          next: () => {
            this._messageService.success(`Empleado eliminado`);
            this.setOfCheckedId.delete(employee.id);
            this.refreshCheckedStatus();
            this.loadEmployees();
          },
          error: (err) => {
            console.error('Error deleting employee', err);
            const errorMessage = parseApiErrorMessage(err);
            this._messageService.error(errorMessage);
          },
        });
      },
      nzCancelText: 'Cancelar',
    });
  }

  /**
   * Muestra la confirmación para eliminar empleados seleccionados.
   */
  showDeleteSelectedConfirm(): void {
    this._modalService.confirm({
      nzTitle: `¿Estás seguro de que quieres eliminar ${this.setOfCheckedId.size} empleado(s)?`,
      nzOkText: 'Confirmar',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzOnOk: () => this.deleteSelected(),
      nzCancelText: 'Cancelar',
    });
  }

  /**
   * Ejecuta la eliminación masiva de empleados seleccionados.
   */
  deleteSelected(): void {
    const ids = Array.from(this.setOfCheckedId);
    if (ids.length === 0) return;
    
    const observables = ids.map(id => this._employeeService.delete(id));
    
    forkJoin(observables).subscribe({
      next: () => {
        this._messageService.success(`${ids.length} empleado(s) eliminados`);
        this.setOfCheckedId.clear();
        this.refreshCheckedStatus();
        this.loadEmployees();
      },
      error: (err) => {
        const errorMessage = parseApiErrorMessage(err);
        this._messageService.error('Error al eliminar empleados: ' + errorMessage);
        this.loadEmployees();
      }
    });
  }
}
