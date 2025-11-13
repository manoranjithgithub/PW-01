
export const ICON_MAP: Record<string, string> = {
  'Initiated': 'bi-hourglass-split',
  'Building': 'bi-check-circle-fill',
  'Deploying': 'bi-cloud-upload',
  'Active': 'bi-check-circle-fill',
  'Paused': 'bi-pause-circle-fill',
  'Superseded': 'bi-arrow-clockwise',
  'Deploy Failed': 'bi-x-circle-fill',
  'Failed': 'bi-x-circle-fill',
  'Build Timeout': 'bi-clock-history',
  'Build Failed': 'bi-x-circle-fill',
  'Deploy Timeout': 'bi-clock-history',
  'Unavailable': 'bi-x-circle-fill',
  'Running': 'bi-check-circle-fill',
  'Pending': 'bi-clock',
  'Create Job Failed': 'bi-x-circle-fill',
  'Stopped': 'bi-slash-circle-fill',
  'Success': 'bi-check-circle-fill',
  'Inprogress': 'bi-check-circle-fill',
  'Updating': 'bi-box-arrow-in-up',
  'Degraded': 'bi-arrow-90deg-down',
};

export const STATUS_CLASS_MAP: Record<string, string> = {
  'Active': 'success',
  'Initiated': 'success',
  'Building': 'primary',
  'Deploying': 'success',
  'Paused': 'warning',
  'Superseded': 'warning',
  'Deploy Failed': 'danger',
  'Failed': 'danger',
  'Build Timeout': 'danger',
  'Build Failed': 'danger',
  'Deploy Timeout': 'danger',
  'Unavailable': 'danger',
  'Running': 'success',
  'Pending': 'warning',
  'Create Job Failed': 'danger',
  'Stopped': 'danger',
  'Success': 'success',
  'Inprogress': 'warning',
  'Updating': 'warning',
  'Degraded': 'warning',
};

export function getStatusMeta(status: string): { icon: string; statusClass: string; label: string } {
  const icon = ICON_MAP[status] || 'bi-question-circle-fill';
  const statusClass = STATUS_CLASS_MAP[status] || 'secondary';
  return { icon, statusClass, label: status };
}
