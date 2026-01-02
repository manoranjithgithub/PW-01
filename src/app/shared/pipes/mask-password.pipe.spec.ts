import { MaskPasswordPipe } from './mask-password.pipe';

describe('MaskPasswordPipe', () => {
  let pipe: MaskPasswordPipe;

  beforeEach(() => {
    pipe = new MaskPasswordPipe();
  });

  it('should create the pipe', () => {
    expect(pipe).toBeTruthy();
  });

  it('should mask password with default "*" character', () => {
    const result = pipe.transform('password');
    expect(result).toBe('********');
  });

  it('should mask password with custom mask character', () => {
    const result = pipe.transform('secret', '#');
    expect(result).toBe('######');
  });

  it('should return empty string for empty input', () => {
    const result = pipe.transform('');
    expect(result).toBe('');
  });

  it('should return empty string for null input', () => {
    const result = pipe.transform(null as any);
    expect(result).toBe('');
  });

  it('should return empty string for undefined input', () => {
    const result = pipe.transform(undefined as any);
    expect(result).toBe('');
  });
});
