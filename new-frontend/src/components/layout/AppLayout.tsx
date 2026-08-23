import React from 'react';
import { Outlet } from 'react-router-dom';
import { AppShell } from './AppShell';
import { SkipLinks } from '../a11y/SkipLinks';
import { LiveRegion } from '../a11y/LiveRegion';
import { useGlobalHotkeys } from '../../hooks/useGlobalHotkeys';
import { HotkeysModal } from '../a11y/HotkeysModal';

export const AppLayout: React.FC = () => {
  const { isModalOpen, closeModal, openModal } = useGlobalHotkeys();

  return (
    <>
      <SkipLinks />
      <LiveRegion />
      <AppShell onOpenHotkeys={openModal}>
        <Outlet />
      </AppShell>
      <HotkeysModal isOpen={isModalOpen} onClose={closeModal} />
    </>
  );
};
