import React from 'react';
import tthLogo from '../assets/logo/tth-logo.png';

export default function LogoSiKEPo() {
  return (
    <div className="sikepo-branding">
      <img
        src={tthLogo}
        alt="SiKEPo Header Logo"
        className="sikepo-header-logo-img"
      />
      <h2 className="sikepo-tagline">
        System of knowing<br />
        Equipment position
      </h2>
    </div>
  );
}
