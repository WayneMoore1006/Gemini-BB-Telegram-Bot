export interface Candle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  isClosed: boolean;
}

export interface BBValues {
  upper: number;
  middle: number;
  lower: number;
  timestamp: number;
}
