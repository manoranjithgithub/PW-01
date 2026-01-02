import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Clipboard } from '@angular/cdk/clipboard';
import { RawEditorComponent } from './raw-editor.component';
import { SimpleChanges } from '@angular/core';

describe('RawEditorComponent', () => {
  let component: RawEditorComponent;
  let fixture: ComponentFixture<RawEditorComponent>;
  let clipboardSpy: jasmine.SpyObj<Clipboard>;

  beforeEach(async () => {
    const clipboardSpyObj = jasmine.createSpyObj('Clipboard', ['copy']);

    await TestBed.configureTestingModule({
      imports: [RawEditorComponent],
      providers: [
        { provide: Clipboard, useValue: clipboardSpyObj }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RawEditorComponent);
    component = fixture.componentInstance;
    clipboardSpy = TestBed.inject(Clipboard) as jasmine.SpyObj<Clipboard>;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnChanges', () => {
    it('should initialize envData and jsonData when data changes', () => {
      const testData = [
        { EnvVariable: 'API_KEY', Value: 'test123' },
        { EnvVariable: 'DEBUG', Value: 'true' }
      ];
      component.data = testData;
      
      const changes: SimpleChanges = {
        data: {
          currentValue: testData,
          previousValue: null,
          firstChange: true,
          isFirstChange: () => true
        }
      };

      component.ngOnChanges(changes);

      expect(component.envData).toBe('API_KEY="test123"\nDEBUG="true"');
      expect(component.jsonData).toBe('{\n  "API_KEY": "test123",\n  "DEBUG": "true"\n}');
    });

    it('should handle empty data array', () => {
      component.data = [];
      
      const changes: SimpleChanges = {
        data: {
          currentValue: [],
          previousValue: null,
          firstChange: true,
          isFirstChange: () => true
        }
      };

      component.ngOnChanges(changes);

      expect(component.envData).toBe('');
      expect(component.jsonData).toBe('{}');
    });

    it('should not process if data change is not present', () => {
      const originalEnvData = component.envData;
      const changes: SimpleChanges = {};
      component.ngOnChanges(changes);
      expect(component.envData).toBe(originalEnvData);
    });

    it('should handle data with multiple variables', () => {
      const testData = [
        { EnvVariable: 'VAR1', Value: 'value1' },
        { EnvVariable: 'VAR2', Value: 'value2' },
        { EnvVariable: 'VAR3', Value: 'value3' }
      ];
      component.data = testData;
      
      const changes: SimpleChanges = {
        data: {
          currentValue: testData,
          previousValue: null,
          firstChange: true,
          isFirstChange: () => true
        }
      };

      component.ngOnChanges(changes);

      expect(component.envData).toContain('VAR1="value1"');
      expect(component.envData).toContain('VAR2="value2"');
      expect(component.envData).toContain('VAR3="value3"');
    });
  });

  describe('copyToClipboard', () => {
    beforeEach(() => {
      component.envData = 'KEY1="value1"\nKEY2="value2"';
      component.jsonData = '{"KEY1":"value1"}';
    });

    it('should copy env data to clipboard when activeTab is env', () => {
      component.activeTab = 'env';
      clipboardSpy.copy.and.returnValue(true);

      component.copyToClipboard();

      expect(clipboardSpy.copy).toHaveBeenCalledWith('KEY1="value1"\nKEY2="value2"');
      expect(component.copied).toBe(true);
    });

    it('should copy json data to clipboard when activeTab is json', () => {
      component.activeTab = 'json';
      clipboardSpy.copy.and.returnValue(true);

      component.copyToClipboard();

      expect(clipboardSpy.copy).toHaveBeenCalledWith('{"KEY1":"value1"}');
      expect(component.copied).toBe(true);
    });

    it('should reset copied flag after 2 seconds', (done) => {
      component.activeTab = 'env';
      clipboardSpy.copy.and.returnValue(true);

      component.copyToClipboard();
      expect(component.copied).toBe(true);

      setTimeout(() => {
        expect(component.copied).toBe(false);
        done();
      }, 2100);
    });
  });

  describe('updateVariables', () => {
    beforeEach(() => {
      spyOn(component.variablesUpdated, 'emit');
      spyOn(component, 'closeRawEditor');
    });

    it('should parse valid JSON and emit updated variables', () => {
      component.jsonData = '{"KEY1":"value1","KEY2":"value2"}';

      component.updateVariables();

      expect(component.variablesUpdated.emit).toHaveBeenCalledWith([
        { EnvVariable: 'KEY1', Value: 'value1' },
        { EnvVariable: 'KEY2', Value: 'value2' }
      ]);
      expect(component.closeRawEditor).toHaveBeenCalled();
    });

    it('should handle empty JSON object', () => {
      component.jsonData = '{}';

      component.updateVariables();

      expect(component.variablesUpdated.emit).toHaveBeenCalledWith([]);
      expect(component.closeRawEditor).toHaveBeenCalled();
    });

    it('should not emit if JSON is invalid', () => {
      spyOn(console, 'error');
      component.jsonData = 'invalid json';

      component.updateVariables();

      expect(component.variablesUpdated.emit).not.toHaveBeenCalled();
      expect(component.closeRawEditor).not.toHaveBeenCalled();
      expect(console.error).toHaveBeenCalledWith('Invalid JSON data');
    });

    it('should convert number values to strings', () => {
      component.jsonData = '{"PORT":"8080","TIMEOUT":"30"}';

      component.updateVariables();

      expect(component.variablesUpdated.emit).toHaveBeenCalledWith([
        { EnvVariable: 'PORT', Value: '8080' },
        { EnvVariable: 'TIMEOUT', Value: '30' }
      ]);
    });
  });

  describe('validateJson', () => {
    it('should validate correct JSON', () => {
      component.jsonData = '{"key":"value"}';
      
      component.validateJson();

      expect(component.isJsonValid).toBe(true);
    });

    it('should set isJsonValid to false for invalid JSON', () => {
      component.jsonData = '{key:value}';
      
      component.validateJson();

      expect(component.isJsonValid).toBe(false);
    });

    it('should handle empty string', () => {
      component.jsonData = '';
      
      component.validateJson();

      expect(component.isJsonValid).toBe(false);
    });

    it('should handle valid JSON array', () => {
      component.jsonData = '["item1","item2"]';
      
      component.validateJson();

      expect(component.isJsonValid).toBe(true);
    });
  });

  describe('onDataChange', () => {
    it('should update envData and jsonData when activeTab is env', () => {
      component.activeTab = 'env';
      const envValue = 'KEY1="value1"\nKEY2="value2"';

      component.onDataChange(envValue);

      expect(component.envData).toBe(envValue);
      expect(component.isJsonValid).toBe(true);
      expect(component.jsonData).toContain('KEY1');
      expect(component.jsonData).toContain('value1');
    });

    it('should update jsonData and envData when activeTab is json', () => {
      component.activeTab = 'json';
      const jsonValue = '{"KEY1":"value1"}';

      component.onDataChange(jsonValue);

      expect(component.jsonData).toBe(jsonValue);
      expect(component.isJsonValid).toBe(true);
      expect(component.envData).toContain('KEY1');
    });

    it('should set isJsonValid to false for invalid env format', () => {
      component.activeTab = 'env';
      const invalidEnv = 'INVALID FORMAT WITHOUT EQUALS';

      component.onDataChange(invalidEnv);

      expect(component.envData).toBe(invalidEnv);
    });

    it('should set isJsonValid to false for invalid JSON', () => {
      component.activeTab = 'json';
      const invalidJson = '{invalid json}';

      component.onDataChange(invalidJson);

      expect(component.jsonData).toBe(invalidJson);
      expect(component.isJsonValid).toBe(false);
    });

    it('should apply highlighting to the text', () => {
      component.activeTab = 'env';
      const envValue = 'KEY1="value1"';

      component.onDataChange(envValue);

      expect(component.highlightedText).toContain('key');
      expect(component.highlightedText).toContain('value');
    });
  });

  describe('envToJson', () => {
    it('should convert env format to JSON format', () => {
      const envString = 'KEY1="value1"\nKEY2="value2"\nKEY3="value3"';

      const result = component.envToJson(envString);

      const parsed = JSON.parse(result);
      expect(parsed.KEY1).toBe('value1');
      expect(parsed.KEY2).toBe('value2');
      expect(parsed.KEY3).toBe('value3');
    });

    it('should handle empty lines in env data', () => {
      const envString = 'KEY1="value1"\n\nKEY2="value2"\n';

      const result = component.envToJson(envString);

      const parsed = JSON.parse(result);
      expect(parsed.KEY1).toBe('value1');
      expect(parsed.KEY2).toBe('value2');
    });

    it('should handle env data with values containing special characters', () => {
      const envString = 'KEY1="value=with=equals"';

      const result = component.envToJson(envString);

      const parsed = JSON.parse(result);
      expect(parsed.KEY1).toBe('value=with=equals');
    });

    it('should handle empty env data', () => {
      const result = component.envToJson('');

      expect(result).toBe('{}');
    });

    it('should handle env variables without quotes', () => {
      const envString = 'KEY1=value1\nKEY2=value2';

      const result = component.envToJson(envString);

      const parsed = JSON.parse(result);
      expect(parsed.KEY1).toBeDefined();
    });
  });

  describe('jsonToEnv', () => {
    it('should convert JSON format to env format', () => {
      const jsonString = '{"KEY1":"value1","KEY2":"value2","KEY3":"value3"}';

      const result = component.jsonToEnv(jsonString);

      expect(result).toContain('KEY1="value1"');
      expect(result).toContain('KEY2="value2"');
      expect(result).toContain('KEY3="value3"');
    });

    it('should handle empty JSON object', () => {
      const result = component.jsonToEnv('{}');

      expect(result).toBe('');
    });

    it('should handle JSON with special characters in values', () => {
      const jsonString = '{"KEY1":"value with spaces"}';

      const result = component.jsonToEnv(jsonString);

      expect(result).toContain('KEY1="value with spaces"');
    });

    it('should return empty string for invalid JSON', () => {
      const result = component.jsonToEnv('invalid json');

      expect(result).toBe('');
    });

    it('should handle nested values as strings', () => {
      const jsonString = '{"KEY1":"value1","KEY2":"value2"}';

      const result = component.jsonToEnv(jsonString);

      expect(result).toBeTruthy();
      expect(result.split('\n').length).toBeGreaterThan(0);
    });
  });

  describe('highlightEnv', () => {
    it('should apply highlighting to env data', () => {
      const envData = 'KEY1="value1"\nKEY2="value2"';

      const result = component.highlightEnv(envData);

      expect(result).toContain('env-key');
      expect(result).toContain('env-value');
      expect(result).toContain('KEY1');
      expect(result).toContain('value1');
    });

    it('should escape HTML characters', () => {
      const envData = 'KEY1="<script>alert("test")</script>"';

      const result = component.highlightEnv(envData);

      expect(result).toContain('&lt;');
      expect(result).toContain('&gt;');
      expect(result).not.toContain('<script>');
    });

    it('should handle multiple lines', () => {
      const envData = 'KEY1="value1"\nKEY2="value2"\nKEY3="value3"';

      const result = component.highlightEnv(envData);

      const lines = result.split('\n');
      expect(lines.length).toBe(3);
    });
  });

  describe('highlightJson', () => {
    it('should apply highlighting to valid JSON', () => {
      const jsonData = '{"key":"value"}';

      const result = component.highlightJson(jsonData);

      expect(result).toContain('json-key');
      expect(result).toContain('json-value');
    });

    it('should escape HTML characters', () => {
      const jsonData = '{"key":"<div>content</div>"}';

      const result = component.highlightJson(jsonData);

      expect(result).toContain('&lt;');
      expect(result).toContain('&gt;');
      expect(result).not.toContain('<div>');
    });

    it('should handle invalid JSON by escaping it', () => {
      const invalidJson = '{invalid json}';

      const result = component.highlightJson(invalidJson);

      expect(result).toBeTruthy();
      expect(result).not.toContain('json-key');
    });

    it('should format JSON with line breaks', () => {
      const jsonData = '{"key1":"value1","key2":"value2"}';

      const result = component.highlightJson(jsonData);

      expect(result).toContain('<br>');
    });
  });

  describe('highlightedContent', () => {
    it('should return highlighted env data when activeTab is env', () => {
      component.activeTab = 'env';
      component.envData = 'KEY1="value1"';

      const result = component.highlightedContent;

      expect(result).toContain('env-key');
    });

    it('should return highlighted json data when activeTab is json', () => {
      component.activeTab = 'json';
      component.jsonData = '{"key":"value"}';

      const result = component.highlightedContent;

      expect(result).toContain('json-key');
    });
  });

  describe('closeRawEditor', () => {
    it('should emit closeModal event with true', () => {
      spyOn(component.closeModal, 'emit');

      component.closeRawEditor();

      expect(component.closeModal.emit).toHaveBeenCalledWith(true);
    });
  });

  describe('applyHighlight', () => {
    it('should highlight key-value pairs in env format', () => {
      const text = 'KEY1="value1"';

      const result = component.applyHighlight(text);

      expect(result).toContain('<span class="key">');
      expect(result).toContain('<span class="value">');
    });

    it('should escape HTML special characters', () => {
      const text = 'KEY="<div>value</div>"';

      const result = component.applyHighlight(text);

      expect(result).toContain('&lt;div&gt;');
      expect(result).not.toContain('<div>');
    });

    it('should handle ampersands', () => {
      const text = 'KEY="value&test"';

      const result = component.applyHighlight(text);

      expect(result).toContain('&amp;');
    });

    it('should handle multiple key-value pairs', () => {
      const text = 'KEY1="value1" KEY2="value2"';

      const result = component.applyHighlight(text);

      expect(result).toContain('KEY1');
      expect(result).toContain('KEY2');
      expect(result).toContain('value1');
      expect(result).toContain('value2');
    });
  });

  describe('Integration tests', () => {
    it('should handle complete workflow: initialize, convert, and update', () => {
      spyOn(component.variablesUpdated, 'emit');
      spyOn(component, 'closeRawEditor');
      component.data = [
        { EnvVariable: 'API_URL', Value: 'https://api.example.com' },
        { EnvVariable: 'DEBUG', Value: 'true' }
      ];
      
      const changes: SimpleChanges = {
        data: {
          currentValue: component.data,
          previousValue: null,
          firstChange: true,
          isFirstChange: () => true
        }
      };

      component.ngOnChanges(changes);
      expect(component.envData).toBeTruthy();
      expect(component.jsonData).toBeTruthy();

      component.jsonData = '{"NEW_KEY":"new_value"}';
      component.validateJson();
      expect(component.isJsonValid).toBe(true);

      component.updateVariables();
      expect(component.variablesUpdated.emit).toHaveBeenCalledWith([
        { EnvVariable: 'NEW_KEY', Value: 'new_value' }
      ]);
      expect(component.closeRawEditor).toHaveBeenCalled();
    });

    it('should convert between formats using onDataChange', () => {
      component.activeTab = 'env';
      const envValue = 'TEST_KEY="test_value"';

      component.onDataChange(envValue);

      expect(component.envData).toBe(envValue);
      expect(component.jsonData).toBeTruthy();

      component.activeTab = 'json';
      component.onDataChange(component.jsonData);

      expect(component.envData).toContain('TEST_KEY');
    });

    it('should maintain data integrity through multiple conversions', () => {
      const originalData = [
        { EnvVariable: 'KEY1', Value: 'value1' },
        { EnvVariable: 'KEY2', Value: 'value2' }
      ];

      component.data = originalData;
      const changes: SimpleChanges = {
        data: {
          currentValue: originalData,
          previousValue: null,
          firstChange: true,
          isFirstChange: () => true
        }
      };

      component.ngOnChanges(changes);
      const envString = component.envData;
      const jsonString = component.envToJson(envString);
      const envStringAgain = component.jsonToEnv(jsonString);

      expect(envStringAgain).toContain('KEY1');
      expect(envStringAgain).toContain('KEY2');
      expect(envStringAgain).toContain('value1');
      expect(envStringAgain).toContain('value2');
    });
  });
});
