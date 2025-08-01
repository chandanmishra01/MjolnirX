import React, { useEffect, useMemo, useRef, useState } from "react";
import { Menu } from "@headlessui/react";
import ModalWithPortal from "../Modal/ModalWithPortal";
import { t, Trans } from "@lingui/macro";
import cx from "classnames";
import { HiDotsVertical } from "react-icons/hi";
import "./NetworkDropdown.css";
import language24Icon from "img/ic_language24.svg";
import settingsIcon from "img/ic_settings_16.svg";
// import arbitrumIcon from "img/ic_arbitrum_24.svg";
// import avaxIcon from "img/ic_avalanche_24.svg";
// import goerliIcon from "img/ic_goerli_24.svg";
import baseIcon from "img/Hemi_Logo.svg";
import checkedIcon from "img/ic_checked.svg";
import { importImage } from "lib/legacy";
import { defaultLocale, dynamicActivate, isTestLanguage, locales } from "lib/i18n";
import { LANGUAGE_LOCALSTORAGE_KEY } from "config/localStorage";

const LANGUAGE_MODAL_KEY = "LANGUAGE";
const NETWORK_MODAL_KEY = "NETWORK";

export default function NetworkDropdown(props) {
  const [currentLanguage, setCurrentLanguage] = useState(localStorage.getItem(LANGUAGE_LOCALSTORAGE_KEY) || defaultLocale);
  const [activeModal, setActiveModal] = useState(null);

  const handleLanguageChange = (item) => {
    if (!isTestLanguage(item)) {
      localStorage.setItem(LANGUAGE_LOCALSTORAGE_KEY, item);
    }
    dynamicActivate(item);
    setCurrentLanguage(item)
  }

  function getModalContent(modalName) {
    switch (modalName) {
      case LANGUAGE_MODAL_KEY:
        return <LanguageModalContent currentLanguage={currentLanguage} onLanguageChange={handleLanguageChange} />;
      case NETWORK_MODAL_KEY:
        return (
          <NetworkModalContent
            setActiveModal={setActiveModal}
            networkOptions={props.networkOptions}
            onNetworkSelect={props.onNetworkSelect}
            selectorLabel={props.selectorLabel}
            openSettings={props.openSettings}
          />
        );
      default:
        return;
    }
  }

  function getModalProps(modalName) {
    switch (modalName) {
      case LANGUAGE_MODAL_KEY:
        return {
          className: "language-popup",
          isVisible: activeModal === LANGUAGE_MODAL_KEY,
          setIsVisible: () => setActiveModal(null),
          label: t`Select Language`,
        };
      case NETWORK_MODAL_KEY:
        return {
          className: "network-popup",
          isVisible: activeModal === NETWORK_MODAL_KEY,
          setIsVisible: () => setActiveModal(null),
          label: t`Networks and Settings`,
        };
      default:
        return {};
    }
  }

  return (
    <>
      {props.small ? (
        <div className="App-header-network" onClick={() => setActiveModal(NETWORK_MODAL_KEY)}>
          <div className="network-dropdown">
            <NavIcons selectorLabel={props.selectorLabel} />
          </div>
        </div>
      ) : (
        <DesktopDropdown
          currentLanguage={currentLanguage}
          activeModal={activeModal}
          setActiveModal={setActiveModal}
          {...props}
        />
      )}
      <ModalWithPortal {...getModalProps(activeModal)}>{getModalContent(activeModal)}</ModalWithPortal>
    </>
  );
}

function NavIcons({ selectorLabel }) {
  const networkImage = useMemo(() => {
    const imageName = selectorLabel === "Base" ? "favicon.ico" : `ic_${selectorLabel.toLowerCase()}.png`;
    return importImage(imageName);
  }, [selectorLabel]);

  return (
    <>
      <button className={cx("btn-primary small transparent")}>
        <img
          className="network-dropdown-icon"
          src={networkImage || baseIcon}
          alt={selectorLabel}
        />
      </button>
      <div className="network-dropdown-seperator" />
      <button className={cx("btn-primary small transparent")}>
        <HiDotsVertical color="white" size={20} />
      </button>
    </>
  );
}

function DesktopDropdown({ setActiveModal, selectorLabel, networkOptions, onNetworkSelect, openSettings }) {
  return (
    <div className="App-header-network">
      <Menu>
        <Menu.Button as="div" className="network-dropdown">
          <NavIcons selectorLabel={selectorLabel} />
        </Menu.Button>
        <Menu.Items as="div" className="menu-items network-dropdown-items">
          <div className="dropdown-label">
            <Trans>Networks</Trans>
          </div>
          <div className="network-dropdown-list">
            <NetworkMenuItems
              networkOptions={networkOptions}
              selectorLabel={selectorLabel}
              onNetworkSelect={onNetworkSelect}
            />
          </div>
          <div className="network-dropdown-divider" />
          <Menu.Item>
            <div className="network-dropdown-menu-item menu-item" onClick={openSettings}>
              <div className="menu-item-group">
                <div className="menu-item-icon">
                  <img className="network-dropdown-icon" src={settingsIcon} alt="" />
                </div>
                <span className="network-dropdown-item-label">
                  <Trans>Settings</Trans>
                </span>
              </div>
            </div>
          </Menu.Item>
          <Menu.Item>
            <div
              className="network-dropdown-menu-item menu-item last-dropdown-menu"
              onClick={() => setActiveModal(LANGUAGE_MODAL_KEY)}
            >
              <div className="menu-item-group">
                <div className="menu-item-icon">
                  <img className="network-dropdown-icon" src={language24Icon} alt="" />
                </div>
                <span className="network-dropdown-item-label">
                  <Trans>Language</Trans>
                </span>
              </div>
            </div>
          </Menu.Item>
        </Menu.Items>
      </Menu>
    </div>
  );
}

function NetworkMenuItems({ networkOptions, selectorLabel, onNetworkSelect }) {
  async function handleNetworkSelect(option) {
    await onNetworkSelect(option);
  }
  return networkOptions.map((network) => {
    const networkIcon = importImage(network.icon);
    
    return (
      <Menu.Item key={network.value}>
        <div
          className="network-dropdown-menu-item menu-item"
          onClick={() => handleNetworkSelect({ value: network.value })}
        >
          <div className="menu-item-group">
            <div className="menu-item-icon">
              <img className="network-dropdown-icon" src={networkIcon} alt={network.label} />
            </div>
            <span className="network-dropdown-item-label">{network.label}</span>
          </div>
          <div className="network-dropdown-menu-item-img">
            <div className={cx("active-dot", { [selectorLabel]: selectorLabel === network.label })} />
          </div>
        </div>
      </Menu.Item>
    );
  });
}

function LanguageModalContent({ currentLanguage, onLanguageChange }) {
  return Object.keys(locales).map((item) => {
    const image = !isTestLanguage(item) && importImage(`flag_${item}.svg`);
    return (
      <div
        key={item}
        className={cx("network-dropdown-menu-item  menu-item language-modal-item", {
          active: currentLanguage === item,
        })}
        onClick={() => onLanguageChange(item)}
      >
        <div className="menu-item-group">
          <div className="menu-item-icon">
            {isTestLanguage(item) ? "🫐" : <img className="network-dropdown-icon" src={image} alt={locales[item]} />}
          </div>
          <span className="network-dropdown-item-label menu-item-label">{locales[item]}</span>
        </div>
        <div className="network-dropdown-menu-item-img">
          {currentLanguage === item && <img src={checkedIcon} alt={locales[item]} />}
        </div>
      </div>
    );
  });
}
function NetworkModalContent({ networkOptions, onNetworkSelect, selectorLabel, setActiveModal, openSettings }) {
  async function handleNetworkSelect(option) {
    await onNetworkSelect(option);
  }
  return (
    <div className="network-dropdown-items">
      <div className="network-dropdown-list">
        <span className="network-dropdown-label">
          <Trans>Networks</Trans>
        </span>

        {networkOptions.map((network) => {
          const networkIcon = importImage(network.icon);
          return (
            <div
              className="network-option"
              onClick={() => handleNetworkSelect({ value: network.value })}
              key={network.value}
            >
              <div className="menu-item-group">
                <img src={networkIcon} alt={network.label} />
                <span>{network.label}</span>
              </div>
              <div className={cx("active-dot", { [selectorLabel]: selectorLabel === network.label })} />
            </div>
          );
        })}
        <span className="network-dropdown-label more-options">
          <Trans>More Options</Trans>
        </span>
        <div
          className="network-option"
          onClick={() => {
            setActiveModal(LANGUAGE_MODAL_KEY);
          }}
        >
          <div className="menu-item-group">
            <img className="network-option-img" src={language24Icon} alt="Select Language" />
            <span className="network-option-img-label">Language</span>
          </div>
        </div>
        <div
          className="network-option"
          onClick={() => {
            openSettings();
            setActiveModal(null);
          }}
        >
          <div className="menu-item-group">
            <img className="network-option-img" src={settingsIcon} alt="" />
            <span className="network-option-img-label">
              <Trans>Settings</Trans>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
