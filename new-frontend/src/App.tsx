import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';

// App Pages
import { Home } from './pages/app/Home';
import { LibraryPage } from './pages/app/Library';
import { ReadDocument } from './pages/app/ReadDocument';
import { LiveSession } from './pages/app/LiveSession';
import { DictatePage } from './pages/app/Dictate';
import { DostPage } from './pages/app/Dost';
import { SettingsPage } from './pages/app/Settings';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/library" element={<LibraryPage />} />
          <Route path="/read/:documentId" element={<ReadDocument />} />
          <Route path="/live" element={<LiveSession />} />
          <Route path="/dictate" element={<DictatePage />} />
          <Route path="/dost" element={<DostPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
