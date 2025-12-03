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
export const DEPLOY_OPTIONS = [
  {
    logo: 'assets/images/logos/github.png',
    name: 'Deploy from GitHub repo',
    value: 'github',
  },
  {
    logo: 'assets/images/logos/gitlab.png',
    name: 'Deploy from GitLab repo',
    value: 'gitlab',
  },
  {
    logo: 'assets/images/logos/zip.png',
    name: 'Deploy zip/tar',
    value: 'zip',
  },
  // {
  //   logo: 'assets/images/logos/docker.png',
  //   name: 'Deploy from Docker',
  //   value: 'docker',
  // },
];

export const DEPLOYMENT_STEPS = [
  { label: 'General' },
  { label: 'Environment variable' },
  { label: 'Secrets' },
  { label: 'Config as file' },
  { label: 'Review' },
];

export const DURATIONS = [
  { label: 'Last 15 mins', value: '15' },
  { label: 'Last 30 mins', value: '30' },
  { label: 'Last 1 hour', value: '60' },
  { label: 'Past 1 day', value: '1440' },
  { label: 'Past 7 days', value: '10080' },
  { label: 'Past 1 month', value: '43834' },
  { label: 'Custom', value: 'custom' }
];
export const INTERVALS = [
  { label: '1 min', value: '1' },
  { label: '2 mins', value: '2' },
  { label: '5 mins', value: '5' },
  { label: '10 mins', value: '10' },
  { label: '15 mins', value: '15' },
  { label: '30 mins', value: '30' },
  { label: '60 mins', value: '60' }
];
export const METRICS_REFRESH_INTERVALS = [
  { _id: "2025-07-01T05:00:00.000Z", storageAverage: 20 },
  { _id: "2025-07-01T05:03:00.000Z", storageAverage: 22 },
  { _id: "2025-07-01T05:06:00.000Z", storageAverage: 24 },
  { _id: "2025-07-01T05:09:00.000Z", storageAverage: 28 },
  { _id: "2025-07-01T05:12:00.000Z", storageAverage: 30 },
  { _id: "2025-07-01T05:15:00.000Z", storageAverage: 32 },
  { _id: "2025-07-01T05:18:00.000Z", storageAverage: 35 }
];