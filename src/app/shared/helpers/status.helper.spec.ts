import { getStatusMeta, ICON_MAP, STATUS_CLASS_MAP } from './status.helper';

describe('status helper', () => {
  it('returns mapped icon and class for known status (case-insensitive)', () => {
    const meta = getStatusMeta('Active');
    expect(meta.icon).toBe(ICON_MAP['active']);
    expect(meta.statusClass).toBe(STATUS_CLASS_MAP['active']);
    expect(meta.label).toBe('active');
  });

  it('returns specific mappings for multi-word statuses', () => {
    const meta = getStatusMeta('Deploy Failed');
    expect(meta.icon).toBe(ICON_MAP['deploy failed']);
    expect(meta.statusClass).toBe(STATUS_CLASS_MAP['deploy failed']);
    expect(meta.label).toBe('deploy failed');
  });

  it('falls back to defaults for unknown status', () => {
    const meta = getStatusMeta('mystatus');
    expect(meta.icon).toBe('bi-question-circle-fill');
    expect(meta.statusClass).toBe('secondary');
    expect(meta.label).toBe('mystatus');
  });
});
