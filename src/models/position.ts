export enum PositionSide {
  LONG = 'LONG',
  SHORT = 'SHORT',
  FLAT = 'FLAT'
}

export interface PositionState {
  side: PositionSide;
  entryPrice: number;
  quantity: number;
  symbol: string;
  timestamp: number;
}
