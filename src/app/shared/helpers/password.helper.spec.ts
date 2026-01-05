import { togglePasswordField } from './password.helper';

describe('togglePasswordField', () => {
  it('adds field to set when not present and removes when present', () => {
    const s = new Set<string>();
    togglePasswordField(s, 'f1');
    expect(s.has('f1')).toBeTrue();
    togglePasswordField(s, 'f1');
    expect(s.has('f1')).toBeFalse();
  });
});
