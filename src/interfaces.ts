export interface IConnectionData {
  jwtToken: string;
}

export interface IProviderConnectionData extends IConnectionData {
  providerName: string;
}
