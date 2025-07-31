export const tradingPairs = [
  {
    symbol: "BTC/USD",
    wsSymbol: "btcusdt",
    name: "Bitcoin",
    logo: "https://assets.coincap.io/assets/icons/btc@2x.png",
  },
  {
    symbol: "ETH/USD",
    wsSymbol: "ethusdt",
    name: "Ethereum",
    logo: "https://assets.coincap.io/assets/icons/eth@2x.png",
  },
  {
    symbol: "SOL/USD",
    wsSymbol: "solusdt",
    name: "Solana",
    logo: "https://assets.coincap.io/assets/icons/sol@2x.png",
  },
  {
    symbol: "BNB/USD",
    wsSymbol: "bnbusdt",
    name: "Binance Coin",
    logo: "https://assets.coincap.io/assets/icons/bnb@2x.png",
  },
  {
    symbol: "XRP/USD",
    wsSymbol: "xrpusdt",
    name: "Ripple",
    logo: "https://assets.coincap.io/assets/icons/xrp@2x.png",
  },
  {
    symbol: "ADA/USD",
    wsSymbol: "adausdt",
    name: "Cardano",
    logo: "https://assets.coincap.io/assets/icons/ada@2x.png",
  },
  {
    symbol: "DOGE/USD",
    wsSymbol: "dogeusdt",
    name: "Dogecoin",
    logo: "https://assets.coincap.io/assets/icons/doge@2x.png",
  },
  {
    symbol: "MATIC/USD",
    wsSymbol: "maticusdt",
    name: "Polygon",
    logo: "https://assets.coincap.io/assets/icons/matic@2x.png",
  },
  {
    symbol: "DOT/USD",
    wsSymbol: "dotusdt",
    name: "Polkadot",
    logo: "https://assets.coincap.io/assets/icons/dot@2x.png",
  },
  {
    symbol: "LINK/USD",
    wsSymbol: "linkusdt",
    name: "Chainlink",
    logo: "https://assets.coincap.io/assets/icons/link@2x.png",
  },
  // more 10s currencies
  {
    symbol: "AVAX/USD",
    wsSymbol: "avaxusdt",
    name: "Avalanche",
    logo: "https://assets.coincap.io/assets/icons/avax@2x.png",
  },
  {
    symbol: "UNI/USD",
    wsSymbol: "uniusdt",
    name: "Uniswap",
    logo: "https://assets.coincap.io/assets/icons/uni@2x.png",
  },
  {
    symbol: "ATOM/USD",
    wsSymbol: "atomusdt",
    name: "Cosmos",
    logo: "https://assets.coincap.io/assets/icons/atom@2x.png",
  },
  {
    symbol: "LTC/USD",
    wsSymbol: "ltcusdt",
    name: "Litecoin",
    logo: "https://assets.coincap.io/assets/icons/ltc@2x.png",
  },
  {
    symbol: "ALGO/USD",
    wsSymbol: "algousdt",
    name: "Algorand",
    logo: "https://assets.coincap.io/assets/icons/algo@2x.png",
  },
  {
    symbol: "FIL/USD",
    wsSymbol: "filusdt",
    name: "Filecoin",
    logo: "https://assets.coincap.io/assets/icons/fil@2x.png",
  },
  {
    symbol: "NEAR/USD",
    wsSymbol: "nearusdt",
    name: "NEAR Protocol",
    logo: "https://assets.coincap.io/assets/icons/near@2x.png",
  },
  {
    symbol: "VET/USD",
    wsSymbol: "vetusdt",
    name: "VeChain",
    logo: "https://assets.coincap.io/assets/icons/vet@2x.png",
  },
  {
    symbol: "AAVE/USD",
    wsSymbol: "aaveusdt",
    name: "Aave",
    logo: "https://assets.coincap.io/assets/icons/aave@2x.png",
  },
  {
    symbol: "FTM/USD",
    wsSymbol: "ftmusdt",
    name: "Fantom",
    logo: "https://assets.coincap.io/assets/icons/ftm@2x.png",
  },
];

export function getPairBySymbol(symbol) {
  return tradingPairs.find((pair) => pair.wsSymbol === symbol);
}

export function formatPairDisplay(pair) {
  return `${pair.name} (${pair.symbol})`;
}
