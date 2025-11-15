export const RESOURCES = [
    { name: "atto", memory: "64MB", class: "r", cpu: "30m", price: 0.75 },
    { name: "atto", memory: "64MB", class: "m", cpu: "20m", price: 0.60 },
    { name: "atto", memory: "64MB", class: "c", cpu: "60m", price: 0.90 },
    { name: "femto", memory: "128MB", class: "r", cpu: "60m", price: 1.50 },
    { name: "femto", memory: "128MB", class: "m", cpu: "30m", price: 1.20 },
    { name: "femto", memory: "128MB", class: "c", cpu: "90m", price: 1.75 },
    { name: "pico", memory: "256MB", class: "r", cpu: "120m", price: 3.00 },
    { name: "pico", memory: "256MB", class: "m", cpu: "90m", price: 2.40 },
    { name: "pico", memory: "256MB", class: "c", cpu: "150m", price: 3.50 }
];

export const pageHeaders = [
    { title: 'Dashboard', url: '/dashboard', subText: 'Get real-time insights on cost, deployments, resource usage, and endpoint access—all in one place.' },
    { title: 'Deployments', url: '/deployment', subText: 'Upload a ZIP or connect to VCS to automate deployment, configuration, and scaling.' },
    { title: 'New Deployment', url: '/deployment/create-deployment', subText: 'Deploy your app to production effortlessly' },
    { title: 'Tools', url: '/tools', subText: 'Develop tools to manage and support persistent services such as databases and build agents.' },
    { title: 'Settings', url: '/settings', subText: '' },
    { title: 'Deployment Details', url: '/deployment/deployment-details', subText: '' },
    { title: 'Account Settings', url: '/account-settings', subText: '' },
    { title: 'Projects', url: '/projects', subText: '' },
    { title: 'Create Project', url: '/projects/create-project', subText: 'Create and configure your project within minutes to deploy your application.' },
    { title: 'Project Preferences', url: '/projects/project-preferences', subText: '' },
    { title: 'Create Environment', url: '/create-environment', subText: 'Create your Environment' },
    { title: 'Environment Preferences', url: '/environment-preferences', subText: '' },
    { title: 'Create Tool', url: '/tools/create-tool', subText: '' },
    { title: 'Invoice List', url: '/invoice-list', subText: 'View and manage invoices for each billing cycle.' },
    { title: 'Users', url: '/users-list', subText: '' },
    { title: 'View Tool', url: '/tools/view-tool', subText: '' },
    { title: 'Edit Tool', url: '/tools/edit-tool', subText: '' },
    { title: 'Deployment Details', url: '/llm/deployment-details', subText: '' },
    { title: 'LLM Deployment', url: '/llm/list', subText: '' },
];

export const userList = [
    { name: 'Preetham Jain', email: 'pjain@domain.com', role: 'Guest' },
    { name: 'Ed. Peeter', email: 'peeter.ed@domain.com', role: 'Owner' }
];

export const currentUsageFields = [
    { key: 'memoryUsage', label: 'Memory Usage' },
    { key: 'cpuUsageCurrent', label: 'CPU Usage' },
    { key: 'networkEgressCurrent', label: 'Network Egress' },
    { key: 'volumeUsageCurrent', label: 'Volume Usage' }
];

export const estimatedUsageFields = [
    { key: 'cpuUsageEstimated', label: 'CPU Usage' },
    { key: 'volumeUsageEstimated', label: 'Volume Usage' },
    { key: 'networkEgressEstimated', label: 'Network Egress' },
    { key: 'storageUsageEstimated', label: 'Storage Usage' }
];

export const Integrations = [
    {
        name: 'GitHub',
        logo: 'https://cdn-icons-png.flaticon.com/512/25/25231.png',
        status: 'connected',
        selected: false,
        provider: 'github',
    },
    {
        name: 'GitLab',
        logo: 'https://cdn-icons-png.flaticon.com/512/5968/5968853.png',
        status: 'connected',
        selected: false,
        provider: 'gitlab',
    }
];

export const RegionOptions = [
    {
        name: 'ap-south-1 (Mumbai) - Default',
        value: 'ap-south-1'
    },
    // {
    //   name: 'ap-southeast-1(Singapore)',
    //   value: 'ap-southeast-1'
    // }, {
    //   name: 'us-central-1 (US)',
    //   value: 'us-central-1'
    // }
]