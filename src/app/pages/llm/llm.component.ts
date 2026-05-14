import { Component, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ColDef } from 'ag-grid-community';
import { Router } from '@angular/router';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { Subscription } from 'rxjs';
import { SHARED_IMPORTS } from '../../shared/shared-imports';
import { ActionCellRendererComponent } from '../../shared/components/action-cell-renderer/action-cell-renderer.component';
import { SharedService } from '../../shared/services/shared.service';
import { LLMService } from './llm.service';
import { ConfirmationModalComponent } from '../../shared/components/modal/confirmation-modal/confirmation-modal.component';

@Component({
  selector: 'app-llm',
  standalone: true,
  imports: [SHARED_IMPORTS],
  templateUrl: './llm.component.html',
  styleUrl: './llm.component.scss',
  providers: [LLMService]
})
export class LLMComponent implements OnInit, OnDestroy {
  @ViewChild('addModelModal') addModelModal!: TemplateRef<any>;
  @ViewChild('rotatedKeyModal') rotatedKeyModal!: TemplateRef<any>;

  rowData: any[] = [];
  availableModels: any[] = [];
  addModelForm: FormGroup;
  loadingAvailableModels = false;
  isSubmitting = false;
  addModelModalRef: NgbModalRef | null = null;
  rotatedKeyModalRef: NgbModalRef | null = null;
  rotatedKeyValue = '';
  rotatedKeyPrefix = '';
  keyModalTitle = 'API Key Rotated';

  private projectChangeSub?: Subscription;
  private envChangeSub?: Subscription;

  columnDefs: ColDef[] = [
    {
      headerName: 'Name',
      field: 'name',
      sortable: true,
      filter: true,
      minWidth: 280,
      tooltipField: 'name',
      cellStyle: { cursor: 'pointer' },
      cellRenderer: (params: any) => {
        const name = params.value || '-';
        const createdText = this.formatDate(params.data?.createdAt);
        return `<div class="name-with-date">
          <span class="name-primary">${name}</span>
          ${createdText ? `<span class="name-date">Created ${createdText}</span>` : ''}
        </div>`;
      },
      onCellClicked: (event: any) => this.handleLlmModelAction('view', event.data)
    },
    {
      headerName: 'Provider',
      field: 'provider',
      sortable: true,
      filter: true,
      width: 130,
      minWidth: 110,
      maxWidth: 150
    },
    {
      headerName: 'Model',
      field: 'model',
      sortable: true,
      filter: true,
      minWidth: 280,
      flex: 1
    },
    {
      headerName: 'Key',
      field: 'keyPrefix',
      sortable: true,
      filter: true,
      width: 145,
      minWidth: 120,
      maxWidth: 165,
      cellRenderer: (params: any) => {
        const keyPrefix = params.value || '-';
        return `<span class="key-prefix-text">${keyPrefix}</span>`;
      }
    },
    {
      headerName: 'Status',
      field: 'status',
      sortable: true,
      filter: true,
      width: 160,
      cellRenderer: (params: any) => {
        const meta = this.sharedService.getStatusMeta(params.value);
        const statusClass = meta.statusClass === 'secondary' ? 'muted' : meta.statusClass;
        const statusLabel = this.getDisplayStatusLabel(meta.label);
        return `
          <span class="status-badge status-inline status-${statusClass} text-capitalize">
            <i class="bi ${meta.icon}"></i> ${statusLabel}
          </span>
        `;
      }
    },
    {
      headerName: 'Actions',
      field: 'actions',
      width: 100,
      cellStyle: { cursor: 'pointer' },
      cellRenderer: ActionCellRendererComponent,
      cellRendererParams: {
        additionalParam: 'llm-models',
        onActionClick: (action: string, row: any) => this.handleLlmModelAction(action, row)
      }
    }
  ];

  constructor(
    private llmService: LLMService,
    private sharedService: SharedService,
    private toastr: ToastrService,
    private modalService: NgbModal,
    private fb: FormBuilder,
    private router: Router
  ) {
    this.addModelForm = this.fb.group({
      selectedModel: [null, Validators.required],
      alias: ['']
    });
  }

  ngOnInit(): void {
    this.projectChangeSub = this.sharedService.projectValueChange$.subscribe(() => {
      this.loadAddedModels();
    });
    this.envChangeSub = this.sharedService.envValueChange$.subscribe(() => {
      this.loadAddedModels();
    });
    this.loadAddedModels();
  }

  ngOnDestroy(): void {
    this.projectChangeSub?.unsubscribe();
    this.envChangeSub?.unsubscribe();
  }

  loadAddedModels(): void {
    this.sharedService.show();
    this.llmService.getAddedModels().subscribe({
      next: (res: any) => {
        const currentProjectId = this.getCurrentProjectId();
        const currentProjectName = this.getCurrentProjectName();
        const currentEnvId = this.getCurrentEnvId();
        const currentEnvName = this.getCurrentEnvName();

        const sourceItems = this.normalizeArrayResponse(res);
        this.rowData = (Array.isArray(sourceItems) ? sourceItems : [])
          .filter((item: any) => this.isForCurrentSelection(item, currentProjectId, currentProjectName, currentEnvId, currentEnvName))
          .filter((item: any) => !this.isRevokedState(item))
          .map((item: any) => ({
            ...item,
            name: item?.name || item?.displayName || item?.id || '-',
            provider: this.extractProviderDisplay(item),
            model: this.extractModelDisplay(item),
            endpoint: item?.endpoint || item?.baseUrl || item?.apiBase || item?.url || '-',
            keyPrefix: this.extractKeyPrefix(item),
            status: this.normalizeDisplayStatus(item?.status || item?.state || 'unknown'),
            createdAt: item?.createdAt || item?.created_on || item?.created || null,
            updatedAt: item?.updatedAt || item?.updated_on || item?.updated || null
          }));
        this.sharedService.hide();
      },
      error: (error: Error) => {
        this.rowData = [];
        this.toastr.error(error.message, 'Error');
        this.sharedService.hide();
      }
    });
  }

  openAddModelModal(): void {
    this.addModelForm.reset({ selectedModel: null, alias: '' });
    this.loadingAvailableModels = true;

    this.llmService.getAvailableModels().subscribe({
      next: (res: any) => {
        this.availableModels = this.normalizeAvailableModels(res);
        this.loadingAvailableModels = false;
        this.addModelModalRef = this.modalService.open(this.addModelModal, {
          backdrop: 'static',
          keyboard: false,
          centered: true
        });
      },
      error: (error: Error) => {
        this.availableModels = [];
        this.loadingAvailableModels = false;
        this.toastr.error(error.message, 'Error');
      }
    });
  }

  submitAddModel(): void {
    if (this.addModelForm.invalid) {
      this.addModelForm.markAllAsTouched();
      return;
    }

    const selected = this.addModelForm.value.selectedModel;
    const selectedModelObj =
      typeof selected === 'object'
        ? selected
        : this.availableModels.find((model) => this.extractModelValue(model) === selected);
    const selectedModel = this.extractModelValue(selectedModelObj || selected);
    const envId = this.getCurrentEnvId();
    const projectId = this.getCurrentProjectId();
    const createdBy = this.getCurrentUserEmail();
    const alias = String(this.addModelForm.value.alias || '').trim();
    const name = alias || 'default';
    if (!envId) {
      this.toastr.error('Environment is required. Please select a project environment and try again.', 'Error');
      return;
    }
    if (!projectId) {
      this.toastr.error('Project is required. Please select a project and try again.', 'Error');
      return;
    }
    if (!createdBy) {
      this.toastr.error('User context missing. Please login again and try.', 'Error');
      return;
    }

    const payload: any = {
      projectId,
      envId,
      name,
      nimbuzModelId: selectedModel,
      createdBy
    };

    this.isSubmitting = true;
    this.sharedService.show();
    this.llmService.addModel(payload).subscribe({
      next: (res: any) => {
        const key = this.extractRotatedKey(res);
        const keyPrefix = this.extractRotatedKeyPrefix(res);
        this.toastr.success('Model added successfully');
        this.addModelModalRef?.close();
        if (key) {
          this.keyModalTitle = 'Model Added';
          this.rotatedKeyValue = key;
          this.rotatedKeyPrefix = keyPrefix || '-';
          this.rotatedKeyModalRef = this.modalService.open(this.rotatedKeyModal, {
            backdrop: 'static',
            keyboard: false,
            centered: true
          });
        } else {
          this.toastr.info('Model added. API key was not returned by API response.');
        }
        this.isSubmitting = false;
        this.loadAddedModels();
      },
      error: (error: Error) => {
        this.toastr.error(error.message, 'Error');
        this.isSubmitting = false;
        this.sharedService.hide();
      }
    });
  }

  refresh(): void {
    this.loadAddedModels();
  }

  goToCreateModel(): void {
    this.router.navigate(['/llm-models/create-model']);
  }

  handleLlmModelAction(action: string, row: any): void {
    if (action === 'view') {
      const id = this.getLlmId(row);
      this.router.navigate(['/llm-models/view-model'], {
        queryParams: { id },
        state: { row }
      });
      return;
    }
    if (action === 'rotateKey') {
      this.onRotateKey(row);
      return;
    }
    if (action === 'revoke') {
      this.onRevoke(row);
    }
  }

  onRotateKey(row: any): void {
    if (this.isRevokedState(row)) {
      this.toastr.info('Rotate key is disabled for revoked endpoints.');
      return;
    }

    const id = this.getLlmId(row);
    if (!id) {
      this.toastr.error('Unable to rotate key: LLM ID missing in record.', 'Error');
      return;
    }

    this.sharedService.show();
    this.llmService.rotateKey(id).subscribe({
      next: (res: any) => {
        const key = this.extractRotatedKey(res);
        const keyPrefix = this.extractRotatedKeyPrefix(res) || this.extractKeyPrefix(row);
        this.toastr.success('API key rotated successfully');
        if (key) {
          this.keyModalTitle = 'API Key Rotated';
          this.rotatedKeyValue = key;
          this.rotatedKeyPrefix = keyPrefix || '-';
          this.rotatedKeyModalRef = this.modalService.open(this.rotatedKeyModal, {
            backdrop: 'static',
            keyboard: false,
            centered: true
          });
        } else {
          this.toastr.info('Key rotated. New full key was not returned by API response.');
        }
        this.loadAddedModels();
      },
      error: (error: Error) => {
        this.toastr.error(error.message, 'Error');
        this.sharedService.hide();
      }
    });
  }

  onRevoke(row: any): void {
    if (this.isRevokedState(row)) {
      this.toastr.info('This endpoint is already revoked.');
      return;
    }

    const id = this.getLlmId(row);
    if (!id) {
      this.toastr.error('Unable to revoke: LLM ID missing in record.', 'Error');
      return;
    }

    const modalRef = this.modalService.open(ConfirmationModalComponent);
    modalRef.componentInstance.selectedItem = 'LLM model';
    modalRef.componentInstance.message = 'Are you sure you want to delete this LLM model?';

    modalRef.result.then((result) => {
      if (!result) return;
      this.sharedService.show();
      this.llmService.revokeLlm(id).subscribe({
        next: () => {
          this.toastr.success('LLM model deleted successfully');
          this.loadAddedModels();
        },
        error: (error: Error) => {
          this.toastr.error(error.message, 'Error');
          this.sharedService.hide();
        }
      });
    }).catch(() => { });
  }

  trackModel(index: number, model: any): string {
    return this.extractModelValue(model) || String(index);
  }

  extractModelValue(model: any): string {
    return model?.value || model?.id || model?.name || model?.model || model?.displayName || '';
  }

  extractModelLabel(model: any): string {
    const name = model?.label || model?.displayName || this.extractModelValue(model);
    const provider = model?.provider || model?.vendor || model?.providerId;
    return provider ? `${name} (${provider})` : name;
  }

  private normalizeArrayResponse(res: any): any[] {
    if (Array.isArray(res)) return res;
    if (Array.isArray(res?.data)) return res.data;
    if (Array.isArray(res?.data?.items)) return res.data.items;
    if (Array.isArray(res?.items)) return res.items;
    if (Array.isArray(res?.models)) return res.models;
    if (Array.isArray(res?.llms)) return res.llms;
    return [];
  }

  private normalizeAvailableModels(res: any): any[] {
    const rawItems = this.normalizeModelsCollection(res);
    const mapped = (Array.isArray(rawItems) ? rawItems : [])
      .map((item: any) => this.toModelOption(item))
      .filter((item: any) => !!item?.value);

    // de-duplicate by model value
    const seen = new Set<string>();
    return mapped.filter((item: any) => {
      const key = String(item.value).toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private normalizeModelsCollection(res: any): any[] {
    if (typeof res === 'string') {
      try {
        const parsed = JSON.parse(res);
        return this.normalizeModelsCollection(parsed);
      } catch {
        return [];
      }
    }

    if (Array.isArray(res)) return res;
    if (Array.isArray(res?.data)) return res.data;
    if (typeof res?.data === 'string') {
      try {
        const parsedData = JSON.parse(res.data);
        return this.normalizeModelsCollection(parsedData);
      } catch {
        // keep trying other shapes
      }
    }
    if (Array.isArray(res?.data?.data)) return res.data.data;
    if (Array.isArray(res?.models)) return res.models;
    if (Array.isArray(res?.items)) return res.items;
    if (Array.isArray(res?.data?.models)) return res.data.models;
    if (Array.isArray(res?.data?.items)) return res.data.items;
    if (Array.isArray(res?.result?.data)) return res.result.data;
    if (typeof res?.result?.data === 'string') {
      try {
        const parsedResultData = JSON.parse(res.result.data);
        return this.normalizeModelsCollection(parsedResultData);
      } catch {
        // keep trying other shapes
      }
    }
    if (Array.isArray(res?.result?.models)) return res.result.models;

    // Provider-grouped object: { openai: [...], anthropic: [...] }
    if (res?.data && typeof res.data === 'object' && !Array.isArray(res.data)) {
      const grouped = Object.entries(res.data).flatMap(([provider, value]) => {
        if (!Array.isArray(value)) return [];
        return value.map((model: any) => ({
          provider,
          ...(typeof model === 'string' ? { model } : model)
        }));
      });
      if (grouped.length) return grouped;

      // object map shape: { "m1": {id...}, "m2": {id...} } or { "m1": "model-id" }
      const objectMapValues = Object.values(res.data).flatMap((value: any) => {
        if (Array.isArray(value)) return value;
        if (value && typeof value === 'object') return [value];
        if (typeof value === 'string') return [value];
        return [];
      });
      if (objectMapValues.length) return objectMapValues;
    }

    // Last-resort fallback: recursively scan nested objects for model-like entries.
    const recursive = this.extractModelLikeEntries(res);
    return recursive;
  }

  private extractModelLikeEntries(input: any): any[] {
    const collected: any[] = [];
    const seen = new Set<any>();

    const walk = (node: any) => {
      if (!node || seen.has(node)) return;
      if (typeof node !== 'object') return;
      seen.add(node);

      if (Array.isArray(node)) {
        for (const item of node) walk(item);
        return;
      }

      const hasModelFields =
        'id' in node ||
        'displayName' in node ||
        'model' in node ||
        'modelName' in node ||
        'name' in node ||
        'value' in node;

      if (hasModelFields) {
        collected.push(node);
      }

      for (const value of Object.values(node)) {
        if (typeof value === 'object' && value !== null) {
          walk(value);
        }
      }
    };

    walk(input);
    return collected;
  }

  private toModelOption(item: any): any {
    if (typeof item === 'string') {
      return { value: item, label: item };
    }

    const value =
      item?.value ||
      item?.id ||
      item?.model ||
      item?.modelName ||
      item?.displayName ||
      item?.name ||
      '';
    const baseLabel =
      item?.label ||
      item?.displayName ||
      item?.name ||
      item?.model ||
      item?.modelName ||
      item?.id ||
      value;
    const provider = item?.provider || item?.vendor || item?.providerId || '';

    return {
      ...item,
      value,
      label: baseLabel,
      provider
    };
  }

  get configuredModelCount(): number {
    return this.rowData.length;
  }

  get providerCount(): number {
    const providers = new Set(
      this.rowData
        .map((item) => String(item.provider || '').trim().toLowerCase())
        .filter(Boolean)
    );
    return providers.size;
  }

  private formatDate(value: any): string {
    if (!value) return '';
    const date = new Date(value);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit'
    });
  }

  private getLlmId(row: any): string {
    return (
      row?.id ||
      row?._id ||
      row?.llmId ||
      row?.llm_id ||
      row?.llmEndpointId ||
      ''
    );
  }

  private isRevokedState(row: any): boolean {
    const rawStatus = String(row?.status || row?.state || '').toLowerCase();
    return rawStatus.includes('revoked');
  }

  private getCurrentEnvId(): string | undefined {
    const stored = localStorage.getItem('environment');
    if (!stored || stored === 'undefined') return undefined;
    try {
      const parsed = JSON.parse(stored);
      return parsed?.id || undefined;
    } catch {
      return stored || undefined;
    }
  }

  private getCurrentProjectId(): string | undefined {
    const stored = localStorage.getItem('project');
    if (!stored || stored === 'undefined') return undefined;
    try {
      const parsed = JSON.parse(stored);
      return parsed?.id || undefined;
    } catch {
      return stored || undefined;
    }
  }

  private getCurrentProjectName(): string | undefined {
    const stored = localStorage.getItem('project');
    if (!stored || stored === 'undefined') return undefined;
    try {
      const parsed = JSON.parse(stored);
      return parsed?.name || parsed?.projectName || undefined;
    } catch {
      return undefined;
    }
  }

  private getCurrentEnvName(): string | undefined {
    const stored = localStorage.getItem('environment');
    if (!stored || stored === 'undefined') return undefined;
    try {
      const parsed = JSON.parse(stored);
      return parsed?.name || parsed?.environmentName || undefined;
    } catch {
      return undefined;
    }
  }

  private isForCurrentSelection(
    item: any,
    currentProjectId?: string,
    currentProjectName?: string,
    currentEnvId?: string,
    currentEnvName?: string
  ): boolean {
    const projectMatch = this.isForCurrentProject(item, currentProjectId, currentProjectName);
    const envMatch = this.isForCurrentEnvironment(item, currentEnvId, currentEnvName);
    return projectMatch && envMatch;
  }

  private isForCurrentProject(item: any, currentProjectId?: string, currentProjectName?: string): boolean {
    if (!currentProjectId && !currentProjectName) return true;

    const itemProjectId = this.extractProjectId(item);
    const itemProjectName = this.extractProjectName(item);

    if (currentProjectId && itemProjectId) {
      return String(itemProjectId) === String(currentProjectId);
    }

    if (currentProjectName && itemProjectName) {
      return String(itemProjectName).toLowerCase() === String(currentProjectName).toLowerCase();
    }

    return false;
  }

  private isForCurrentEnvironment(item: any, currentEnvId?: string, currentEnvName?: string): boolean {
    if (!currentEnvId && !currentEnvName) return true;

    const itemEnvId = this.extractEnvId(item);
    const itemEnvName = this.extractEnvName(item);

    if (currentEnvId && itemEnvId) {
      return String(itemEnvId) === String(currentEnvId);
    }

    if (currentEnvName && itemEnvName) {
      return String(itemEnvName).toLowerCase() === String(currentEnvName).toLowerCase();
    }

    return false;
  }

  private extractProjectId(item: any): string {
    const projectObj = item?.project && typeof item.project === 'object' ? item.project : null;
    return (
      item?.projectId ||
      item?.project_id ||
      item?.projectID ||
      projectObj?.id ||
      projectObj?.projectId ||
      ''
    );
  }

  private extractProjectName(item: any): string {
    const projectObj = item?.project && typeof item.project === 'object' ? item.project : null;
    return (
      item?.projectName ||
      item?.project_name ||
      item?.projectDisplayName ||
      projectObj?.name ||
      projectObj?.projectName ||
      ''
    );
  }

  private extractEnvId(item: any): string {
    const envObj = item?.environment && typeof item.environment === 'object' ? item.environment : null;
    return (
      item?.envId ||
      item?.env_id ||
      item?.environmentId ||
      item?.environment_id ||
      item?.namespace ||
      envObj?.id ||
      envObj?.envId ||
      ''
    );
  }

  private extractEnvName(item: any): string {
    const envObj = item?.environment && typeof item.environment === 'object' ? item.environment : null;
    return (
      item?.envName ||
      item?.environmentName ||
      item?.environment_name ||
      envObj?.name ||
      envObj?.environmentName ||
      ''
    );
  }

  private getProviderModelParts(item: any): { provider: string; model: string } {
    const providerModel = String(
      item?.provider_model ||
      item?.providerModel ||
      ''
    ).trim();

    if (!providerModel) {
      return { provider: '', model: '' };
    }

    const separatorIdx = providerModel.indexOf('/');
    if (separatorIdx > -1) {
      return {
        provider: providerModel.slice(0, separatorIdx).trim(),
        model: providerModel.slice(separatorIdx + 1).trim()
      };
    }

    return { provider: '', model: providerModel };
  }

  private extractProviderDisplay(item: any): string {
    const fromProviderModel = this.getProviderModelParts(item).provider;
    return String(
      fromProviderModel ||
      item?.provider ||
      item?.vendor ||
      '-'
    );
  }

  private extractModelDisplay(item: any): string {
    const fromProviderModel = this.getProviderModelParts(item).model;
    const modelObj = item?.model && typeof item.model === 'object' ? item.model : null;
    const nimbuzModelObj = item?.nimbuzModel && typeof item.nimbuzModel === 'object' ? item.nimbuzModel : null;

    return (
      fromProviderModel ||
      item?.modelDisplayName ||
      item?.displayModelName ||
      modelObj?.displayName ||
      nimbuzModelObj?.displayName ||
      item?.modelName ||
      modelObj?.name ||
      nimbuzModelObj?.name ||
      item?.model ||
      item?.llmModel ||
      modelObj?.id ||
      item?.modelId ||
      item?.nimbuzModelId ||
      nimbuzModelObj?.id ||
      '-'
    );
  }

  private extractKeyPrefix(item: any): string {
    const direct =
      item?.activeKeyPrefix ||
      item?.keyPrefix ||
      item?.apiKeyPrefix ||
      item?.nimbuzKeyPrefix ||
      item?.apiKeyMasked ||
      item?.keyMasked ||
      item?.maskedKey ||
      item?.prefix ||
      item?.llmKeyPrefix ||
      item?.providerKeyPrefix ||
      item?.secret?.prefix ||
      item?.secret?.keyPrefix ||
      item?.metadata?.keyPrefix ||
      item?.metadata?.apiKeyPrefix ||
      item?.credentials?.keyPrefix ||
      item?.credentials?.apiKeyPrefix ||
      item?.auth?.keyPrefix ||
      item?.auth?.apiKeyPrefix ||
      item?.model?.keyPrefix ||
      item?.nimbuzModel?.keyPrefix ||
      item?.apiKey?.prefix;

    if (direct) return String(direct);

    const fullKey =
      item?.apiKey ||
      item?.key ||
      item?.secretKey ||
      item?.token ||
      item?.credentials?.apiKey ||
      item?.auth?.apiKey;

    if (typeof fullKey === 'string' && fullKey.trim()) {
      const cleaned = fullKey.trim();
      return cleaned.length > 8 ? `${cleaned.slice(0, 8)}...` : cleaned;
    }

    return '-';
  }

  private extractRotatedKey(res: any): string {
    return (
      res?.data?.apiKey ||
      res?.data?.key ||
      res?.data?.secretKey ||
      res?.data?.token ||
      res?.apiKey ||
      res?.key ||
      res?.secretKey ||
      res?.token ||
      ''
    );
  }

  private extractRotatedKeyPrefix(res: any): string {
    return (
      res?.data?.keyPrefix ||
      res?.data?.apiKeyPrefix ||
      res?.data?.prefix ||
      res?.keyPrefix ||
      res?.apiKeyPrefix ||
      res?.prefix ||
      ''
    );
  }

  copyRotatedKey(): void {
    if (!this.rotatedKeyValue) return;
    navigator.clipboard.writeText(this.rotatedKeyValue);
    this.toastr.success('Key copied to clipboard');
  }

  private getCurrentUserEmail(): string | undefined {
    const user = this.sharedService.getUser();
    if (user?.email) return user.email;

    const stored = localStorage.getItem('userInfo');
    if (stored && stored !== 'undefined') {
      try {
        const parsed = JSON.parse(stored);
        return parsed?.email || parsed?.userName || undefined;
      } catch {
        return undefined;
      }
    }
    return undefined;
  }

  private normalizeDisplayStatus(status: any): string {
    const normalized = String(status || '').trim().toLowerCase();
    if (!normalized) return 'unknown';
    if (normalized === 'active') return 'running';
    return normalized;
  }

  private getDisplayStatusLabel(status: any): string {
    return String(status || '').toLowerCase() === 'running' ? 'subscribed' : String(status || '').toLowerCase();
  }
}
