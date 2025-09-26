export const environment = {
  production: false,
  auth: {
    baseAuthUrl: 'https://auth.dev.nimbuz.tech',
  },

  casdoorConfig: {
    serverUrl: 'https://auth.dev.nimbuz.tech',
    clientId: 'nimbuz',
    appName: 'nimbuz',
    organizationName: 'nimbuz',
    redirectPath: '/'
  },
  gitlab: {
    clientId: '3a8091146b8916dd68b95b0d89dfda4992d8fa10dfc436a97e591e1b82bbd30a',
    redirectUri: 'https://app.dev.nimbuz.tech/vcs/callback',
    authUrl: 'https://gitlab.com/oauth/authorize',
    tokenUrl: 'https://gitlab.com/oauth/token',
  },
  github: {
    clientId: 'Ov23lizhCMt2Ih4SgeyJ',
    redirectUri: 'https://app.dev.nimbuz.tech/vcs/callback',
    authUrl: 'https://gitlab.com/oauth/authorize',
    tokenUrl: 'https://gitlab.com/oauth/token',
  },

  apiUrl: 'https://api.dev.nimbuz.tech/core/v1/environments',
  legacyUrl: 'https://api.dev.nimbuz.tech/core/v1',
  loginUrl: 'https://api.dev.nimbuz.tech',
  projectsApiUrl: 'https://api.dev.nimbuz.tech/project/v1/projects',
  projectsBaseUrl: 'https://api.dev.nimbuz.tech/project/v1',
  jobExecutorBaseUrl: 'https://api.dev.nimbuz.tech/job-executor/v1',
  usermanagementApiUrl: 'https://api.dev.nimbuz.tech/user/v1/user',
  usermanagementBaseUrl: 'https://api.dev.nimbuz.tech/user/v1',
  deploymentManagement: 'https://api.dev.nimbuz.tech/deployment/v1',
  wss: 'wss://api.dev.nimbuz.tech/deployment',
  pricingManagement: 'https://api.dev.nimbuz.tech/pricing-engine',
  userManagement: 'https://api.dev.nimbuz.tech/user/v1/business/organisation',
  logServiceUrl: 'https://api.dev.nimbuz.tech/logs',
  domain: 'dev.nimbuz.tech'
};
