import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { Clipboard } from '@angular/cdk/clipboard';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-raw-editor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './raw-editor.component.html',
  styleUrl: './raw-editor.component.scss'
})
export class RawEditorComponent implements OnChanges {

  @Input() data: { EnvVariable: string; Value: string }[] = [];


  activeTab: 'env' | 'json' = 'env';
  envData: string = ' ';
  jsonData: string = '';
  isJsonValid: boolean = true;
  @Output() closeModal = new EventEmitter<boolean>();
  @Output() variablesUpdated = new EventEmitter<{ EnvVariable: string; Value: string }[]>();
  highlightedText = '';
  copied = false;

  constructor(private clipboard: Clipboard) { }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] && Array.isArray(this.data)) {
      const jsonObj: Record<string, string> = {};
      const envLines: string[] = [];

      this.data.forEach(({ EnvVariable, Value }) => {
        jsonObj[EnvVariable] = Value;
        envLines.push(`${EnvVariable}="${Value}"`);
      });

      this.envData = envLines.join('\n');
      this.jsonData = JSON.stringify(jsonObj, null, 2);
    }
  }

  copyToClipboard() {
    const dataToCopy = this.activeTab === 'env' ? this.envData : this.jsonData;
    this.clipboard.copy(dataToCopy);
    this.copied = true;
    setTimeout(() => {
      this.copied = false;
    }, 2000);
  }

  updateVariables() {
    console.log('Updated Variables:', this.activeTab === 'env' ? this.envData : this.jsonData);
    try {
      const parsed = JSON.parse(this.jsonData);
      const result: { EnvVariable: string; Value: string }[] = Object.entries(parsed).map(
        ([key, value]) => ({
          EnvVariable: key,
          Value: String(value)
        })
      );
      this.variablesUpdated.emit(result);
      this.closeRawEditor()
    } catch (e) {
      console.error('Invalid JSON data');
    }
  }

  validateJson() {
    try {
      JSON.parse(this.jsonData);
      this.isJsonValid = true;
    } catch (error) {
      this.isJsonValid = false;
    }
  } onDataChange(value: string) {
    if (this.activeTab === 'env') {
      this.envData = value;
      try {
        this.jsonData = this.envToJson(value);
        this.isJsonValid = true;
      } catch {
        this.isJsonValid = false;
      }
    } else {
      this.jsonData = value;
      try {
        const parsed = JSON.parse(value);
        this.envData = this.jsonToEnv(value);
        this.isJsonValid = true;
      } catch {
        this.isJsonValid = false;
      }
    }
    this.highlightedText = this.applyHighlight(value);
  }

  envToJson(envString: string): string {
    const jsonObj: { [key: string]: string } = {};
    envString.split('\n').forEach((line) => {
      const match = line.match(/^([\w.-]+)\s*=\s*"?(.+?)"?$/);
      if (match) {
        jsonObj[match[1]] = match[2];
      }
    });
    return JSON.stringify(jsonObj, null, 2);
  }

  jsonToEnv(jsonString: string): string {
    try {
      const parsed = JSON.parse(jsonString);
      return Object.entries(parsed)
        .map(([key, value]) => `${key}="${value}"`)
        .join('\n');
    } catch {
      return '';
    }
  }

  get highlightedContent(): string {
    return this.activeTab === 'env' ? this.highlightEnv(this.envData) : this.highlightJson(this.jsonData);
  }

  highlightEnv(env: string): string {
    return env
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .split('\n')
      .map(line => {
        const match = line.match(/^([\w.-]+)="?(.*?)"?$/);
        if (match) {
          return `<span class="env-key">${match[1]}</span>=<span class="env-value">"${match[2]}"</span>`;
        }
        return line;
      })
      .join('\n');
  }
  highlightJson(json: string): string {
    try {
      const parsed = JSON.parse(json);
      return JSON.stringify(parsed, null, 2)
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"([\w-]+)":/g, (_, key) => `<span class="json-key">"${key}"</span>:`)
        .replace(/:\s?"(.*?)"/g, (_, val) => `: <span class="json-value">"${val}"</span>`)
        .replace(/\n/g, '<br>&nbsp;&nbsp;');
    } catch {
      return json.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }
  }
  closeRawEditor() {
    this.closeModal.emit(true);
  }
  applyHighlight(text: string): string {
    const escaped = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    return escaped.replace(/(\w+)\s*=\s*"([^"]*)"/g, (_match, key, val) => {
      return `<span class="key">${key}</span>=<span class="value">"${val}"</span>`;
    });
  }
}
