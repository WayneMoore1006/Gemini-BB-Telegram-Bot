export enum SignalDirection {
  LONG = 'LONG',
  SHORT = 'SHORT',
  NONE = 'NONE'
}

export interface TradingSignal {
  symbol: string;
  interval: string;
  direction: SignalDirection;
  price: number;
  timestamp: number;
  bbValues: {
    upper: number;
    lower: number;
    middle: number;
  };
}
