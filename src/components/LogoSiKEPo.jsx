import React from 'react';
import tthLogo from '../assets/logo/tth-logo.png';

export default function LogoSiKEPo() {
  return (
    <div className="sikepo-branding">
      {/* Small TTH Header Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <img src={tthLogo} alt="Telkom Test House" style={{ width: 40, height: 24, objectFit: 'cover', objectPosition: 'center' }} />
        <span style={{ fontSize: '10px', fontWeight: 700, color: '#DC2626', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Telkom Test House
        </span>
      </div>

      <h2 className="sikepo-tagline">
        System of knowing<br />
        Equipment position
      </h2>
    </div>
  );
}
