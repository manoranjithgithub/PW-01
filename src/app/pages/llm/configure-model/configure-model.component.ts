import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { SHARED_IMPORTS } from '../../../shared/shared-imports';
import { SharedService } from '../../../shared/services/shared.service';
import { LLMService } from '../llm.service';

@Component({
  selector: 'app-configure-llm-model',
  standalone: true,
  imports: [SHARED_IMPORTS],
  templateUrl: './configure-model.component.html',
  styleUrl: './configure-model.component.scss',
  providers: [LLMService]
})
export class ConfigureModelComponent implements OnInit {
  form: FormGroup;
  isSubmitting = false;
  selectedModel: any = null;
  modelCreated = false;
  generatedKey = '';
  generatedKeyPrefix = '';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private toastr: ToastrService,
    private sharedService: SharedService,
    private llmService: LLMService
  ) {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(60)]],
      rateLimitPerMinute: [5, [Validators.required, Validators.min(1), Validators.max(100000)]]
    });
  }

  ngOnInit(): void {
    const navModel = history.state?.selectedModel;
    const storedModel = sessionStorage.getItem('selectedLlmModel');

    if (navModel && typeof navModel === 'object') {
      this.selectedModel = navModel;
    } else if (storedModel) {
      try {
        this.selectedModel = JSON.parse(storedModel);
      } catch {
        this.selectedModel = null;
      }
    }

    if (!this.selectedModel) {
      this.toastr.warning('Please select a model first.');
      this.router.navigate(['/llm-models/create-model']);
      return;
    }

    this.form.patchValue({
      name: this.defaultNameFromModel(this.selectedModel)
    });
  }

  backToSelection(): void {
    this.router.navigate(['/llm-models/create-model']);
  }

  backToList(): void {
    sessionStorage.removeItem('selectedLlmModel');
    this.router.navigate(['/llm-models']);
  }

  submit(): void {
    if (this.form.invalid || !this.selectedModel) {
      this.form.markAllAsTouched();
      return;
    }

    const envId = this.getCurrentEnvId();
    const projectId = this.getCurrentProjectId();
    const createdBy = this.getCurrentUserEmail();
    const modelId = this.extractModelValue(this.selectedModel);

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
      name: String(this.form.value.name || '').trim(),
      nimbuzModelId: modelId,
      createdBy
    };

    const rateLimit = Number(this.form.value.rateLimitPerMinute);

    this.isSubmitting = true;
    this.sharedService.show();

    this.llmService.addModel(payload).subscribe({
      next: (res: any) => {
        const llmId = this.extractCreatedLlmId(res);
        const keyId = this.extractCreatedKeyId(res);
        const key = this.extractRotatedKey(res);
        const keyPrefix = this.extractRotatedKeyPrefix(res);

        this.generatedKey = key || '';
        this.generatedKeyPrefix = keyPrefix || '-';
        this.modelCreated = true;
        sessionStorage.removeItem('selectedLlmModel');

        if (!llmId) {
          this.toastr.warning('Model created. Rate-limit update skipped because endpoint metadata was not returned.');
          this.finalizeAfterCreate();
          return;
        }

        this.applyRateLimitWithFallback(llmId, keyId, rateLimit);
      },
      error: (error: Error) => {
        this.toastr.error(error.message, 'Error');
        this.isSubmitting = false;
        this.sharedService.hide();
      }
    });
  }

  copyGeneratedKey(): void {
    if (!this.generatedKey) return;
    navigator.clipboard.writeText(this.generatedKey);
    this.toastr.success('Key copied to clipboard');
  }

  extractModelValue(model: any): string {
    return model?.value || model?.id || model?.name || model?.model || model?.displayName || '';
  }

  extractModelLabel(model: any): string {
    const name = model?.label || model?.displayName || this.extractModelValue(model);
    const provider = model?.provider || model?.vendor || model?.providerId;
    return provider ? `${name} (${provider})` : name;
  }

  extractModelParent(model: any): string {
    return String(
      model?.parent ||
      model?.parentModel ||
      model?.family ||
      model?.group ||
      model?.provider ||
      model?.vendor ||
      'Other'
    );
  }

  extractModelDescription(model: any): string {
    return String(
      model?.description ||
      model?.modelDescription ||
      model?.summary ||
      model?.details ||
      model?.metadata?.description ||
      'No description available.'
    );
  }

  getModelPriceRows(model: any): Array<{ label: string; value: string }> {
    if (!model) return [];
    const pricing = model?.pricing || model?.price || model?.cost || model?.rates || {};

    const rows: Array<{ label: string; value: string }> = [];

    const addIfPresent = (label: string, value: any) => {
      const formatted = this.formatPriceValue(value);
      if (formatted) rows.push({ label, value: formatted });
    };

    addIfPresent('Input', pricing?.input ?? pricing?.prompt ?? model?.inputPrice ?? model?.promptPrice);
    addIfPresent('Output', pricing?.output ?? pricing?.completion ?? model?.outputPrice ?? model?.completionPrice);
    addIfPresent('Cached Input', pricing?.cachedInput ?? pricing?.cache ?? model?.cachedInputPrice);
    addIfPresent('Per Request', pricing?.request ?? model?.requestPrice ?? model?.pricePerRequest);

    if (rows.length === 0 && pricing && typeof pricing === 'object') {
      Object.entries(pricing).forEach(([key, value]) => {
        const formatted = this.formatPriceValue(value);
        if (!formatted) return;
        const label = key
          .replace(/([A-Z])/g, ' $1')
          .replace(/[_-]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
          .replace(/^./, (char) => char.toUpperCase());
        rows.push({ label, value: formatted });
      });
    }

    return rows;
  }

  private defaultNameFromModel(model: any): string {
    const raw = this.extractModelValue(model) || this.extractModelLabel(model) || 'llm-model';
    const normalized = raw
      .toLowerCase()
      .replace(/[^a-z0-9-_/]+/g, '-')
      .replace(/[\/]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    return normalized.slice(0, 60) || 'llm-model';
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

  private extractCreatedLlmId(res: any): string {
    const data = this.extractDataObject(res);
    return String(
      data?.llmEndpointId ||
      data?.id ||
      data?._id ||
      data?.llmId ||
      data?.llm?.id ||
      data?.llm?.llmId ||
      data?.endpointId ||
      data?.llmEndpointId ||
      res?.llmEndpointId ||
      res?.id ||
      res?._id ||
      res?.llmId ||
      ''
    );
  }

  private extractCreatedKeyId(res: any): string {
    const data = this.extractDataObject(res);
    return String(
      data?.llmKeyId ||
      data?.keyId ||
      data?.activeKeyId ||
      data?.activeKey?.id ||
      data?.key?.id ||
      data?.apiKey?.id ||
      data?.keys?.[0]?.id ||
      data?.apiKeys?.[0]?.id ||
      data?.llmKeys?.[0]?.id ||
      data?.credentials?.keyId ||
      data?.credentials?.apiKeyId ||
      res?.llmKeyId ||
      res?.keyId ||
      res?.activeKeyId ||
      res?.key?.id ||
      ''
    );
  }

  private extractRotatedKey(res: any): string {
    const data = this.extractDataObject(res);
    return (
      data?.apiKey ||
      data?.key ||
      data?.secretKey ||
      data?.token ||
      data?.apiKey?.value ||
      data?.key?.value ||
      data?.credentials?.apiKey ||
      data?.credentials?.token ||
      res?.apiKey ||
      res?.key ||
      res?.secretKey ||
      res?.token ||
      ''
    );
  }

  private extractRotatedKeyPrefix(res: any): string {
    const data = this.extractDataObject(res);
    return (
      data?.keyPrefix ||
      data?.apiKeyPrefix ||
      data?.prefix ||
      data?.apiKey?.prefix ||
      data?.key?.prefix ||
      data?.credentials?.keyPrefix ||
      data?.credentials?.apiKeyPrefix ||
      res?.keyPrefix ||
      res?.apiKeyPrefix ||
      res?.prefix ||
      ''
    );
  }

  private extractDataObject(res: any): any {
    const data = res?.data;
    if (!data) return {};
    if (typeof data === 'string') {
      try {
        const parsed = JSON.parse(data);
        return parsed && typeof parsed === 'object' ? parsed : {};
      } catch {
        return {};
      }
    }
    return typeof data === 'object' ? data : {};
  }

  private applyRateLimitWithFallback(llmId: string, keyId: string, rateLimit: number, attempt = 0): void {
    if (keyId) {
      this.llmService.updateRateLimit(llmId, keyId, rateLimit).subscribe({
        next: () => {
          this.toastr.success('Model created and rate limit updated successfully');
          this.finalizeAfterCreate();
        },
        error: (error: Error) => {
          this.toastr.warning(`Model created, but rate-limit update failed: ${error.message}`);
          this.finalizeAfterCreate();
        }
      });
      return;
    }

    if (attempt >= 3) {
      this.toastr.warning('Model created. Rate-limit update skipped because key metadata was not returned.');
      this.finalizeAfterCreate();
      return;
    }

    this.llmService.getAddedModels().subscribe({
      next: (res: any) => {
        const items = this.normalizeArrayResponse(res);
        const match = items.find((item: any) => this.getLlmId(item) === llmId);
        const resolvedKeyId = this.extractCreatedKeyId({ data: match });

        if (resolvedKeyId) {
          this.applyRateLimitWithFallback(llmId, resolvedKeyId, rateLimit, attempt + 1);
          return;
        }

        setTimeout(() => this.applyRateLimitWithFallback(llmId, '', rateLimit, attempt + 1), 800);
      },
      error: () => {
        setTimeout(() => this.applyRateLimitWithFallback(llmId, '', rateLimit, attempt + 1), 800);
      }
    });
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

  private getLlmId(row: any): string {
    return String(
      row?.id ||
      row?._id ||
      row?.llmId ||
      row?.llm_id ||
      row?.llmEndpointId ||
      ''
    );
  }

  private finalizeAfterCreate(): void {
    if (!this.generatedKey) {
      this.toastr.info('API key was not returned by the create API response.');
    }
    this.isSubmitting = false;
    this.sharedService.hide();
  }

  private formatPriceValue(value: any): string {
    if (value === undefined || value === null || value === '') return '';

    if (typeof value === 'number') {
      return this.formatNumericPrice(value);
    }

    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) return '';
      const parsed = Number(trimmed);
      if (!isNaN(parsed)) return this.formatNumericPrice(parsed);
      return trimmed;
    }

    return String(value);
  }

  private formatNumericPrice(value: number): string {
    if (!isFinite(value)) return '';
    if (Math.abs(value) >= 1) return `$${value.toFixed(4)}`;
    return `$${value.toPrecision(4)}`;
  }
}
