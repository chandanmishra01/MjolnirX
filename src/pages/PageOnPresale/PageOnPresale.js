import SEO from "components/Common/SEO";
import Footer from "components/Footer/Footer";
import { getPageTitle } from "lib/legacy";
import "./PageOnPresale.css";
import { Trans } from "@lingui/macro";
import { getHomeUrl } from "lib/legacy";

function PageOnPresale() {
  const homeUrl = getHomeUrl();

  return (
    <SEO title={getPageTitle("Amped is on Presale")}>
      <div className="page-layout">
        <div className="page-not-found-container">
          <div className="page-not-found">
            <h2>
              <Trans>Amped is currently available for pre-sale.</Trans>
            </h2>
            <p className="go-back">
              <Trans>
                <span>Return to </span>
                <a href={homeUrl}>Homepage</a> <span>or </span> <a href={"https://app.elektrik.network/#/swap"}>Presale</a>
              </Trans>
            </p>
          </div>
        </div>
        <Footer />
      </div>
    </SEO> 
  );
}

export default PageOnPresale;
