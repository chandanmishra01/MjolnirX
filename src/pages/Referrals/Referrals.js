import "./Referrals.css";
import React, { useMemo } from "react";
import { useLocalStorage } from "react-use";
import { Trans, t } from "@lingui/macro";
import { useParams } from "react-router-dom";
import SEO from "components/Common/SEO";
import Tab from "components/Tab/Tab";
import Loader from "components/Common/Loader";
import Footer from "components/Footer/Footer";
import { getPageTitle, isHashZero } from "lib/legacy";
import {
  useReferralsData,
  registerReferralCode,
  useCodeOwner,
  useReferrerTier,
  useUserReferralCode,
} from "domain/referrals";
import JoinReferralCode from "components/Referrals/JoinReferralCode";
import AffiliatesStats from "components/Referrals/AffiliatesStats";
import TradersStats from "components/Referrals/TradersStats";
import AddAffiliateCode from "components/Referrals/AddAffiliateCode";
import { deserializeSampleStats, isRecentReferralCodeNotExpired } from "components/Referrals/referralsHelper";
import { ethers } from "ethers";
import { useLocalStorageSerializeKey } from "lib/localStorage";
import { REFERRALS_SELECTED_TAB_KEY } from "config/localStorage";
import { useChainId } from "lib/chains";
import ExternalLink from "components/ExternalLink/ExternalLink";
import {
  useWeb3Modal,
  useWeb3ModalAccount,
  useWeb3ModalProvider,
  useDisconnect,
  createWeb3Modal,
  defaultConfig
} from "@web3modal/ethers5/react";

const TRADERS = "Traders";
const AFFILIATES = "Affiliates";
const TAB_OPTIONS = [TRADERS, AFFILIATES];

function Referrals({ connectWallet, setPendingTxns, pendingTxns }) {
  const { isConnected: active, address: walletAccount } = useWeb3ModalAccount()
  const { walletProvider } = useWeb3ModalProvider();
  const library = useMemo(() => {
    if (walletProvider) {
      return new ethers.providers.Web3Provider(walletProvider);
    }
  }, [walletProvider])
  const { account: queryAccount } = useParams();
  let account;
  if (queryAccount && ethers.utils.isAddress(queryAccount)) {
    account = ethers.utils.getAddress(queryAccount);
  } else {
    account = walletAccount;
  }
  const { chainId } = useChainId();
  const [activeTab, setActiveTab] = useLocalStorage(REFERRALS_SELECTED_TAB_KEY, TRADERS);
  const { data: referralsData, loading } = useReferralsData(chainId, account);
  const [recentlyAddedCodes, setRecentlyAddedCodes] = useLocalStorageSerializeKey([chainId, "REFERRAL", account], [], {
    deserializer: deserializeSampleStats,
  });
  const { userReferralCode, userReferralCodeString } = useUserReferralCode(library, chainId, account);
  const { codeOwner } = useCodeOwner(library, chainId, account, userReferralCode);
  const { referrerTier: traderTier } = useReferrerTier(library, chainId, codeOwner);

  function handleCreateReferralCode(referralCode) {
    return registerReferralCode(chainId, referralCode, library, {
      sentMsg: t`Referral code submitted!`,
      failMsg: t`Referral code creation failed.`,
      pendingTxns,
    });
  }

  function renderAffiliatesTab() {
    const isReferralCodeAvailable =
      referralsData?.codes?.length > 0 || recentlyAddedCodes?.filter(isRecentReferralCodeNotExpired).length > 0;
    if (loading) return <Loader />;
    if (isReferralCodeAvailable) {
      return (
        <AffiliatesStats
          referralsData={referralsData}
          handleCreateReferralCode={handleCreateReferralCode}
          setRecentlyAddedCodes={setRecentlyAddedCodes}
          recentlyAddedCodes={recentlyAddedCodes}
          chainId={chainId}
        />
      );
    } else {
      return (
        <AddAffiliateCode
          handleCreateReferralCode={handleCreateReferralCode}
          active={active}
          connectWallet={connectWallet}
          recentlyAddedCodes={recentlyAddedCodes}
          setRecentlyAddedCodes={setRecentlyAddedCodes}
        />
      );
    }
  }

  function renderTradersTab() {
    if (loading) return <Loader />;
    if (isHashZero(userReferralCode) || !account || !userReferralCode) {
      return (
        <JoinReferralCode
          connectWallet={connectWallet}
          active={active}
          setPendingTxns={setPendingTxns}
          pendingTxns={pendingTxns}
        />
      );
    }
    return (
      <TradersStats
        userReferralCodeString={userReferralCodeString}
        chainId={chainId}
        referralsData={referralsData}
        setPendingTxns={setPendingTxns}
        pendingTxns={pendingTxns}
        traderTier={traderTier}
      />
    );
  }
  const TAB_OPTION_LABELS = { [TRADERS]: t`Traders`, [AFFILIATES]: t`Affiliates` };

  return (
    <SEO title={getPageTitle("Referrals")}>
      <div className="default-container page-layout Referrals">
        <div className="section-title-block">
          <div className="section-title-icon" />
          <div className="section-title-content">
            <div className="Page-title font-kufam">
              <Trans>Referrals</Trans>
            </div>
            <div className="Page-description">
              <Trans>
                Get fee discounts and earn rebates through the MJX referral program. For more information, please read the{" "}
                <ExternalLink href="#">referral program details</ExternalLink>.
              </Trans>
            </div>
          </div>
        </div>
        <div className="referral-tab-container">
          <Tab
            options={TAB_OPTIONS}
            optionLabels={TAB_OPTION_LABELS}
            option={activeTab}
            setOption={setActiveTab}
            onChange={setActiveTab}
          />
        </div>
        {activeTab === AFFILIATES ? renderAffiliatesTab() : renderTradersTab()}
        {/* <div className="Home-token-card-options">
            {renderTradersTab()}
            {renderAffiliatesTab()}
        </div> */}
      </div>
      <Footer />
    </SEO>
  );
}

export default Referrals;
