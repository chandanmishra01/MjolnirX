import { getChainName } from "config/chains";
import { useChainId } from "lib/chains";
import { Helmet } from "react-helmet";

function SEO(props) {
  const {chainId} = useChainId()
  const { children, ...customMeta } = props;
  const meta = {
    title: "Amped Finance | Decentralised Trading Platform",
    description:
      `Trade spot or perpetual BTC, ETH and other cryptocurrencies with up to 20x leverage directly from your wallet on ${getChainName(chainId)}.`,
    image: "https://amp.io/og.png",
    type: "exchange",
    ...customMeta,
  };
  return (
    <>
      <Helmet>
        <title>{meta.title}</title>
        <meta name="robots" content="follow, index" />
        <meta content={meta.description} name="description" />
        <meta property="og:type" content={meta.type} />
        <meta property="og:site_name" content="AMP" />
        <meta property="og:description" content={meta.description} />
        <meta property="og:title" content={meta.title} />
        <meta property="og:image" content={meta.image} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@amp_io" />
        <meta name="twitter:title" content={meta.title} />
        <meta name="twitter:description" content={meta.description} />
        <meta name="twitter:image" content={meta.image} />
      </Helmet>
      {children}
    </>
  );
}

export default SEO;
