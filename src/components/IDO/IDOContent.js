import React, { useMemo, useState, useEffect } from "react";
import moment from "moment";
import useSWR from "swr";
import styled from 'styled-components'
import "./IDOContent.css";
import ProgressBar from "./progress-bar.component";
import { Progress } from 'react-sweet-progress';
import "react-sweet-progress/lib/style.css";

import idoTopImg from "img/ido_top.png";
import idoBluV2Img from "img/ido_bluespade_v2.svg";
import idoDAOImg from "img/ido_dao.svg";
import idoSolanaImg from "img/ido_solana.svg";
import idoNFTImg from "img/ido_nft.svg";
import idoArbitrumImg from "img/ido_arbitrum.svg";
import idoBonusImg from "img/ido_bonus.png";

import { useChainId } from "lib/chains";
import { getContract } from "config/contracts";
import { callContract, contractFetcher } from "lib/contracts";
import { bigNumberify, formatAmount, parseValue } from "lib/numbers";

import { ethers } from "ethers";
import Reader from "abis/ReaderV2.json";
import IDO from "abis/BluIDO.json";
import Token from "abis/Token.json";
import { Trans, t } from "@lingui/macro";
import usdt from "img/ic_usdt_40.svg";
import {FiCopy} from 'react-icons/fi'
import { helperToast } from "lib/helperToast";
import Clock from './Clock';
import { approveTokens } from "domain/tokens";
import {
  PLACEHOLDER_ACCOUNT,
} from "lib/legacy";
import {
  useWeb3Modal,
  useWeb3ModalAccount,
  useWeb3ModalProvider,
  useDisconnect,
  createWeb3Modal,
  defaultConfig
} from "@web3modal/ethers5/react";

const Container = styled.div`
`

const StyledInfo = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 15px;
  font-size: 18px;
  border-bottom: 1px solid #ffffff50;
`

const StyledInfoInsufficientFudns = styled.div`
  width: 10%;
  align-items: left;
  font-size: 14px;
  color: #bbbbbb;
  font-size: 1.5rem;
`

const StyledInfoWalletBalance = styled.div`
  display: flex;
  justify-content: flex-end;
  width: 50%;
  align-items: right;
  font-size: 1.5rem;
  color: #bbbbbb;
`

const StyledInputArea = styled.div`
  margin-top: 20px;
  height: 80px;
  background: #212332;
  border-radius: 25px;
  border: solid 1px rgb(111, 106, 106);
`

const StyledInput = styled.input`
  background: transparent;
  border: none;
  margin-left: 15px;
  width: 100%;
  outline: none;
  color: #bbbbbb;
  font-size: 2rem;

  &:focus {
    border: none;
  }
  &:active {
    border: none;
  }
`

const StyledButton = styled.button`
  width: 100%;
  min-width: 170px;
  background: linear-gradient(96.36deg, #1BE1CF -1.32%, #3F7BD0 49.23%, #5637D1 103.04%);
  border: none;
  cursor: pointer;
  color: white;
  border-radius: 10px;
  font-size: 16px;
  padding: 10px 15px;
  margin-top: 10px;
  
  &:hover {
    background: linear-gradient(96.36deg, #5637D1 -1.32%, #3F7BD0 49.23%, #1BE1CF 103.04%);
  }
  &:disabled {
    background: linear-gradient(96.36deg, #1BE1CF -1.32%, #3F7BD0 49.23%, #5637D1 103.04%);
  }
`

const MaxButton = styled.button`
  background: #ffffff00;
  border: none;
  color: #557ccf;
  font-weight: bold;
  font-size: 1.7rem;

  &:hover {
    opacity: 0.7;
  }
`

const LabelRow = styled.div`
  height: 30%;
  display: flex;
  justify-content: flex-end;
  font-size: 1rem;
  padding-top: 10px;
  justify-content: space-between;
  margin-left: 20px;
  margin-right: 20px;
`

const InputRow = styled.div`
  height: 70%;
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  padding-right: 10px;
`

const DropdownContainer = styled.div`
  position: relative;
  display: inline-block;
`

const DropdownButton = styled.button`
  background-color: transparent; /* Green */
  color: white;
  padding: 16px;
  font-size: 16px;
  border: none;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
`

const StyledFlex = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 1.8rem;
  color: #a0a3c4;
`

const StyledImage = styled.img`
  width: 30px;
  margin-right: 5px;
`

function getUTCDate(timestamp) {
  const num_time = parseInt(timestamp) * 1000;
  const date = new Date(num_time);
  return moment.utc(date).format("MMMM Do, HH:mm UTC");
}

export default function IDOContent(props) {
  const {
    setPendingTxns,
    connectWallet,
  } = props;

  const { isConnected: active, address: account } = useWeb3ModalAccount()
  const { walletProvider } = useWeb3ModalProvider();
  const library = useMemo(() => {
    if (walletProvider) {
      return new ethers.providers.Web3Provider(walletProvider);      
    }
  }, [walletProvider])
  const { chainId } = useChainId();
  
  const idoAddress = getContract(chainId, "IDO");
  const readerAddress = getContract(chainId, "Reader");
  const usdtAddress = getContract(chainId, "USDT");

  const { data: startTimeData } = useSWR(true && [true, chainId, idoAddress, "startTime"], {
    fetcher: contractFetcher(library, IDO),
  });
  
  const { data: endTimeData } = useSWR(true && [true, chainId, idoAddress, "endTime"], {
    fetcher: contractFetcher(library, IDO),
  });

  let startTime = 0;
  let endTime = 0;

  if (startTimeData & endTimeData) {
    startTime = parseInt(formatAmount(startTimeData, 0, 0))
    endTime = parseInt(formatAmount(endTimeData, 0, 0))
  }

  const { data: balanceArray0 } = useSWR(true && [true, chainId, readerAddress, "getTokenBalances", idoAddress], {
    fetcher: contractFetcher(library, Reader, [[usdtAddress]]),
  });

  const { data: balanceArray1 } = useSWR(active && [active, chainId, readerAddress, "getTokenBalances", account], {
    fetcher: contractFetcher(library, Reader, [[usdtAddress]]),
  });

  let usdtBalanceIDO = bigNumberify(0); 
  let usdtBalanceAccount = bigNumberify(0);

  if (balanceArray0) usdtBalanceIDO = bigNumberify("10000000000").add(balanceArray0[0]);
  if (balanceArray1) usdtBalanceAccount = balanceArray1[0];

  const regInput = React.useRef();
  
  const [inputValue, setInputValue] = useState(0);

  const [referralLink, setReferralLink] = useState("")

  const [referralAddress, setReferralAddress] = useState("")

  const [ended, setEnded] = useState(false);

  const [isApproving, setIsApproving] = useState(false);
  const [isWaitingForApproval, setIsWaitingForApproval] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: tokenAllowance } = useSWR(
    [active, chainId, usdtAddress, "allowance", account || PLACEHOLDER_ACCOUNT, idoAddress],
    {
      fetcher: contractFetcher(library, Token),
    }
  );

  const inputAmount = parseValue(inputValue, 6)
  const needApproval = tokenAllowance && inputAmount && inputAmount.gt(tokenAllowance);

  const checkReferralAddress = (ref) => {
    if(ethers.utils.isAddress(ref)) {
      if(account && account.toLowerCase() === ref.toLowerCase()) {
        setReferralAddress("")
      } else {
        setReferralAddress(ref)
      }
    } else {
      setReferralAddress("")
    }
}

  useEffect(() => {
    
    setInputValue(0);

    if (account)
      setReferralLink(`${window.location.origin}/#/ido?ref=${account}`);

    const refCodeNum = window.location.href.search("ref");
    if (refCodeNum) {
      checkReferralAddress(window.location.href.substring(refCodeNum + 4, window.location.href.length));
    } else {
      setReferralAddress("");
    }

  }, [active, window.location.href])

  useEffect(() => {
    if (needApproval)
      setIsWaitingForApproval(false);
  }, [needApproval])

  const onMax = () => {
    let maxValue = formatAmount(usdtBalanceAccount, 6, 4);
    
    if (maxValue > 0) setInputValue(maxValue);
  }

  const onInputChange = () => {
    setInputValue(regInput.current.value);
  }

  const handleCopyReferralLink = (text) => {
    navigator.clipboard.writeText(text)
    .then(() => {
      helperToast.success(
        <div>
          <Trans>
            Copyed Successfully.
          </Trans>
        </div>)
    })
    .catch((error) => {
      console.error(error);
    });
  }

  const getCompletedPercentage = () => {
    const percent = formatAmount(usdtBalanceIDO, 6, 4) / 200000 * 100;
    if (percent > 100)
      return 100;
    return percent;    
  }

  const getError = () => {
    if (Number(startTime) * 1000 > Date.now()) {
      return ["IDO has not started yet"];
    } else if (Number(endTime) * 1000 < Date.now()) {
      return ["IDO has ended"];
    }

    if (!inputValue)
      return ["Enter an amount"]
    
    if (inputValue < 10)
      return ["Reminder: Minimum amount for Deposit is 10"]

    const compareAmount = parseFloat(formatAmount(usdtBalanceAccount, 6, 4));
    if (inputValue > compareAmount)
      return ["Insufficient Funds!"]

    return [false];
  };

  const isPrimaryEnabled = () => {
    if (!active) {
      return false;
    }
    const [error, modal] = getError();
    if (error && !modal) {
      return false;
    }
    if ((needApproval && isWaitingForApproval) || isApproving) {
      return false;
    }
    if (isApproving) {
      return false;
    }
    if (isSubmitting) {
      return false;
    }

    return true;
  };

  const getPrimaryText = () => {
    if (!active)
      return "Confirm your wallet connection!"

    const [error, modal] = getError();

    if (error && !modal) {
      return error;
    }

    if (needApproval && isWaitingForApproval) {
      return "Waiting for Approval";
    }
    if (isApproving) {
      return "Approving USDT";
    }
    if (needApproval) {
      return "Approve USDT";
    }

    if (isSubmitting) {
      return "Buying...";
    }

    return "Buy";
  }

  const approveFromToken = () => {
    approveTokens({
      setIsApproving,
      library,
      tokenAddress: usdtAddress,
      spender: idoAddress,
      chainId: chainId,
      onApproveSubmitted: () => {
        setIsWaitingForApproval(true);
      },
    });
  };

  const onClickPrimary = async () => {
    if (needApproval) {
      approveFromToken();
      return;
    }

    buyBLU();
  }

  const buyBLU = () => {
    let amount = regInput.current.value;
    if (amount < 10) {
      alert("Reminder: Minimum amount for Deposit is 10.")
      return;
    }

    setIsSubmitting(true);
    
    const contract = new ethers.Contract(idoAddress, IDO.abi, library.getSigner());
    const method = referralAddress === "" ? "buyTokensByUSDT" : "buyTokensByUSDTWithReferral";
    const value = parseValue(amount, 6)
    const params = referralAddress === "" ? [value] : [value, referralAddress];

    callContract(chainId, contract, method, params, {
        sentMsg: t`Buy submitted.`,
        failMsg: t`Buy failed.`,
        successMsg: `${(amount / 0.1).toString()} BLU bought with ${amount.toString()} USDT!`,
        setPendingTxns,
      })
        .then(async () => { })
        .finally(() => {
          setIsSubmitting(false);
        });
  }
  
  return (
    <div className="IDO-Glp">
        <div className="IDO-Top-card-options">
            <div className="IDO-Top-card-option-left">
                <div className="IDO-Top-card-option-left-status">
                    <div className="IDO-Top-card-option-left-image-div">
                        <div className="IDO-Top-card-option-left-status-text1">Bluespade IDO</div>
                        <img className="IDO-Top-card-option-left-image" src={idoTopImg} alt="MetaMask" />
                    </div>
                    <div className="IDO-Top-card-option-left-status-text3">Dear Valued Investor,</div>
                    <br />
                    <div className="IDO-Top-card-option-left-status-text3">Thank you for your interest in the IDO.</div>
                    <br />
                    <div className="IDO-Top-card-option-left-status-text3">Introducing Bluespade: a track record of success and a proven concept that gives you perpetual growth, stability, and profit that is sutainable.</div>
                    <br />
                    <div className="IDO-Top-card-option-left-status-text3">Bluespade generates real yield on investments by collecting the native blockchain token through trading, swapping, and liquidations. 90% of this yield is distributed back to the stakers,  60% to $BLP stakers and 30% to the $BLU stakers. There is a total supply of 20M $BLU tokens.</div>
                    <br />
                    <div className="IDO-Top-card-option-left-status-text3">The funds from our IDO will propel us forward in the perpetual dex market. What sets us apart? Our rapid implementation and a transparent team with over 30 years of combined experience in finance, marketing, business development, and blockchain.</div>
                    <br />
                    <div className="IDO-Top-card-option-left-status-text3">These funds will power our V2 launch, DAO development, and three major blockchain integrations, along with other exciting features we're keeping under wraps for now.</div>
                    <br />
                    <div className="IDO-Top-card-option-left-status-text3">Warm regards,</div>
                    <div className="IDO-Top-card-option-left-status-text3">Bluespade Team</div>
                </div>
            </div>
            <div className="IDO-Top-card-option-right">
                <div className="IDO-Top-card-option-right-content">
                    <div className="IDO-Tier-card-row">
                        <div className="IDO-Top-card-option-right-content-start">Start Time:</div>
                        <div>{startTime === 0 ? " ---" : getUTCDate(startTime)}</div>
                    </div>
                    <div className="IDO-Tier-card-row">
                        <div className="IDO-Top-card-option-right-content-start">End Time:</div>
                        <div>{endTime === 0 ? " ---" : getUTCDate(endTime)}</div>
                    </div>
                    <div className="IDO-Tier-card-row-time">
                        TIME REMAINING TO PARTICIPATE IN PRESALE
                    </div>
                    <div className="IDO-Tier-card-row-clock">
                        <Clock deadline={endTime * 1000} setEnded={(value) => setEnded(value)} />
                    </div>
                    <div className="IDO-Tier-card-row">
                        <div className="IDO-Top-card-option-right-content-start">{(formatAmount(usdtBalanceIDO, 6, 4) / 1000).toFixed(4)}K</div>
                        <div>200K USDT</div>
                    </div>
                    {/* <ProgressBar bgcolor={"#1be1cf"} completed={getCompletedPercentage()} height={28} /> */}
                    <Progress theme={{
                        success: {
                          symbol: '🏄‍',
                          color: 'rgb(223, 105, 180)'
                        },
                        active: {
                          symbol: '😀',
                          color: 'rgb(67, 79, 205)'
                        },
                        default: {
                          symbol: '😱',
                          color: 'rgb(67, 79, 205)'
                        }
                      }} 
                      percent={getCompletedPercentage()}
                      strokeWidth={30}
                      />
                    <br />
                    <div className="IDO-Tier-card-row">
                        <div className="IDO-Top-card-option-right-content-start">BLU Address:</div>
                        <div style={{"overflow-wrap": "anywhere"}}>0x759d34685468604c695De301ad11A9418e2f1038</div>
                    </div>
                    <Container>
                        <div>
                            <StyledInputArea>
                                <LabelRow>
                                <StyledInfoInsufficientFudns id="insuFundsSpace">Amount&nbsp;</StyledInfoInsufficientFudns>
                                <StyledInfoWalletBalance>
                                    <div>{`Balance: `}&nbsp;</div>
                                    <div>{`${formatAmount(usdtBalanceAccount, 6, 4)}`}</div>
                                </StyledInfoWalletBalance>
                                </LabelRow>
                                <InputRow>
                                <StyledInput
                                    ref={regInput}
                                    type="number"
                                    min={0.0}
                                    value={inputValue}
                                    components={{
                                    IndicatorSeparator: () => null, DropdownIndicator: () => null
                                    }}
                                    onChange={onInputChange}
                                    placeholder = "0.0"
                                />
                                <MaxButton onClick={onMax} scale="sm" variant="text">
                                    MAX
                                </MaxButton>
                                <DropdownContainer>
                                    <DropdownButton>
                                        <StyledFlex>
                                            <StyledImage src={usdt} />
                                            <div>USDT</div>
                                        </StyledFlex>
                                    </DropdownButton>
                                </DropdownContainer>
                                </InputRow>
                            </StyledInputArea>
                        </div>
                        <StyledButton id="buyBtn" onClick={onClickPrimary} disabled={!isPrimaryEnabled()}>
                            {getPrimaryText()}
                        </StyledButton>
                    </Container>
                </div>
            </div>
        </div>

        <div className="IDO-Tier-events-text">Referral</div>

        <div className="IDO-Top-card-options">
            <div className="IDO-Top-card-option-left">
              <div className="IDO-Top-card-option-left-status">
                <div className="IDO-Top-card-option-left-status-text3">Once you connect your wallet:</div>
                <br />
                <div className="IDO-Top-card-option-left-status-text3">1. You will be assigned a unique referral code that you can share.</div>
                <div className="IDO-Top-card-option-left-status-text3">2. When someone uses your referral code, you get paid instantly in USDT 10% of the purchase value.</div>
              </div>
            </div>
            <div className="IDO-Top-card-option-right">
                <div className='IDO-referral-content-left'>
                  <p>Your Referral Link:</p>
                </div>
                <div className='IDO-referral-content-right'>
                    {
                        active ? 
                        <p style={{color: "#00E6F6"}}>{`${referralLink.substring(0, 40)}...${referralLink.substring(referralLink.length-4, referralLink.length)}`}</p>
                        :
                        <p style={{color: "#cc2222"}}>Confirm Your Wallet Connection</p>
                    }
                    {
                        account && <FiCopy onClick={() => handleCopyReferralLink(referralLink)} style={{marginLeft: "5px"}} size={24} color="#00E6F6" />
                    }
                </div>
            </div>
        </div>

        <div className="IDO-Tier-events-text">Roadmap</div>

        <div className="IDO-Tier-card-options">
        
            <div className="IDO-Tier-card-option">
                <div className="IDO-Tier-card-option-title">
                    <img className="IDO-Tier-card-option-title-img" src={idoBluV2Img} alt="bluespade v2" />
                    <div className="IDO-Tier-card-option-title-text">Bluespade V2</div>
                </div>
                <hr />
                <div>
                    <div className="IDO-Tier-card-row">
                        <div className="IDO-Tier-card-content-left">● 1250x leverage trading</div>
                    </div>
                    <div className="IDO-Tier-card-row">
                        <div className="IDO-Tier-card-content-left">● 50+ trading pairs</div>
                    </div>
                    <div className="IDO-Tier-card-row">
                        <div className="IDO-Tier-card-content-left">● Stable Coin only $BLP liquidity</div>
                    </div>
                    <div className="IDO-Tier-card-row">
                        <div className="IDO-Tier-card-content-left">● FOREX markets</div>
                    </div>
                    <div className="IDO-Tier-card-row">
                        <div className="IDO-Tier-card-content-left">● Metal markets</div>
                    </div>
                </div>
            </div>

            <div className="IDO-Tier-card-option">
                <div className="IDO-Tier-card-option-title">
                    <img className="IDO-Tier-card-option-title-img" src={idoDAOImg} alt="dao" />
                    <div className="IDO-Tier-card-option-title-text">DAO</div>
                </div>
                <hr />
                <div>
                    <div className="IDO-Tier-card-row">
                        <div className="IDO-Tier-card-content-left">● DAO and V2 will be launched on $ETH at the same time</div>
                    </div>
                    <div className="IDO-Tier-card-row">
                        <div className="IDO-Tier-card-content-left">● 1M tokens</div>
                    </div>
                    <div className="IDO-Tier-card-row">
                        <div className="IDO-Tier-card-content-left">● Launchpad function; the DAO will act as an investment vehicles, incubating projects from the seed stage</div>
                    </div>
                    <div className="IDO-Tier-card-row">
                        <div className="IDO-Tier-card-content-left">● IDO participants will be given early access to token sales of incubated projects</div>
                    </div>
                    <div className="IDO-Tier-card-row">
                        <div className="IDO-Tier-card-content-left">● The DAO will provide POL(protocol owned liquidity) for Bluespade V2 and collect fees that will be shared with DAO token stakers</div>
                    </div>
                </div>
            </div>

            <div className="IDO-Tier-card-option">
                <div className="IDO-Tier-card-option-title">
                    <img className="IDO-Tier-card-option-title-img" src={idoSolanaImg} alt="solana" />
                    <div className="IDO-Tier-card-option-title-text">Solana</div>
                </div>
                <hr />
                <div>
                    <div className="IDO-Tier-card-row">
                        <div className="IDO-Tier-card-content-left">Q3 launch of Bluespade V2 after the IDO</div>
                    </div>
                </div>
            </div>

            <div className="IDO-Tier-card-option">
                <div className="IDO-Tier-card-option-title">
                    <img className="IDO-Tier-card-option-title-img" src={idoNFTImg} alt="nft" />
                    <div className="IDO-Tier-card-option-title-text">NFT Collection</div>
                </div>
                <hr />
                <div>
                    <div className="IDO-Tier-card-row">
                        <div className="IDO-Tier-card-content-left">● 2000 NFTs</div>
                    </div>
                    <div className="IDO-Tier-card-row">
                        <div className="IDO-Tier-card-content-left">● Staking - Passively collect a percentage of the total fees collected</div>
                    </div>
                    <div className="IDO-Tier-card-row">
                        <div className="IDO-Tier-card-content-left">● Gives various trading discounts based on the rarity</div>
                    </div>
                </div>
            </div>

            <div className="IDO-Tier-card-option">
                <div className="IDO-Tier-card-option-title">
                    <img className="IDO-Tier-card-option-title-img" src={idoArbitrumImg} alt="arbitrum" />
                    <div className="IDO-Tier-card-option-title-text">Arbitrum</div>
                </div>
                <hr />
                <div>
                    <div className="IDO-Tier-card-row">
                        <div className="IDO-Tier-card-content-left">TBD launch of Bluespade V2</div>
                    </div>
                </div>
            </div>

            <div className="IDO-Tier-card-option">
                <div className="IDO-Tier-card-option-title">
                    <img className="IDO-Tier-card-option-title-img" src={idoBonusImg} alt="bonus" />
                    <div className="IDO-Tier-card-option-title-text">Secret Bonus</div>
                </div>
                <hr />
                <div>
                    <div className="IDO-Tier-card-row">
                        <div className="IDO-Tier-card-content-left">Bluespade V2 will have two groundbreaking concepts</div>
                    </div>
                    <div className="IDO-Tier-card-row">
                        <div className="IDO-Tier-card-content-left">● It will give unified liquidity across all chains</div>
                    </div>
                    <div className="IDO-Tier-card-row">
                        <div className="IDO-Tier-card-content-left">● It will give the complete Omni trading experience</div>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
}
