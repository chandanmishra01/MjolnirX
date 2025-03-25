import React, {
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import { getChartToken } from "./ExchangeTVChart";
import { getTokenInfo } from "domain/tokens";
import { getToken } from "config/tokens";
import { SWAP } from "lib/legacy";

let tvScriptLoadingPromise;

export default function ExchangeTVChartPyth(props) {
  const {
    swapOption,
    fromTokenAddress,
    toTokenAddress,
    infoTokens,
    chainId,
    positions,
    savedShouldShowPositionLines,
    orders,
    setToTokenAddress,
  } = props;

  const fromToken = getTokenInfo(infoTokens, fromTokenAddress);
  const toToken = getTokenInfo(infoTokens, toTokenAddress);
  const [chartToken, setChartToken] = useState({
    maxPrice: null,
    minPrice: null,
  });
  useEffect(() => {
    const tmp = getChartToken(swapOption, fromToken, toToken, chainId);
    setChartToken(tmp);
  }, [swapOption, fromToken, toToken, chainId]);

  const symbol = chartToken ? (chartToken.isWrapped ? chartToken.baseSymbol : chartToken.symbol) : undefined;
  var marketName = chartToken ? "PYTH:" + symbol + "USD" : undefined;
  if (symbol === "TREAT")
    marketName = "KUCOIN:TREATUSDT"

  if (symbol === "BONE")
    marketName = "OKX:BONEUSDT"

  const currentOrders = useMemo(() => {
    if (swapOption === SWAP || !chartToken) {
      return [];
    }

    return orders.filter((order) => {
      if (order.type === SWAP) {
        // we can't show non-stable to non-stable swap orders with existing charts
        // so to avoid users confusion we'll show only long/short orders
        return false;
      }

      const indexToken = getToken(chainId, order.indexToken);
      return order.indexToken === chartToken.address || (chartToken.isNative && indexToken.isWrapped);
    });
  }, [orders, chartToken, swapOption, chainId]);

  const onLoadScriptRef = useRef();

  useEffect(() => {
    onLoadScriptRef.current = createWidget;

    onLoadScriptRef.current.crea

    if (!tvScriptLoadingPromise) {
      tvScriptLoadingPromise = new Promise((resolve) => {
        const script = document.createElement("script");
        script.id = "tradingview-widget-loading-script";
        script.src = "https://s3.tradingview.com/tv.js";
        script.type = "text/javascript";
        script.async = true;
        script.onload = resolve;
        document.head.appendChild(script);
      });
    }

    tvScriptLoadingPromise.then(
      () => onLoadScriptRef.current && onLoadScriptRef.current()
    );

    return () => (onLoadScriptRef.current = null);

    function createWidget() {
      if (document.getElementById("tradingview") && "TradingView" in window) {
        new window.TradingView.widget({
          width: "auto",
          height: 500,
          symbol: marketName,
          interval: "15",
          timezone: "Etc/UTC",
          theme: "dark",
          style: "1",
          locale: "en",
          toolbar_bg: "rgba(21, 21, 21, 1)",
          enable_publishing: false,
          allow_symbol_change: true,
          container_id: "tradingview",
          backgroundColor: "rgba(21, 21, 21, 1)",
          gridColor: "rgba(34, 38, 46, 0.06)",
          support_host: "https://www.tradingview.com",
        });
      }
    }

  }, [marketName]);

  return (
    <div className = "tradingview-widget-container" >
      <div id = "tradingview" / >
      {/* <div>Powered by Pyth</div> */}
    </div>
  );
}
