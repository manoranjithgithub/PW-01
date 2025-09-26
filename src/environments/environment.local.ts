export const environment = {
    production: false,
    auth: {
        baseAuthUrl: 'https://auth.dev.nimbuz.tech',
    },
    casdoorConfig: {
        serverUrl: 'https://auth.dev.nimbuz.tech',
        clientId: 'nimbuz',
        appName: 'nimbuz',
        organizationName: 'built-in',
        redirectPath: '/'
    },
    gitlab: {
        clientId: '66d8ed03ba256e0c95fb4c2384f5be16737636ca54c78446d427b3bd985bf884',
        redirectUri: 'http://localhost:4200/dashboard',
        authUrl: 'https://gitlab.com/oauth/authorize',
        tokenUrl: 'https://gitlab.com/oauth/token',
    },


    apiUrl: 'https://api.dev.nimbuz.tech/core/v1/environments',
    legacyUrl: 'https://api.dev.nimbuz.tech/core/v1',
    loginUrl: 'https://api.dev.nimbuz.tech',
    projectsApiUrl: 'https://api.dev.nimbuz.tech/project/v1/projects',
    projectsBaseUrl: 'https://api.dev.nimbuz.tech/project/v1',
    usermanagementApiUrl: 'https://api.dev.nimbuz.tech/user/v1/users/user',
    usermanagementBaseUrl: 'https://api.dev.nimbuz.tech/user/v1',
    deploymentManagement: 'https://api.dev.nimbuz.tech/deployment/v1',
    jobExecutorBaseUrl: 'https://api.dev.nimbuz.tech/job-executor/v1',
    wss: 'wss://api.dev.nimbuz.tech/job-executor',
    pricingManagement: 'http://pricing-engine-sme.nimbuz.dev',
    userManagement: 'https://api.dev.nimbuz.tech/user/v1/business/organisation',
    logServiceUrl: 'https://api.dev.nimbuz.tech/logs',

};
