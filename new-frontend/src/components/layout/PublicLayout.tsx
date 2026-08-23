import React from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';
import { SkipLinks } from '../a11y/SkipLinks';
import { LiveRegion } from '../a11y/LiveRegion';
import { useGlobalHotkeys } from '../../hooks/useGlobalHotkeys';
import { HotkeysModal } from '../a11y/HotkeysModal';

export const PublicLayout: React.FC = () => {
  const { isModalOpen, closeModal, openModal } = useGlobalHotkeys();

  return (
    <div className="min-h-screen flex flex-col bg-surface text-text-primary">
      <SkipLinks />
      <LiveRegion />
      <Header onOpenHotkeys={openModal} />
      
      <main id="main" tabIndex={-1} className="flex-1 outline-none">
        <Outlet />
      </main>

      <Footer onOpenHotkeys={openModal} />
      <HotkeysModal isOpen={isModalOpen} onClose={closeModal} />
    </div>
  );
};
