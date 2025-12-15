export interface UserData {
    name: string;
    email: string;
    userName: string;
    owner: string;
}
export interface LoginData {
    username: string;
    password: string;
}

export interface RegistrationData {
    type: string;
    orgName: string;
    username: string;
    password: string;
    email: string;
    address: string;
    terms: boolean;
}
export interface ResetPasswordData {
    password: string;
    oldPassword: string;
    orgName: string;
    username: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  isVerfied: string | boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  environments: Environment[];
}

export interface Environment {
  id: string;
  name: string;
}

export interface PolicyRaw {
  V0: string;
  V1: string;
  V2: string;
  V3: string;
  V4: string;
}

export interface PolicyMapped {
  userid: string;
  accountid?: string;
  projectid: string;
  envid: string;
  projectname: string;
  envname: string;
  permissions: string[];
}
