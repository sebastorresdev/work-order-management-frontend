import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzMessageService } from 'ng-zorro-antd/message';
import { TariffService, ServiceTariffDto, ImportTariffsResultDto } from '../../core/services/tariff.service';

@Component({
  selector: 'app-tariff-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzCardModule,
    NzTableModule,
    NzButtonModule,
    NzIconModule,
    NzTagModule,
    NzModalModule,
    NzFormModule,
    NzInputModule,
    NzInputNumberModule,
    NzSwitchModule,
    NzAlertModule,
  ],
  templateUrl: './tariff-list.html',
})
export class TariffListComponent implements OnInit {
  private tariffService = inject(TariffService);
  private message = inject(NzMessageService);

  tariffs = signal<ServiceTariffDto[]>([]);
  loading = signal<boolean>(false);
  modalVisible = signal<boolean>(false);
  saving = signal<boolean>(false);

  // Import State
  importModalVisible = signal<boolean>(false);
  importing = signal<boolean>(false);
  selectedFile = signal<File | null>(null);
  importResult = signal<ImportTariffsResultDto | null>(null);

  // Form State
  currentTariff: ServiceTariffDto = this.getEmptyTariff();

  ngOnInit(): void {
    this.loadTariffs();
  }

  loadTariffs(): void {
    this.loading.set(true);
    this.tariffService.getTariffs().subscribe({
      next: (list) => {
        this.tariffs.set(list);
        this.loading.set(false);
      },
      error: () => {
        this.message.error('No se pudieron cargar las tarifas de servicios.');
        this.loading.set(false);
      }
    });
  }

  seedDefaults(): void {
    this.loading.set(true);
    this.tariffService.seedTariffs().subscribe({
      next: (count) => {
        if (count > 0) {
          this.message.success(`Se cargaron ${count} tarifas por defecto exitosamente.`);
        } else {
          this.message.info('Las tarifas por defecto ya estaban registradas.');
        }
        this.loadTariffs();
      },
      error: () => {
        this.message.error('Error al inicializar el tarifario.');
        this.loading.set(false);
      }
    });
  }

  openCreateModal(): void {
    this.currentTariff = this.getEmptyTariff();
    this.modalVisible.set(true);
  }

  openEditModal(item: ServiceTariffDto): void {
    this.currentTariff = { ...item };
    this.modalVisible.set(true);
  }

  handleCancel(): void {
    this.modalVisible.set(false);
  }

  saveTariff(): void {
    if (!this.currentTariff.code || !this.currentTariff.serviceDetail) {
      this.message.warning('Por favor completa el código y la descripción del servicio.');
      return;
    }

    this.saving.set(true);
    this.tariffService.upsertTariff(this.currentTariff).subscribe({
      next: () => {
        this.message.success('Tarifa guardada correctamente.');
        this.modalVisible.set(false);
        this.saving.set(false);
        this.loadTariffs();
      },
      error: () => {
        this.message.error('Ocurrió un error al guardar la tarifa.');
        this.saving.set(false);
      }
    });
  }

  // --- Modal Importar Excel ---
  openImportModal(): void {
    this.selectedFile.set(null);
    this.importResult.set(null);
    this.importModalVisible.set(true);
  }

  handleImportCancel(): void {
    this.importModalVisible.set(false);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile.set(input.files[0]);
      this.importResult.set(null);
    }
  }

  executeImport(): void {
    const file = this.selectedFile();
    if (!file) {
      this.message.warning('Por favor selecciona un archivo Excel primero.');
      return;
    }

    this.importing.set(true);
    this.tariffService.importTariffsFromExcel(file).subscribe({
      next: (res) => {
        this.importResult.set(res);
        this.importing.set(false);
        this.message.success(`Importación completada: ${res.insertedCount} creados, ${res.updatedCount} actualizados.`);
        this.loadTariffs();
      },
      error: (err) => {
        this.importing.set(false);
        const errMsg = err?.error?.detail || err?.error || 'Error al procesar el archivo Excel.';
        this.message.error(errMsg);
      }
    });
  }

  calculateTotalPreview(t: ServiceTariffDto): number {
    return (t.baseAmount || 0) + (t.baseAdicionalAmount || 0) + (t.variableAmount || 0) + (t.cycleTimeAmount || 0) + (t.cumplimientoAgendaAmount || 0) + (t.sin30Amount || 0);
  }

  private getEmptyTariff(): ServiceTariffDto {
    return {
      code: '',
      tipificacion: 'INSTALACION',
      serviceDetail: '',
      points: 1,
      baseAmount: 0,
      baseAdicionalAmount: 0,
      variableAmount: 0,
      cycleTimeAmount: 0,
      cumplimientoAgendaAmount: 0,
      sin30Amount: 0,
      variableAdicionalAmount: 0,
      cycleTimeAdicionalAmount: 0,
      cumplimientoAgendaAdicionalAmount: 0,
      sin30AdicionalAmount: 0,
      appliesPayment: true,
      appliesWarranty: false,
    };
  }
}

