export interface DeploymentType {
  id: number;
  name: string;
}

export const DEPLOYMENT_TYPES: DeploymentType[] = [
  { id: 1, name: 'vcs' },
  // { id: 2, name: 'gitHub' },
  { id: 2, name: 'file' },
];

export const UTILIZATION_DATA = [
  {
    title: 'CPU',
    subtitle: 'CPU Utilized vs. Allocated',
    value: 0,
    rawValue: '1056'
  },
  {
    title: 'Memory',
    subtitle: 'Memory Utilized vs. Allocated',
    value: 0,
    rawValue: '3200'
  },
  {
    title: 'Storage',
    subtitle: 'Storage Utilized vs. Allocated',
    value: 0,
    rawValue: '5800'
  }
];

export const CARDS_DATA = [
  { value: 0, label: 'Spent cost', description: 'Month to date' },
  { value: 0, label: 'Estimated cost', description: ' ' },
  { value: '0', label: 'Active/Paused deployments', description: ' ' },
  { value: 0, label: 'Failed/Pending deployments', description: ' ' },
]