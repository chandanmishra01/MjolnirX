import {
  isAddressZero,
  USD_DECIMALS,
  MAX_REFERRAL_CODE_LENGTH,
  getTwitterIntentURL,
  REFERRAL_CODE_QUERY_PARAM,
} from "lib/legacy";
import { encodeReferralCode, getReferralCodeOwner } from "domain/referrals";
import { bigNumberify, formatAmount } from "lib/numbers";
import { t } from "@lingui/macro";
import { getRootUrl } from "lib/url";

export const REFERRAL_CODE_REGEX = /^\w+$/; // only number, string and underscore is allowed
export const REGEX_VERIFY_BYTES32 = /^0x[0-9a-f]{64}$/;

export function isRecentReferralCodeNotExpired(referralCodeInfo) {
  const REFERRAL_DATA_MAX_TIME = 60000 * 5; // 5 minutes
  if (referralCodeInfo.time) {
    return referralCodeInfo.time + REFERRAL_DATA_MAX_TIME > Date.now();
  }
}

export async function getReferralCodeTakenStatus(account, referralCode, chainId) {
  const referralCodeBytes32 = encodeReferralCode(referralCode);
  const [owner] = await Promise.all([
    getReferralCodeOwner(chainId, referralCodeBytes32),
  ]);

  const taken = 
    !isAddressZero(owner) && (owner !== account || (owner === account));

  const referralCodeTakenInfo = {
    taken: taken,
    owner,
  };

  if (referralCodeTakenInfo.taken) {
    return { status: "all", info: referralCodeTakenInfo };
  }
  return { status: "none", info: referralCodeTakenInfo };
}

export function getTierIdDisplay(tierId) {
  return Number(tierId) + 1;
}

export const tierRebateInfo = {
  0: 5,
  1: 10,
  2: 15,
};

export const tierDiscountInfo = {
  0: 5,
  1: 10,
  2: 10,
};

function areObjectsWithSameKeys(obj1, obj2) {
  return Object.keys(obj1).every((key) => key in obj2);
}

export function deserializeSampleStats(input) {
  const parsedData = JSON.parse(input);
  if (!Array.isArray(parsedData)) return [];
  return parsedData
    .map((data) => {
      if (!areObjectsWithSameKeys(getSampleReferrarStat(), data)) return null;
      return Object.keys(data).reduce((acc, cv) => {
        const currentValue = data[cv];
        if (currentValue?.type === "BigNumber") {
          acc[cv] = bigNumberify(currentValue.hex || 0);
        } else {
          acc[cv] = currentValue;
        }
        return acc;
      }, {});
    })
    .filter(Boolean);
}

export const getSampleReferrarStat = (code = "", ownerOnOtherNetwork = "", account = "") => {
  return {
    discountUsd: bigNumberify(0),
    referralCode: code,
    totalRebateUsd: bigNumberify(0),
    tradedReferralsCount: 0,
    registeredReferralsCount: 0,
    trades: 0,
    volume: bigNumberify(0),
    time: Date.now(),
    ownerOnOtherChain: {
      code: encodeReferralCode(code),
      codeString: code,
      owner: undefined,
      isTaken: !isAddressZero(ownerOnOtherNetwork),
      isTakenByCurrentUser:
        !isAddressZero(ownerOnOtherNetwork) && ownerOnOtherNetwork.toLowerCase() === account.toLowerCase(),
    },
  };
};

export function getUSDValue(value, decimals = 2) {
  return `$${formatAmount(value, USD_DECIMALS, decimals, true, "0.00")}`;
}

export function getCodeError(value) {
  const trimmedValue = value.trim();
  if (!trimmedValue) return "";

  if (trimmedValue.length > MAX_REFERRAL_CODE_LENGTH) {
    return t`The referral code can't be more than ${MAX_REFERRAL_CODE_LENGTH} characters.`;
  }

  if (!REFERRAL_CODE_REGEX.test(trimmedValue)) {
    return t`Only letters, numbers and underscores are allowed.`;
  }
  return "";
}

export function getReferralCodeTradeUrl(referralCode) {
  return `${getRootUrl()}/#/trade/?${REFERRAL_CODE_QUERY_PARAM}=${referralCode}`;
}

export function getTwitterShareUrl(referralCode) {
  const message = ["Trying out trading on Mjolnri Exchange, use leverage to trade $USDC, $WBTC, and $ETH 📈", "For fee discounts use:"];
  const shareURL = getReferralCodeTradeUrl(referralCode);

  return getTwitterIntentURL(message, shareURL);
}
