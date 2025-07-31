// utils/api.js
const BINANCE_API_BASE = "https://api.binance.com/api/v3";

export async function fetchCryptoData() {
  try {
    // Get ticker prices from Binance
    const [tickerResponse, btcResponse] = await Promise.all([
      fetch(
        `${BINANCE_API_BASE}/ticker/24hr?symbols=["BTCUSDT","ETHUSDT","BNBUSDT","SOLUSDT","XRPUSDT","ADAUSDT","DOGEUSDT","MATICUSDT","DOTUSDT","LTCUSDT"]`
      ),
      fetch(`${BINANCE_API_BASE}/ticker/price?symbol=BTCUSDT`),
    ]);

    const tickerData = await tickerResponse.json();
    const btcPrice = await btcResponse.json();

    // Map the data to match our application's format
    const formattedData = tickerData.map((ticker) => {
      const symbol = ticker.symbol.replace("USDT", "");
      return {
        id: symbol.toLowerCase(),
        symbol: symbol.toLowerCase(),
        name: getFullName(symbol),
        current_price: parseFloat(ticker.lastPrice),
        price_change_percentage_24h: parseFloat(ticker.priceChangePercent),
        market_cap: parseFloat(ticker.quoteVolume),
        image: `https://assets.coincap.io/assets/icons/${symbol.toLowerCase()}@2x.png`,
      };
    });

    return formattedData;
  } catch (error) {
    console.error("Error fetching crypto data:", error);
    throw error;
  }
}

function getFullName(symbol) {
  const names = {
    BTC: "Bitcoin",
    ETH: "Ethereum",
    BNB: "Binance Coin",
    SOL: "Solana",
    XRP: "Ripple",
    ADA: "Cardano",
    DOGE: "Dogecoin",
    MATIC: "Polygon",
    DOT: "Polkadot",
    LTC: "Litecoin",
  };
  return names[symbol] || symbol;
}
