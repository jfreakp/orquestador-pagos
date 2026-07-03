export type AhoritaCredentials = {
  clientCode: string;
  bankPublicKeyPem: string;
  clientPrivateKeyPem: string;
  merchantHash: string;
};

export type PlaceToPayCredentials = {
  login: string;
  secretKey: string;
};

export type GatewayCredentials = AhoritaCredentials | PlaceToPayCredentials;
