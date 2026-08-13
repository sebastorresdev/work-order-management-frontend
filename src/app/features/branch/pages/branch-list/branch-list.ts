import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
import { BranchResponse } from '../../models/branch-response';
import { BranchService } from '../../services/branch-service';
import { DeleteBranchesRequest } from '../../models/delete-branches-request';
import { BranchFormModal } from '../../components/branch-form-modal/branch-form-modal';
import { parseApiErrorMessage } from '../../../../shared/utils/api-error.util';

/**
 * Componente principal para el listado, filtrado, selección y administración de sedes.
 */
@Component({
  selector: 'app-branch-list',
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
  templateUrl: './branch-list.html',
})
export class BranchList implements OnInit {
  /**
   * Servicio de administración de sedes.
   */
  private _branchService = inject(BranchService);

  /**
   * Servicio de mensajes flotantes.
   */
  private _messageService = inject(NzMessageService);

  /**
   * Servicio de diálogos modales.
   */
  private _modalService = inject(NzModalService);

  /**
   * Señal reactiva con todas las sedes obtenidas del backend.
   */
  allBranches = signal<BranchResponse[]>([]);

  /**
   * Señal reactiva con el texto de búsqueda.
   */
  search = signal('');

  /**
   * Propiedad computada que filtra las sedes según el texto ingresado en el buscador.
   */
  filteredBranches = computed(() => {
    const term = this.search().toLowerCase().trim();
    if (!term) return this.allBranches();
    return this.allBranches().filter(r => 
      r.name.toLowerCase().includes(term) || 
      r.code.toLowerCase().includes(term) ||
      (r.address && r.address.toLowerCase().includes(term))
    );
  });

  /**
   * Estado que determina si todos los elementos visibles están seleccionados.
   */
  checked = false;

  /**
   * Estado de selección parcial (algunos seleccionados, no todos).
   */
  indeterminate = false;

  /**
   * Datos de la página actual mostrada en la tabla.
   */
  listOfCurrentPageData: readonly BranchResponse[] = [];

  /**
   * Conjunto de IDs de sedes seleccionadas con casillas de verificación.
   */
  setOfCheckedId = new Set<string>();

  /**
   * Carga inicial de datos al montar el componente.
   */
  ngOnInit(): void {
    this.loadBranches();
  }

  /**
   * Consulta al servicio para cargar todas las sedes.
   */
  loadBranches(): void {
    this._branchService.getAll().subscribe({
      next: (data) => this.allBranches.set(data),
      error: (error) => {
        console.error('Error loading branches', error);
        this._messageService.error('No se pudieron cargar las sedes');
      },
    });
  }

  /**
   * Abre el modal para registrar una nueva sede.
   */
  openNewBranchModal(): void {
    const modalRef = this._modalService.create({
      nzTitle: 'Nueva Sede',
      nzContent: BranchFormModal,
      nzWidth: 500,
      nzFooter: null
    });
    modalRef.afterClose.subscribe(result => {
      if (result) this.loadBranches();
    });
  }

  /**
   * Abre el modal para editar una sede existente.
   * @param branch Sede a editar.
   */
  openEditBranchModal(branch: BranchResponse): void {
    const modalRef = this._modalService.create({
      nzTitle: 'Editar Sede',
      nzContent: BranchFormModal,
      nzData: { branch },
      nzWidth: 500,
      nzFooter: null
    });
    modalRef.afterClose.subscribe(result => {
      if (result) this.loadBranches();
    });
  }

  /**
   * Actualiza el conjunto de IDs seleccionados.
   * @param id Identificador de la sede.
   * @param checked Estado de la casilla (`true`/`false`).
   */
  updateCheckedSet(id: string, checked: boolean): void {
    if (checked) {
      this.setOfCheckedId.add(id);
    } else {
      this.setOfCheckedId.delete(id);
    }
  }

  /**
   * Maneja el cambio de estado de selección de un ítem individual.
   * @param id Identificador de la sede.
   * @param checked Estado seleccionado.
   */
  onItemChecked(id: string, checked: boolean): void {
    this.updateCheckedSet(id, checked);
    this.refreshCheckedStatus();
  }

  /**
   * Maneja el evento de seleccionar o deseleccionar todas las sedes de la página.
   * @param value Estado global.
   */
  onAllChecked(value: boolean): void {
    this.listOfCurrentPageData.forEach((item) => this.updateCheckedSet(item.id, value));
    this.refreshCheckedStatus();
  }

  /**
   * Notifica cambios en los datos mostrados en la página actual de la tabla.
   * @param data Lista de sedes visibles.
   */
  onCurrentPageDataChange(data: readonly BranchResponse[]): void {
    this.listOfCurrentPageData = data;
    this.refreshCheckedStatus();
  }

  /**
   * Recalcula los estados `checked` e `indeterminate` de las casillas de verificación de la tabla.
   */
  refreshCheckedStatus(): void {
    this.checked = this.listOfCurrentPageData.length > 0 && this.listOfCurrentPageData.every((item) => this.setOfCheckedId.has(item.id));
    this.indeterminate =
      this.listOfCurrentPageData.some((item) => this.setOfCheckedId.has(item.id)) && !this.checked;
  }

  /**
   * Muestra el diálogo de confirmación para eliminar una sede.
   * @param branch Sede a eliminar.
   */
  showDeleteBranchConfirm(branch: BranchResponse): void {
    this._modalService.confirm({
      nzTitle: `¿Estás seguro de que quieres eliminar la sede '${branch.name}'?`,
      nzOkText: 'Confirmar',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzOnOk: () => {
        this._branchService.delete(branch.id).subscribe({
          next: () => {
            this._messageService.success(`Sede '${branch.name}' eliminada`);
            this.setOfCheckedId.delete(branch.id);
            this.refreshCheckedStatus();
            this.loadBranches();
          },
          error: (err) => {
            console.error('Error deleting branch', err);
            const errorMessage = parseApiErrorMessage(err);
            this._messageService.error(errorMessage);
          },
        });
      },
      nzCancelText: 'Cancelar',
    });
  }

  /**
   * Muestra el diálogo de confirmación para eliminar múltiples sedes seleccionadas.
   */
  showDeleteSelectedBranchesConfirm(): void {
    this._modalService.confirm({
      nzTitle: `¿Estás seguro de que quieres eliminar ${this.setOfCheckedId.size} sede(s)?`,
      nzOkText: 'Confirmar',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzOnOk: () => this.deleteSelectedBranches(),
      nzCancelText: 'Cancelar',
    });
  }

  /**
   * Ejecuta la eliminación en lote de las sedes seleccionadas.
   */
  deleteSelectedBranches(): void {
    const request: DeleteBranchesRequest = {
      branchIds: Array.from(this.setOfCheckedId),
    };

    this._branchService.deleteSelected(request).subscribe({
      next: () => {
        this.setOfCheckedId.clear();
        this.refreshCheckedStatus();
        this.loadBranches();
      },
      error: (err) => {
        const errorMessage = parseApiErrorMessage(err);
        this._messageService.error(errorMessage);
      },
    });
  }
}
