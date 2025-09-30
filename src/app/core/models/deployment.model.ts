export interface SelectedRepoDetails {
    repoUrl: string | null;
    branchName: string | null;
    webhook:boolean,
    gitRepoId:number;
}

export interface DeploymentUpdateRequest {
  name: string;
  environmentId: string;
  sourceCode?: {
    type?: string;
    gitUrl?: string;
    s3FileKey?: string | null;
    fileName?: string;
  };
  application?: {
    replicas?: number;
    instanceType?: string;
    installCommand?: string;
    buildCommand?: string | null;
    startCommand?: string;
    ephemeralStorage?: string | null;
    storage?: number | null;
  };
  network?: {
    healthEndpoint?: string;
    port?: number | string;
    isCustomDns?: boolean;
    customDomain?: string | null;
    appIngressDomain?: string;
  };
  config?: {
    path?: string | null;
    name?: string | null;
    data?: any;
  };
  secret?: any;
  environment?: any;
}
