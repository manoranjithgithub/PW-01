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