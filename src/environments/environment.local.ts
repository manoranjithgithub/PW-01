
const base = 'https://api.dev.nimbuz.tech';
export const environment = {
    production: false,
    envName: 'dev',
    cashFree: 'sandbox',
    
    gitlab: {
        clientId: '66d8ed03ba256e0c95fb4c2384f5be16737636ca54c78446d427b3bd985bf884',
        redirectUri: 'http://localhost:4200/dashboard',
        authUrl: 'https://gitlab.com/oauth/authorize',
        tokenUrl: 'https://gitlab.com/oauth/token',
    },
    github: {
        clientId: 'Ov23lizhCMt2Ih4SgeyJ',
        redirectUri: 'http://localhost:4200/dashboard',
    },
    domain: 'dev.nimbuz.tech',
    wss: 'wss://api.dev.nimbuz.tech/job-executor',

    baseUrl: `${base}`,
    projectsApiUrl: `${base}/project/v1/projects`,
    projectsBaseUrl: `${base}/project/v1`,
    usermanagementApiUrl: `${base}/user/v1/user/user`,
    usermanagementBaseUrl: `${base}/user/v1`,
    deploymentManagement: `${base}/deployment/v1`,
    jobExecutorBaseUrl: `${base}/job-executor/v1`,
    pricingManagement: `${base}/pricing/v1`,
    userManagement: `${base}/user/v1/business/organisation`,
    logServiceUrl: `${base}/logs`,
    metricsUrl: `${base}/metrics/v1`,
    llmGatewayBaseUrl: `${base}/llmgateway/v1`,
};
