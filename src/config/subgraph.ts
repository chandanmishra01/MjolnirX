import { ARBITRUM, PEGASUS, PHOENIX, BSCTESTNET, PUPPYNET } from "./chains";

export const SUBGRAPH_URLS = {
  [ARBITRUM]: {
    stats: "https://api.thegraph.com/subgraphs/name/gmx-io/gmx-stats",
    referrals: "https://api.thegraph.com/subgraphs/name/gmx-io/gmx-arbitrum-referrals",
    nissohVault: "https://api.thegraph.com/subgraphs/name/nissoh/gmx-vault",
  },

  [PEGASUS]: {
    stats: "https://graph.pegasus.lightlink.io/query/subgraphs/name/amped-finance/trades",
    referrals: "https://graph.pegasus.lightlink.io/query/subgraphs/name/amped-finance/referrals",
    trades:"https://graph.pegasus.lightlink.io/query/subgraphs/name/amped-finance/trades",  
    raw:"https://graph.pegasus.lightlink.io/query/subgraphs/name/amped-finance/trades",  
    price: "https://graph.pegasus.lightlink.io/query/subgraphs/name/amped-finance/trades",
    ordernew: "https://graph.pegasus.lightlink.io/query/subgraphs/name/amped-finance/orders",
    points: "https://graph.phoenix.lightlink.io/query/subgraphs/name/amped-finance/tradespointsnew2"

  },
  
  [PHOENIX]: {
    stats: "https://graph.phoenix.lightlink.io/query/subgraphs/name/amped-finance/trades",
    referrals: "https://graph.phoenix.lightlink.io/query/subgraphs/name/amped-finance/referrals",
    trades:"https://graph.phoenix.lightlink.io/query/subgraphs/name/amped-finance/trades",  
    raw:"https://graph.phoenix.lightlink.io/query/subgraphs/name/amped-finance/trades",  
    price: "https://graph.phoenix.lightlink.io/query/subgraphs/name/amped-finance/trades",
    ordernew: "https://graph.phoenix.lightlink.io/query/subgraphs/name/amped-finance/orders",
    points: "https://graph.phoenix.lightlink.io/query/subgraphs/name/amped-finance/tradespointsnew2"
  },

  [BSCTESTNET]: {
    stats: "https://api.studio.thegraph.com/query/90987/amped-finance-trades/version/latest",
    referrals: "https://graph.phoenix.lightlink.io/query/subgraphs/name/amped-finance/referrals",
    trades:"https://api.studio.thegraph.com/query/90987/amped-finance-trades/version/latest",  
    raw:"https://api.studio.thegraph.com/query/90987/amped-finance-trades/version/latest",  
    price: "https://api.studio.thegraph.com/query/90987/amped-finance-trades/version/latest",
    ordernew: "https://api.studio.thegraph.com/query/90987/amped-finance-orders/version/latest",
    points: "https://graph.phoenix.lightlink.io/query/subgraphs/name/amped-finance/tradespointsnew2"
  },

  [PUPPYNET]: {
    stats: "http://54.172.168.160:8000/subgraphs/name/positions-finance/trades/",
    referrals: "http://54.172.168.160:8000/subgraphs/name/positions-finance/referrals",
    trades:"http://54.172.168.160:8000/subgraphs/name/positions-finance/trades/",  
    raw:"http://54.172.168.160:8000/subgraphs/name/positions-finance/trades/",  
    price: "http://54.172.168.160:8000/subgraphs/name/positions-finance/trades/",
    ordernew: "http://54.172.168.160:8000/subgraphs/name/positions-finance/orders",
    points: "https://graph.phoenix.lightlink.io/query/subgraphs/name/amped-finance/tradespointsnew2"
  },
  
  common: {
    chainLink: "https://graph.phoenix.lightlink.io/query/subgraphs/name/amped-finance/trades"
  },
};
