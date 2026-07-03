export interface GatewayAuthResult {
  accessToken: string;
  refreshToken?: string;
  expiresAt: Date;
}

export interface GatewayAuthClient {
  authorizeAccess(): Promise<GatewayAuthResult>;
  refreshToken(tokenIn: string): Promise<GatewayAuthResult>;
  revokeToken?(tokenIn: string): Promise<void>;
}
