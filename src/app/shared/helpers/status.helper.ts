
export const ICON_MAP: Record<string, string> = {
  'initiated': 'bi-hourglass-split',
  'building': 'bi-check-circle-fill',
  'deploying': 'bi-cloud-upload',
  'active': 'bi-check-circle-fill',
  'paused': 'bi-stop-circle-fill',
  'superseded': 'bi-arrow-clockwise',
  'deploy failed': 'bi-x-circle-fill',
  'failed': 'bi-x-circle-fill',
  'build timeout': 'bi-clock-history',
  'build failed': 'bi-x-circle-fill',
  'deploy timeout': 'bi-clock-history',
  'unavailable': 'bi-x-circle-fill',
  'running': 'bi-check-circle-fill',
  'pending': 'bi-clock',
  'create job failed': 'bi-x-circle-fill',
  'stopped': 'bi-stop-circle-fill',
  'success': 'bi-check-circle-fill',
  'starting': 'bi-check-circle',
  'updating': 'bi-box-arrow-in-up',
  'degraded': 'bi-arrow-90deg-down',
  'deleted': 'bi-x-circle-fill',
  'cancelled': 'bi-ban-fill',
  'not available': 'bi-x-octagon',
};

export const STATUS_CLASS_MAP: Record<string, string> = {
  'active': 'success',
  'initiated': 'success',
  'building': 'warning',
  'deploying': 'success',
  'paused': 'warning',
  'superseded': 'warning',
  'deploy failed': 'danger',
  'failed': 'danger',
  'build timeout': 'danger',
  'build failed': 'danger',
  'deploy timeout': 'danger',
  'unavailable': 'danger',
  'running': 'success',
  'pending': 'warning',
  'create job failed': 'danger',
  'stopped': 'warning',
  'success': 'success',
  'starting': 'warning',
  'updating': 'warning',
  'degraded': 'warning',
  'deleted': 'danger',
  'cancelled': 'danger',
  'not available': 'secondary',
};

export function getStatusMeta(status: string): { icon: string; statusClass: string; label: string } {
  const icon = ICON_MAP[status.toLowerCase()] || 'bi-question-circle-fill';
  const statusClass = STATUS_CLASS_MAP[status.toLowerCase()] || 'secondary';
  return { icon, statusClass, label: status.toLowerCase() };
}
