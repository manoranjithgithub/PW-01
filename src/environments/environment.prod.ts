const base = 'https://api.nimbuz.tech';

export const environment = {
  production: true,
  envName: 'prod',

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
  domain: 'nimbuz.tech',
  wss: 'wss://api.nimbuz.tech/deployment',

  baseUrl: `${base}`,
  projectsApiUrl: `${base}/project/v1/projects`,
  projectsBaseUrl: `${base}/project/v1`,
  usermanagementApiUrl: `${base}/user/v1/user`,
  usermanagementBaseUrl: `${base}/user/v1`,
  deploymentManagement: `${base}/deployment/v1`,
  jobExecutorBaseUrl: `${base}/job-executor/v1`,
  pricingManagement: `${base}/pricing/v1`,
  userManagement: `${base}/user/v1/business/organisation`,
  logServiceUrl: `${base}/logs`,
  metricsUrl: `${base}/metrics/v1`,

};
