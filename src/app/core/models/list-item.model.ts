export interface ListItem {
  id: string;
  name: string;
  namespace: string | null;
  clusterID: string;
  userID: string;
  created_at: string;
  environments: string;
}


export interface IAthlete {
  athlete: string;
  country: string;
}

export interface Port {
  name: string;
  number: number;
}

export interface ServiceObject {
  id: string;
  name: string;
  namespace: string;
  ports: Port[];
}

export interface FormField {
  key: string;
  help: string;
  type: string;
  label: string;
  children: any;
  depends_on: string | null;
  default_value: any;
  value: string;
  showPassword?: boolean;
  options?: any
  validation: any,
  placeholder?: string;
  update?: boolean;
}

export interface DeploymentOptions {
  name: string;
  color: string;
  icon: string;
  value: string;
}
export interface ResourceInfo {
  cpuVcpu: string | number;
  memoryGb: string | number;
  instanceHourRate: string | number;
  currency?: string;
}