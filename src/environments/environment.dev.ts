const base = 'https://api.dev.nimbuz.tech';

export const environment = {
  production: false,
  envName: 'dev',
  cashFree: 'sandbox',
  
  gitlab: {
    clientId: '3a8091146b8916dd68b95b0d89dfda4992d8fa10dfc436a97e591e1b82bbd30a',
    redirectUri: 'https://app.dev.nimbuz.tech/vcs/callback',
    authUrl: 'https://gitlab.com/oauth/authorize',
    tokenUrl: 'https://gitlab.com/oauth/token',
  },

  github: {
    clientId: 'Ov23lizhCMt2Ih4SgeyJ',
    redirectUri: 'https://app.dev.nimbuz.tech/vcs/callback'
  },
  domain: 'dev.nimbuz.tech',
  wss: 'wss://api.dev.nimbuz.tech/deployment',

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
