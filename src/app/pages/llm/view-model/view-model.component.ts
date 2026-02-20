import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { SHARED_IMPORTS } from '../../../shared/shared-imports';
import { SharedService } from '../../../shared/services/shared.service';
import { LLMService } from '../llm.service';

@Component({
  selector: 'app-view-llm-model',
  standalone: true,
  imports: [SHARED_IMPORTS],
  templateUrl: './view-model.component.html',
  styleUrl: './view-model.component.scss',
  providers: [LLMService]
})
export class ViewModelComponent implements OnInit {
  modelData: any = null;
  loading = false;
  selectedTabIndex = 0;
  isEditingRateLimit = false;
  isSavingRateLimit = false;
  selectedSdkTab: 'curl' | 'python' | 'javascript' = 'curl';
  rateLimitForm: FormGroup;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private llmService: LLMService,
    private sharedService: SharedService,
    private fb: FormBuilder,
    private toastr: ToastrService
  ) {
    this.rateLimitForm = this.fb.group({
      rateLimitPerMinute: [{ value: '', disabled: true }, [Validators.required, Validators.min(1)]]
    });
  }

  ngOnInit(): void {
    const stateRow = history.state?.row;
    if (stateRow) {
      this.modelData = this.normalizeRow(stateRow);
      this.patchRateLimitForm(this.modelData);
    }

    this.route.queryParams.subscribe((params) => {
      const id = params['id'];
      if (!id) {
        if (!this.modelData) {
          this.backToList();
        }
        return;
      }

      // Always fetch fresh by id so fields not present in table rows
      // (e.g. rate-limit metadata) are available in View.
      this.loadModelById(id);
    });
  }

  backToList(): void {
    this.router.navigate(['/llm-models']);
  }

  onTabChange(index: number): void {
    this.selectedTabIndex = index;
  }

  editRateLimit(): void {
    this.isEditingRateLimit = true;
    this.rateLimitForm.get('rateLimitPerMinute')?.enable({ emitEvent: false });
  }

  cancelRateLimitEdit(): void {
    this.isEditingRateLimit = false;
    this.patchRateLimitForm(this.modelData);
    this.rateLimitForm.get('rateLimitPerMinute')?.disable({ emitEvent: false });
  }

  saveRateLimit(): void {
    if (!this.modelData) return;

    if (this.rateLimitForm.invalid) {
      this.rateLimitForm.markAllAsTouched();
      return;
    }

    const llmId = this.getLlmId(this.modelData);
    if (!llmId) {
      this.toastr.error('Unable to update rate limit: LLM ID missing.', 'Error');
      return;
    }

    const newRateLimit = Number(this.rateLimitForm.value.rateLimitPerMinute);
    this.isSavingRateLimit = true;
    this.sharedService.show();

    const keyId = this.extractKeyId(this.modelData);
    if (keyId) {
      this.updateRateLimit(llmId, keyId, newRateLimit);
      return;
    }

    this.llmService.getAddedModels().subscribe({
      next: (res: any) => {
        const items = this.normalizeArrayResponse(res).map((item: any) => this.normalizeRow(item));
        const fresh = items.find((item: any) => this.getLlmId(item) === llmId);
        const fallbackKeyId = this.extractKeyId(fresh);
        if (!fallbackKeyId) {
          this.toastr.error('Unable to update rate limit: key ID missing.', 'Error');
          this.isSavingRateLimit = false;
          this.sharedService.hide();
          return;
        }
        this.updateRateLimit(llmId, fallbackKeyId, newRateLimit);
      },
      error: (error: Error) => {
        this.toastr.error(error.message, 'Error');
        this.isSavingRateLimit = false;
        this.sharedService.hide();
      }
    });
  }

  private loadModelById(id: string): void {
    this.loading = true;
    this.sharedService.show();

    this.llmService.getAddedModels().subscribe({
      next: (res: any) => {
        const items = this.normalizeArrayResponse(res).map((item: any) => this.normalizeRow(item));
        this.modelData = items.find((item: any) => this.getLlmId(item) === id) || null;
        this.patchRateLimitForm(this.modelData);
        this.loading = false;
        this.sharedService.hide();
      },
      error: () => {
        this.modelData = null;
        this.loading = false;
        this.sharedService.hide();
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

  private normalizeRow(item: any): any {
    return {
      ...item,
      name: item?.name || item?.displayName || item?.id || '-',
      provider: this.extractProviderDisplay(item),
      model: this.extractModelDisplay(item),
      keyPrefix: this.extractKeyPrefix(item),
      project: this.extractProjectDisplay(item),
      environment: this.extractEnvironmentDisplay(item),
      status: item?.status || item?.state || 'unknown',
      endpoint: item?.endpoint || item?.baseUrl || item?.apiBase || item?.url || '-',
      rateLimitPerMinute: this.extractRateLimitPerMinute(item),
      createdAt: item?.createdAt || item?.created_at || item?.createdOn || item?.created_on || item?.created || item?.creationTime || null,
      updatedAt: item?.updatedAt || item?.updated_at || item?.updatedOn || item?.updated_on || item?.updated || item?.lastUpdated || null
    };
  }

  private extractProviderDisplay(item: any): string {
    const providerModel = String(item?.provider_model || item?.providerModel || '').trim();
    if (providerModel.includes('/')) return providerModel.split('/')[0] || '-';
    return String(item?.provider || item?.vendor || '-');
  }

  private extractModelDisplay(item: any): string {
    const providerModel = String(item?.provider_model || item?.providerModel || '').trim();
    if (providerModel.includes('/')) return providerModel.split('/').slice(1).join('/') || '-';

    const modelObj = item?.model && typeof item.model === 'object' ? item.model : null;
    const nimbuzModelObj = item?.nimbuzModel && typeof item.nimbuzModel === 'object' ? item.nimbuzModel : null;

    return (
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
    return String(
      item?.activeKeyPrefix ||
      item?.keyPrefix ||
      item?.apiKeyPrefix ||
      item?.nimbuzKeyPrefix ||
      item?.apiKeyMasked ||
      item?.keyMasked ||
      item?.maskedKey ||
      item?.prefix ||
      '-'
    );
  }

  private extractProjectDisplay(item: any): string {
    const projectObj = item?.project && typeof item.project === 'object' ? item.project : null;
    return String(
      item?.projectName ||
      item?.projectDisplayName ||
      item?.projectId ||
      projectObj?.name ||
      projectObj?.projectName ||
      projectObj?.id ||
      '-'
    );
  }

  private extractEnvironmentDisplay(item: any): string {
    const envObj = item?.environment && typeof item.environment === 'object' ? item.environment : null;
    return String(
      item?.envName ||
      item?.environmentName ||
      item?.envId ||
      item?.environmentId ||
      item?.namespace ||
      envObj?.name ||
      envObj?.environmentName ||
      envObj?.id ||
      '-'
    );
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

  private extractKeyId(row: any): string {
    return String(
      row?.llmKeyId ||
      row?.keyId ||
      row?.activeKeyId ||
      row?.activeKey?.id ||
      row?.key?.id ||
      row?.apiKey?.id ||
      row?.keys?.[0]?.id ||
      row?.apiKeys?.[0]?.id ||
      row?.llmKeys?.[0]?.id ||
      row?.credentials?.keyId ||
      row?.credentials?.apiKeyId ||
      ''
    );
  }

  private extractRateLimitPerMinute(row: any): number | null {
    const value =
      row?.rateLimitPerMinute ??
      row?.rate_limit_per_minute ??
      row?.rateLimitRPM ??
      row?.rate_limit_rpm ??
      row?.rateLimit ??
      row?.rate_limit ??
      row?.limits?.rateLimitPerMinute ??
      row?.limits?.rate_limit_per_minute ??
      row?.llmKey?.rateLimitPerMinute ??
      row?.llmKey?.rate_limit_per_minute ??
      row?.llmKeys?.[0]?.rateLimitPerMinute ??
      row?.llmKeys?.[0]?.rate_limit_per_minute ??
      row?.activeKey?.rateLimitPerMinute ??
      row?.activeKey?.rate_limit_per_minute ??
      row?.key?.rateLimitPerMinute ??
      row?.key?.rate_limit_per_minute ??
      row?.apiKey?.rateLimitPerMinute;

    const num = Number(value);
    return Number.isFinite(num) && num >= 0 ? num : null;
  }

  private patchRateLimitForm(row: any): void {
    const rateLimit = this.extractRateLimitPerMinute(row);
    this.rateLimitForm.patchValue({ rateLimitPerMinute: rateLimit ?? '' }, { emitEvent: false });
  }

  private updateRateLimit(llmId: string, keyId: string, rateLimitPerMinute: number): void {
    this.llmService.updateRateLimit(llmId, keyId, rateLimitPerMinute).subscribe({
      next: () => {
        this.toastr.success('Rate limit updated successfully');
        this.modelData = {
          ...(this.modelData || {}),
          rateLimitPerMinute
        };
        this.isSavingRateLimit = false;
        this.sharedService.hide();
        this.cancelRateLimitEdit();
      },
      error: (error: Error) => {
        this.toastr.error(error.message, 'Error');
        this.isSavingRateLimit = false;
        this.sharedService.hide();
      }
    });
  }

  formatDate(value: any): string {
    if (!value) return '-';
    let normalized: any = value;
    if (typeof normalized === 'string' && /^\d+$/.test(normalized)) {
      normalized = Number(normalized);
    }
    if (typeof normalized === 'number' && normalized > 0 && normalized < 1e12) {
      normalized = normalized * 1000;
    }
    const date = new Date(normalized);
    if (isNaN(date.getTime())) return '-';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit'
    });
  }

  get createdDisplay(): string {
    const formatted = this.formatDate(this.modelData?.createdAt);
    if (formatted !== '-') return formatted;
    const raw = this.modelData?.createdAt;
    return raw ? String(raw) : '-';
  }

  get rateLimitDisplay(): string {
    const formValue = this.rateLimitForm.get('rateLimitPerMinute')?.value;
    if (formValue !== '' && formValue !== null && formValue !== undefined) return String(formValue);
    const extracted = this.extractRateLimitPerMinute(this.modelData);
    return extracted === null ? '-' : String(extracted);
  }

  get usageBaseUrl(): string {
    return 'https://ai.nimbuz.tech';
  }

  get usageModel(): string {
    return String(this.modelData?.model || this.modelData?.modelId || '');
  }

  get curlSnippet(): string {
    const baseUrl = this.usageBaseUrl || 'https://your-llm-gateway.example.com';
    const model = this.usageModel || 'your-model-id';
    return `curl -X POST '${baseUrl}/chat/completions' \\
  -H 'Authorization: Bearer <YOUR_API_KEY>' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "model": "${model}",
    "messages": [
      { "role": "user", "content": "Hello" }
    ]
  }'`;
  }

  get pythonSnippet(): string {
    const baseUrl = this.usageBaseUrl || 'https://your-llm-gateway.example.com';
    const model = this.usageModel || 'your-model-id';
    return `from openai import OpenAI

client = OpenAI(
    api_key="<YOUR_API_KEY>",
    base_url="${baseUrl}"
)

response = client.chat.completions.create(
    model="${model}",
    messages=[
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": "Hello"}
    ]
)

print(response.choices[0].message.content)`;
  }

  get jsSnippet(): string {
    const baseUrl = this.usageBaseUrl || 'https://your-llm-gateway.example.com';
    const model = this.usageModel || 'your-model-id';
    return `import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.LLM_API_KEY,
  baseURL: "${baseUrl}"
});

const response = await client.chat.completions.create({
  model: "${model}",
  messages: [
    { role: "system", content: "You are a helpful assistant." },
    { role: "user", content: "Hello" }
  ]
});

console.log(response.choices[0].message.content);`;
  }

  setSdkTab(tab: 'curl' | 'python' | 'javascript'): void {
    this.selectedSdkTab = tab;
  }

  get detailRows(): { label: string; value: string }[] {
    if (!this.modelData) return [];

    return [
      { label: 'Name', value: this.safeValue(this.modelData.name) },
      { label: 'Status', value: this.safeValue(this.modelData.status) },
      { label: 'Provider', value: this.safeValue(this.modelData.provider) },
      { label: 'Model', value: this.safeValue(this.modelData.model) },
      { label: 'Key Prefix', value: this.safeValue(this.modelData.keyPrefix) },
      { label: 'Endpoint', value: 'ai.nimbuz.tech' },
      { label: 'Created', value: this.createdDisplay }
    ];
  }

  private safeValue(value: any): string {
    if (value === undefined || value === null || value === '') return '-';
    return String(value);
  }
}
