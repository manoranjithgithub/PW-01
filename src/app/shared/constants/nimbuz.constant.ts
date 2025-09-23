export interface DeploymentType {
    id: number;
    name: string;
  }
  
  export const DEPLOYMENT_TYPES: DeploymentType[] = [
    { id: 1, name: 'vcs' },
   // { id: 2, name: 'gitHub' },
    { id: 2, name: 'zip' },
  ];

  export const REGION_OPTIONS = [
    {
      name: 'ap-south-1 (Mumbai) - Default',
      value: 'ap-south-1'
    },
    // {
    //   name: 'ap-southeast-1 (Singapore)',
    //   value: 'ap-southeast-1'
    // },
    // {
    //   name: 'us-central-1 (US)',
    //   value: 'us-central-1'
    // }
  ];
