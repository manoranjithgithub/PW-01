import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { SHARED_IMPORTS } from '../../../shared/shared-imports';
import { LLMService } from '../llm.service';

@Component({
  selector: 'app-create-llm-model',
  standalone: true,
  imports: [SHARED_IMPORTS],
  templateUrl: './create-model.component.html',
  styleUrl: './create-model.component.scss',
  providers: [LLMService]
})
export class CreateModelComponent implements OnInit {
  @ViewChild('modelDetailsModal') modelDetailsModal!: TemplateRef<any>;
  availableModels: any[] = [];
  groupedModels: Array<{ parent: string; models: any[] }> = [];
  filteredGroupedModels: Array<{ parent: string; models: any[] }> = [];
  loadingAvailableModels = false;
  selectedModelDetails: any = null;
  searchTerm = '';
  private modelDetailsModalRef: NgbModalRef | null = null;
  private readonly modelLogoMap: Record<string, string> = {
    'google/gemini-3.1-pro-preview': 'assets/images/logos/llm/googlegemini.svg',
    'google/gemini-3-flash-preview': 'assets/images/logos/llm/googlegemini.svg',
    'anthropic/claude-sonnet-4.6': 'assets/images/logos/llm/anthropic.svg',
    'anthropic/claude-opus-4.6': 'assets/images/logos/llm/anthropic.svg',
    'anthropic/claude-opus-4.5': 'assets/images/logos/llm/anthropic.svg',
    'anthropic/claude-haiku-4.5': 'assets/images/logos/llm/anthropic.svg',
    'qwen/qwen3.5-plus-02-15': 'assets/images/logos/llm/alibabacloud.svg',
    'qwen/qwen3.5-397b-a17b': 'assets/images/logos/llm/alibabacloud.svg',
    'qwen/qwen3-max-thinking': 'assets/images/logos/llm/alibabacloud.svg',
    'qwen/qwen3-coder-next': 'assets/images/logos/llm/alibabacloud.svg',
    'mistralai/mistral-small-creative': 'assets/images/logos/llm/mistralai.svg',
    'mistralai/devstral-2512': 'assets/images/logos/llm/mistralai.svg',
    'mistralai/ministral-14b-2512': 'assets/images/logos/llm/mistralai.svg',
    'mistralai/ministral-8b-2512': 'assets/images/logos/llm/mistralai.svg',
    'mistralai/ministral-3b-2512': 'assets/images/logos/llm/mistralai.svg',
    'mistralai/mistral-large-2512': 'assets/images/logos/llm/mistralai.svg',
    'nvidia/nemotron-3-nano-30b-a3b': 'assets/images/logos/llm/nvidia.svg',
    'openai/gpt-5.2-chat': 'assets/images/logos/llm/openai.svg',
    'openai/gpt-5.2-pro': 'assets/images/logos/llm/openai.svg',
    'openai/gpt-5.1-codex-max': 'assets/images/logos/llm/openai.svg',
    'amazon/nova-2-lite-v1': 'assets/images/logos/llm/amazon.svg',
    'amazon/nova-premier-v1': 'assets/images/logos/llm/amazon.svg',
    'deepseek/deepseek-v3.2-speciale': 'assets/images/logos/llm/deepseek.com-favicon.png',
    'deepseek/deepseek-v3.2': 'assets/images/logos/llm/deepseek.com-favicon.png'
  };

  constructor(
    private llmService: LLMService,
    private toastr: ToastrService,
    private router: Router,
    private modalService: NgbModal
  ) { }

  ngOnInit(): void {
    this.loadAvailableModels();
  }

  loadAvailableModels(): void {
    this.loadingAvailableModels = true;
    this.llmService.getAvailableModels().subscribe({
      next: (res: any) => {
        this.availableModels = this.normalizeAvailableModels(res);
        this.groupedModels = this.groupModelsByParent(this.availableModels);
        this.applyModelFilter();
        this.loadingAvailableModels = false;
      },
      error: (error: Error) => {
        this.availableModels = [];
        this.loadingAvailableModels = false;
        this.toastr.error(error.message, 'Error');
      }
    });
  }

  onSearchTermChange(value: string): void {
    this.searchTerm = value;
    this.applyModelFilter();
  }

  backToList(): void {
    this.router.navigate(['/llm-models']);
  }

  getModelLogo(model: any): string {
    const providerModelKey = this.getProviderModelKey(model);
    if (providerModelKey && this.modelLogoMap[providerModelKey]) {
      return this.modelLogoMap[providerModelKey];
    }

    const providerKey = this.getModelProviderKey(model);
    const providerLogos: Record<string, string> = {
      openai: 'assets/images/logos/llm/openai.svg',
      anthropic: 'assets/images/logos/llm/anthropic.svg',
      qwen: 'assets/images/logos/llm/alibabacloud.svg',
      mistralai: 'assets/images/logos/llm/mistralai.svg',
      mistral: 'assets/images/logos/llm/mistralai.svg',
      deepseek: 'assets/images/logos/llm/deepseek.com-favicon.png',
      amazon: 'assets/images/logos/llm/amazon.svg',
      nvidia: 'assets/images/logos/llm/nvidia.svg',
      meta: 'assets/images/logos/llm/google.svg',
      llama: 'assets/images/logos/llm/google.svg',
      gemini: 'assets/images/logos/llm/googlegemini.svg',
      google: 'assets/images/logos/llm/google.svg'
    };

    return providerLogos[providerKey] || 'assets/images/icons/default-tool.png';
  }

  onModelClick(model: any): void {
    sessionStorage.setItem('selectedLlmModel', JSON.stringify(model));
    this.router.navigate(['/llm-models/create-model/configure'], {
      state: { selectedModel: model }
    });
  }

  onRadioSelect(model: any, event?: Event): void {
    event?.stopPropagation();
    this.onModelClick(model);
  }

  openModelDetailsPopup(model: any, event?: Event): void {
    event?.stopPropagation();
    this.selectedModelDetails = model;
    this.modelDetailsModalRef?.close();
    this.modelDetailsModalRef = this.modalService.open(this.modelDetailsModal, {
      centered: true,
      size: 'lg'
    });
  }

  closeModelDetailsModal(): void {
    this.modelDetailsModalRef?.close();
    this.modelDetailsModalRef = null;
  }

  proceedWithSelectedDetails(): void {
    if (!this.selectedModelDetails) return;
    this.closeModelDetailsModal();
    this.onModelClick(this.selectedModelDetails);
  }

  extractModelParent(model: any): string {
    const directParent =
      model?.parent ||
      model?.parentModel ||
      model?.family ||
      model?.group ||
      model?.provider ||
      model?.vendor ||
      '';

    if (directParent) return String(directParent);

    const providerModel = String(model?.provider_model || model?.providerModel || '').trim();
    if (providerModel.includes('/')) {
      return providerModel.split('/')[0] || 'Other';
    }

    return 'Other';
  }

  private getModelProviderKey(model: any): string {
    const directProvider = String(
      model?.provider ||
      model?.vendor ||
      model?.providerId ||
      model?.parent ||
      ''
    ).trim().toLowerCase();
    if (directProvider) return directProvider;

    const providerModel = String(model?.provider_model || model?.providerModel || '').trim().toLowerCase();
    if (providerModel.includes('/')) {
      return providerModel.split('/')[0] || '';
    }

    return '';
  }

  private getProviderModelKey(model: any): string {
    const providerModelRaw = String(
      model?.provider_model ||
      model?.providerModel ||
      model?.value ||
      model?.id ||
      model?.model ||
      ''
    )
      .trim()
      .toLowerCase();

    if (providerModelRaw.includes('/')) return providerModelRaw;

    const provider = this.getModelProviderKey(model);
    if (!provider || !providerModelRaw) return '';

    // handle ids like "nimbuz-claude-opus-4.6" -> "anthropic/claude-opus-4.6"
    const simplified = providerModelRaw
      .replace(/^nimbuz[-_]/, '')
      .replace(new RegExp(`^${provider}[-_/]`), '');
    return `${provider}/${simplified}`;
  }

  private groupModelsByParent(models: any[]): Array<{ parent: string; models: any[] }> {
    const map = new Map<string, any[]>();
    for (const model of models) {
      const parent = this.extractModelParent(model) || 'Other';
      if (!map.has(parent)) {
        map.set(parent, []);
      }
      map.get(parent)?.push(model);
    }

    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([parent, grouped]) => ({ parent, models: grouped }));
  }

  private applyModelFilter(): void {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) {
      this.filteredGroupedModels = this.groupedModels;
      return;
    }

    this.filteredGroupedModels = this.groupedModels
      .map((group) => ({
        parent: group.parent,
        models: group.models.filter((model) => {
          const label = this.extractModelLabel(model).toLowerCase();
          const value = this.extractModelValue(model).toLowerCase();
          const provider = this.extractModelParent(model).toLowerCase();
          return label.includes(term) || value.includes(term) || provider.includes(term);
        })
      }))
      .filter((group) => group.models.length > 0);
  }

  extractModelValue(model: any): string {
    return model?.value || model?.id || model?.name || model?.model || model?.displayName || '';
  }

  extractModelLabel(model: any): string {
    const name = model?.label || model?.displayName || this.extractModelValue(model);
    const provider = model?.provider || model?.vendor || model?.providerId;
    return provider ? `${name} (${provider})` : name;
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

  private normalizeAvailableModels(res: any): any[] {
    const rawItems = this.normalizeModelsCollection(res);
    const mapped = rawItems
      .map((item: any) => this.toModelOption(item))
      .filter((item: any) => !!item?.value);

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

    if (res?.data && typeof res.data === 'object' && !Array.isArray(res.data)) {
      const grouped = Object.entries(res.data).flatMap(([provider, value]) => {
        if (!Array.isArray(value)) return [];
        return value.map((model: any) => ({
          provider,
          ...(typeof model === 'string' ? { model } : model)
        }));
      });
      if (grouped.length) return grouped;

      const objectMapValues = Object.values(res.data).flatMap((value: any) => {
        if (Array.isArray(value)) return value;
        if (value && typeof value === 'object') return [value];
        if (typeof value === 'string') return [value];
        return [];
      });
      if (objectMapValues.length) return objectMapValues;
    }

    return this.extractModelLikeEntries(res);
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
