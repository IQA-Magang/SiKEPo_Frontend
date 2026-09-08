import React, { useState } from 'react';
import WaveBackground from '../components/WaveBackground';
import LogoSiKEPo from '../components/LogoSiKEPo';
import LoginForm from '../components/LoginForm';
import TelkomTestHouseLogo from '../components/TelkomTestHouseLogo';
import HelpModal from '../components/HelpModal';

export default function Login({ onNavigate }) {
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  return (
    <div className="login-page-container">
      <WaveBackground />

      <main className="login-content-grid">
        <section className="login-left-col">
          <div className="login-left-wrapper">
            <LogoSiKEPo />
            <LoginForm
              onNavigate={onNavigate}
              onOpenHelp={() => setIsHelpOpen(true)}
            />
          </div>
        </section>

        <section className="login-right-col">
          <TelkomTestHouseLogo />
        </section>
      </main>

      <HelpModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
      />
    </div>
  );
}
