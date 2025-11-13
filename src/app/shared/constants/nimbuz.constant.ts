export interface DeploymentType {
    id: number;
    name: string;
  }
  
  export const DEPLOYMENT_TYPES: DeploymentType[] = [
    { id: 1, name: 'vcs' },
   // { id: 2, name: 'gitHub' },
    { id: 2, name: 'file' },
  ];
