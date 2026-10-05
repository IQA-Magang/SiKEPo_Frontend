import React from 'react';
import tthLogo from '../assets/logo/tth-logo.png';

export default function TelkomTestHouseLogo() {
  return (
    <div className="tth-branding-wrapper">
      <img src={tthLogo} alt="Telkom Test House" style={{ maxWidth: '100%', height: 'auto' }} />
    </div>
  );
}
