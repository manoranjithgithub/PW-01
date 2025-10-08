export const environment = {
  production: true,
  auth: {
    baseAuthUrl: 'https://auth.nimbuz.tech',
  },

  casdoorConfig: {
    serverUrl: 'https://auth.nimbuz.tech',
    clientId: 'nimbuz',
    appName: 'nimbuz',
    organizationName: 'nimbuz',
    redirectPath: '/'
  },

  gitlab: {
    clientId: '36920baeac0044278f753546f3466bcc70cf5c9db3a302a794a90d36f9426962',
    redirectUri: 'https://app.nimbuz.tech/vcs/callback',
    authUrl: 'https://gitlab.com/oauth/authorize',
    tokenUrl: 'https://gitlab.com/oauth/token',
  },
  github: {
    clientId: 'Ov23liIFW74APX3INF2N',
    redirectUri: 'https://app.nimbuz.tech/vcs/callback'
  },

  apiUrl: 'https://api.nimbuz.tech/core/v1/environments',
  legacyUrl: 'https://api.nimbuz.tech/core/v1',
  loginUrl: 'https://api.nimbuz.tech',
  projectsApiUrl: 'https://api.nimbuz.tech/project/v1/projects',
  projectsBaseUrl: 'https://api.nimbuz.tech/project/v1',
  usermanagementApiUrl: 'https://api.nimbuz.tech/user/v1/user',
  usermanagementBaseUrl: 'https://api.nimbuz.tech/user/v1',
  deploymentManagement: 'https://api.nimbuz.tech/deployment/v1',
  jobExecutorBaseUrl: 'https://api.nimbuz.tech/job-executor/v1',
  wss: 'wss://api.nimbuz.tech/deployment',
  pricingManagement: 'https://api.nimbuz.tech/pricing/v1',
  userManagement: 'https://api.nimbuz.tech/user/v1/business/organisation',
  logServiceUrl: 'https://api.nimbuz.tech/logs',
  metricsUrl: 'https://api.nimbuz.tech/metrics/v1',
  domain: 'nimbuz.tech'
};
