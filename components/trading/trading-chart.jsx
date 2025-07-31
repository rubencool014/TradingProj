"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "next-themes";

export default function TradingChart({ pair }) {
  const container = useRef();
  const { theme } = useTheme();

  useEffect(() => {
    const script = document.createElement("script");
    script.src =
      "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = `
      {
        "autosize": true,
        "symbol": "BINANCE:${pair.wsSymbol.toUpperCase()}",
        "interval": "D",
        "timezone": "Etc/UTC",
        "theme": "${theme === "dark" ? "dark" : "light"}",
        "style": "1",
        "locale": "en",
        "enable_publishing": false,
        "hide_top_toolbar": true,
        "allow_symbol_change": true,
        "save_image": false,
        "calendar": false,
        "hide_volume": true,
        "support_host": "https://www.tradingview.com"
      }`;

    if (container.current) {
      container.current.innerHTML = "";
      container.current.appendChild(script);
    }

    return () => {
      if (container.current) {
        container.current.innerHTML = "";
      }
    };
  }, [pair, theme]);

  return (
    <div className="tradingview-widget-container h-full" ref={container}>
      <div className="tradingview-widget-container__widget h-full"></div>
    </div>
  );
}
