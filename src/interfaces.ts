export interface IConnectionData {
  jwtToken: string | null;
}

export interface IProviderConnectionData extends IConnectionData {
  providerName: string;
}
