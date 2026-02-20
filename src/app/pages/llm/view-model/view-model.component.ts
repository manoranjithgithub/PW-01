import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { SHARED_IMPORTS } from '../../../shared/shared-imports';
import { ConfirmationModalComponent } from '../../../shared/components/modal/confirmation-modal/confirmation-modal.component';
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
  @ViewChild('rotatedKeyModal') rotatedKeyModal!: TemplateRef<any>;
  modelData: any = null;
  loading = false;
  selectedTabIndex = 0;
  isEditingRateLimit = false;
  isSavingRateLimit = false;
  isRotatingKey = false;
  isDeletingModel = false;
  selectedSdkTab: 'curl' | 'python' | 'javascript' | 'go' | 'java' = 'curl';
  rotatedKeyModalRef: NgbModalRef | null = null;
  rotatedKeyValue = '';
  rotatedKeyPrefix = '';
  keyModalTitle = 'API Key Rotated';
  rateLimitForm: FormGroup;
  usageFiltersForm: FormGroup;
  usageLoading = false;
  usageError = '';
  usageLoaded = false;
  usageSummary: any = null;
  usageEvents: any[] = [];
  usageFrom = '';
  usageTo = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private llmService: LLMService,
    private sharedService: SharedService,
    private fb: FormBuilder,
    private toastr: ToastrService,
    private modalService: NgbModal
  ) {
    this.rateLimitForm = this.fb.group({
      rateLimitPerMinute: [{ value: '', disabled: true }, [Validators.required, Validators.min(1)]]
    });
    this.usageFiltersForm = this.fb.group({
      from: [this.toLocalDateTimeInput(this.getHoursAgoDate(24))],
      to: [this.toLocalDateTimeInput(new Date())],
      limit: [50, [Validators.required, Validators.min(1)]]
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
    if (index === 2) {
      this.loadUsageAnalytics();
    }
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
        const sourceItems = this.normalizeArrayResponse(res);
        const items = (Array.isArray(sourceItems) ? sourceItems : []).map((item: any) => this.normalizeRow(item));
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

  rotateKey(): void {
    if (!this.modelData || this.isRotatingKey) return;
    const llmId = this.getLlmId(this.modelData);
    if (!llmId) {
      this.toastr.error('Unable to rotate key: LLM ID missing.', 'Error');
      return;
    }

    this.isRotatingKey = true;
    this.sharedService.show();
    this.llmService.rotateKey(llmId).subscribe({
      next: (res: any) => {
        const key = this.extractRotatedKey(res);
        const keyPrefix = this.extractRotatedKeyPrefix(res) || this.extractKeyPrefix(this.modelData);

        this.toastr.success('API key rotated successfully');
        this.rotatedKeyValue = key || '';
        this.rotatedKeyPrefix = keyPrefix || '-';
        this.keyModalTitle = 'API Key Rotated';

        if (this.rotatedKeyValue) {
          this.rotatedKeyModalRef = this.modalService.open(this.rotatedKeyModal, {
            backdrop: 'static',
            keyboard: false,
            centered: true
          });
        } else {
          this.toastr.info('Key rotated. New full key was not returned by API response.');
        }

        this.modelData = {
          ...(this.modelData || {}),
          keyPrefix: this.rotatedKeyPrefix
        };
        this.isRotatingKey = false;
        this.sharedService.hide();
      },
      error: (error: Error) => {
        this.toastr.error(error.message, 'Error');
        this.isRotatingKey = false;
        this.sharedService.hide();
      }
    });
  }

  deleteModel(): void {
    if (!this.modelData || this.isDeletingModel) return;
    const llmId = this.getLlmId(this.modelData);
    if (!llmId) {
      this.toastr.error('Unable to delete: LLM ID missing.', 'Error');
      return;
    }

    const modalRef = this.modalService.open(ConfirmationModalComponent);
    modalRef.componentInstance.selectedItem = 'LLM model';
    modalRef.componentInstance.message = 'Are you sure you want to delete this LLM model?';

    modalRef.result.then((result) => {
      if (!result) return;
      this.isDeletingModel = true;
      this.sharedService.show();
      this.llmService.revokeLlm(llmId).subscribe({
        next: () => {
          this.toastr.success('LLM model deleted successfully');
          this.isDeletingModel = false;
          this.sharedService.hide();
          this.backToList();
        },
        error: (error: Error) => {
          this.toastr.error(error.message, 'Error');
          this.isDeletingModel = false;
          this.sharedService.hide();
        }
      });
    }).catch(() => { });
  }

  private loadModelById(id: string): void {
    this.loading = true;
    this.sharedService.show();

    this.llmService.getAddedModels().subscribe({
      next: (res: any) => {
        const sourceItems = this.normalizeArrayResponse(res);
        const items = (Array.isArray(sourceItems) ? sourceItems : []).map((item: any) => this.normalizeRow(item));
        this.modelData = items.find((item: any) => this.getLlmId(item) === id) || null;
        this.patchRateLimitForm(this.modelData);
        this.usageLoaded = false;
        if (this.selectedTabIndex === 2) {
          this.loadUsageAnalytics();
        }
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
      status: this.normalizeDisplayStatus(item?.status || item?.state || 'unknown'),
      endpoint: item?.endpoint || item?.baseUrl || item?.apiBase || item?.url || '-',
      rateLimitDisplayValue: this.extractRateLimitDisplay(item),
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
    const keyObj = this.toObject(row?.key);
    const llmKeyObj = this.toObject(row?.llmKey);
    const activeKeyObj = this.toObject(row?.activeKey);
    const apiKeyObj = this.toObject(row?.apiKey);
    const value =
      row?.currentRateLimitPerMinute ??
      row?.current_rate_limit_per_minute ??
      row?.rateLimitPerMinute ??
      row?.rate_limit_per_minute ??
      row?.rateLimitRPM ??
      row?.rate_limit_rpm ??
      row?.rateLimit ??
      row?.rate_limit ??
      row?.limits?.rateLimitPerMinute ??
      row?.limits?.rate_limit_per_minute ??
      llmKeyObj?.rateLimitPerMinute ??
      llmKeyObj?.rate_limit_per_minute ??
      llmKeyObj?.currentRateLimitPerMinute ??
      llmKeyObj?.current_rate_limit_per_minute ??
      row?.llmKeys?.[0]?.rateLimitPerMinute ??
      row?.llmKeys?.[0]?.rate_limit_per_minute ??
      row?.llmKeys?.[0]?.currentRateLimitPerMinute ??
      row?.llmKeys?.[0]?.current_rate_limit_per_minute ??
      activeKeyObj?.rateLimitPerMinute ??
      activeKeyObj?.rate_limit_per_minute ??
      activeKeyObj?.currentRateLimitPerMinute ??
      activeKeyObj?.current_rate_limit_per_minute ??
      keyObj?.rateLimitPerMinute ??
      keyObj?.rate_limit_per_minute ??
      keyObj?.currentRateLimitPerMinute ??
      keyObj?.current_rate_limit_per_minute ??
      apiKeyObj?.currentRateLimitPerMinute ??
      apiKeyObj?.current_rate_limit_per_minute ??
      apiKeyObj?.rateLimitPerMinute;
    return this.parseRateLimitNumber(value);
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

  private extractRotatedKey(res: any): string {
    const data = res?.data && typeof res.data === 'object' ? res.data : {};
    return (
      data?.apiKey ||
      data?.key ||
      data?.secretKey ||
      data?.token ||
      data?.apiKey?.value ||
      data?.key?.value ||
      res?.apiKey ||
      res?.key ||
      res?.secretKey ||
      res?.token ||
      ''
    );
  }

  private extractRotatedKeyPrefix(res: any): string {
    const data = res?.data && typeof res.data === 'object' ? res.data : {};
    return (
      data?.keyPrefix ||
      data?.apiKeyPrefix ||
      data?.prefix ||
      data?.apiKey?.prefix ||
      data?.key?.prefix ||
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
    const rawDisplay = this.modelData?.rateLimitDisplayValue;
    if (rawDisplay !== '' && rawDisplay !== null && rawDisplay !== undefined) return String(rawDisplay);
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

  get goSnippet(): string {
    const baseUrl = this.usageBaseUrl || 'https://your-llm-gateway.example.com';
    const model = this.usageModel || 'your-model-id';
    return `package main

import (
  "context"
  "fmt"

  openai "github.com/openai/openai-go"
  "github.com/openai/openai-go/option"
)

func main() {
  client := openai.NewClient(
    option.WithAPIKey("<YOUR_API_KEY>"),
    option.WithBaseURL("${baseUrl}"),
  )

  resp, err := client.Chat.Completions.New(context.Background(), openai.ChatCompletionNewParams{
    Model: "${model}",
    Messages: []openai.ChatCompletionMessageParamUnion{
      openai.UserMessage("Hello"),
    },
  })
  if err != nil {
    panic(err)
  }

  fmt.Println(resp.Choices[0].Message.Content)
}`;
  }

  get javaSnippet(): string {
    const baseUrl = this.usageBaseUrl || 'https://your-llm-gateway.example.com';
    const model = this.usageModel || 'your-model-id';
    return `import com.openai.client.OpenAIClient;
import com.openai.client.okhttp.OpenAIOkHttpClient;
import com.openai.models.chat.completions.ChatCompletionCreateParams;

public class Example {
  public static void main(String[] args) {
    OpenAIClient client = OpenAIOkHttpClient.builder()
      .apiKey("<YOUR_API_KEY>")
      .baseUrl("${baseUrl}")
      .build();

    ChatCompletionCreateParams params = ChatCompletionCreateParams.builder()
      .model("${model}")
      .addUserMessage("Hello")
      .build();

    var response = client.chat().completions().create(params);
    System.out.println(response.choices().get(0).message().content().orElse(""));
  }
}`;
  }

  get currentSnippet(): string {
    if (this.selectedSdkTab === 'python') return this.pythonSnippet;
    if (this.selectedSdkTab === 'javascript') return this.jsSnippet;
    if (this.selectedSdkTab === 'go') return this.goSnippet;
    if (this.selectedSdkTab === 'java') return this.javaSnippet;
    return this.curlSnippet;
  }

  copyCurrentSnippet(): void {
    const code = this.currentSnippet;
    if (!code) return;
    navigator.clipboard.writeText(code);
    this.toastr.success('Code copied to clipboard');
  }

  setSdkTab(tab: 'curl' | 'python' | 'javascript' | 'go' | 'java'): void {
    this.selectedSdkTab = tab;
  }

  loadUsageAnalytics(forceRefresh = false): void {
    if (!this.modelData || this.usageLoading) return;
    if (this.usageLoaded && !forceRefresh) return;

    const llmId = this.getLlmId(this.modelData);
    const keyId = this.extractKeyId(this.modelData);
    if (!llmId || !keyId) {
      this.usageSummary = null;
      this.usageEvents = [];
      this.usageError = 'Missing model or key ID required for usage analytics.';
      return;
    }

    if (this.usageFiltersForm.invalid) {
      this.usageFiltersForm.markAllAsTouched();
      return;
    }

    const from = this.toIsoOrUndefined(this.usageFiltersForm.value.from);
    const to = this.toIsoOrUndefined(this.usageFiltersForm.value.to);
    const limit = Number(this.usageFiltersForm.value.limit || 50);
    if (from && to && new Date(from).getTime() > new Date(to).getTime()) {
      this.usageError = '`From` must be earlier than `To`.';
      return;
    }

    this.usageLoading = true;
    this.usageError = '';
    this.sharedService.show();
    this.llmService.getKeyUsage(llmId, keyId, { from, to, limit }).subscribe({
      next: (res: any) => {
        const data = (res?.data && typeof res.data === 'object') ? res.data : (res || {});
        this.usageSummary = data?.summary || null;
        this.usageEvents = Array.isArray(data?.events) ? data.events : [];
        this.usageFrom = String(data?.from || from || '');
        this.usageTo = String(data?.to || to || '');
        this.usageLoaded = true;
        this.usageLoading = false;
        this.sharedService.hide();
      },
      error: (error: Error) => {
        this.usageSummary = null;
        this.usageEvents = [];
        this.usageError = error.message || 'Failed to load usage analytics.';
        this.usageLoading = false;
        this.sharedService.hide();
      }
    });
  }

  refreshUsageAnalytics(): void {
    this.usageLoaded = false;
    this.loadUsageAnalytics(true);
  }

  formatDateTime(value: any): string {
    if (!value) return '-';
    const date = new Date(value);
    if (isNaN(date.getTime())) return String(value);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatCost(value: any): string {
    if (value === undefined || value === null || value === '') return '-';
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return String(value);
    return `$${parsed.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 })}`;
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

  private normalizeDisplayStatus(status: any): string {
    const normalized = String(status || '').trim().toLowerCase();
    if (!normalized) return 'unknown';
    if (normalized === 'active') return 'running';
    return normalized;
  }

  private extractRateLimitDisplay(row: any): string {
    const keyObj = this.toObject(row?.key);
    const llmKeyObj = this.toObject(row?.llmKey);
    const activeKeyObj = this.toObject(row?.activeKey);
    const apiKeyObj = this.toObject(row?.apiKey);
    const candidates = [
      row?.currentRateLimitPerMinute,
      row?.current_rate_limit_per_minute,
      keyObj?.currentRateLimitPerMinute,
      keyObj?.current_rate_limit_per_minute,
      llmKeyObj?.currentRateLimitPerMinute,
      llmKeyObj?.current_rate_limit_per_minute,
      activeKeyObj?.currentRateLimitPerMinute,
      activeKeyObj?.current_rate_limit_per_minute,
      apiKeyObj?.currentRateLimitPerMinute,
      apiKeyObj?.current_rate_limit_per_minute,
      row?.rateLimitPerMinute,
      row?.rate_limit_per_minute,
      row?.rateLimit,
      row?.rate_limit
    ];

    for (const value of candidates) {
      if (value === undefined || value === null || value === '') continue;
      if (typeof value === 'object') {
        const nested =
          value?.value ??
          value?.limit ??
          value?.current ??
          value?.count;
        if (nested !== undefined && nested !== null && nested !== '') return String(nested);
      }
      return String(value);
    }
    return '';
  }

  private parseRateLimitNumber(value: any): number | null {
    if (value === undefined || value === null || value === '') return null;
    if (typeof value === 'number') return Number.isFinite(value) && value >= 0 ? value : null;
    if (typeof value === 'object') {
      const nested =
        value?.value ??
        value?.limit ??
        value?.current ??
        value?.count;
      return this.parseRateLimitNumber(nested);
    }
    const asString = String(value).trim();
    if (!asString) return null;
    const direct = Number(asString);
    if (Number.isFinite(direct) && direct >= 0) return direct;
    const numericPart = asString.match(/-?\d+(\.\d+)?/);
    if (!numericPart) return null;
    const parsed = Number(numericPart[0]);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
  }

  private toObject(value: any): any {
    if (!value) return value;
    if (typeof value === 'object') return value;
    if (typeof value !== 'string') return value;
    const trimmed = value.trim();
    if (!trimmed.startsWith('{') || !trimmed.endsWith('}')) return value;
    try {
      const parsed = JSON.parse(trimmed);
      return parsed && typeof parsed === 'object' ? parsed : value;
    } catch {
      return value;
    }
  }

  private getHoursAgoDate(hours: number): Date {
    const d = new Date();
    d.setHours(d.getHours() - hours);
    return d;
  }

  private toLocalDateTimeInput(date: Date): string {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const hh = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
  }

  private toIsoOrUndefined(value: any): string | undefined {
    if (value === undefined || value === null || value === '') return undefined;
    const date = new Date(value);
    if (isNaN(date.getTime())) return undefined;
    return date.toISOString();
  }
}
