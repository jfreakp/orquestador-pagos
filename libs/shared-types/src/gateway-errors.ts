export class GatewayCommunicationError extends Error {
  constructor(
    message: string,
    public override readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'GatewayCommunicationError';
  }
}

export class GatewayBusinessError extends Error {
  constructor(
    message: string,
    public readonly errorCode?: string,
  ) {
    super(message);
    this.name = 'GatewayBusinessError';
  }
}
