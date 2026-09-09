import { useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import Footer from './components/layout/Footer';
import MobileHeader from './components/layout/MobileHeader';
import Sidebar from './components/layout/Sidebar';
import TopNav from './components/layout/TopNav';
import Toast from './components/common/Toast';
import TxModal from './components/common/TxModal';
import RouteSEO from './components/common/RouteSEO';
import About from './pages/About';
import BubbleMap from './pages/BubbleMap';
import Faq from './pages/Faq';
import Home from './pages/Home';
import Introduction from './pages/Introduction';
import PctAndCexs from './pages/PctAndCexs';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import TrackAndTrace from './pages/TrackAndTrace';
import WalletExplorer from './pages/WalletExplorer';
import WalletSweeps from './pages/WalletSweeps';

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <>
      <RouteSEO />
      <MobileHeader
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen((prev) => !prev)}
      />

      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Content Area Wrapper */}
      <div className="content-wrapper">
        <TopNav />

        {/* Page Content */}
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/home" element={<Home />} />
            <Route path="/introduction" element={<Navigate to="/" replace />} />
            <Route path="/wallet_explorer" element={<WalletExplorer />} />
            <Route path="/track_and_trace" element={<TrackAndTrace />} />
            <Route path="/trace" element={<Navigate to="/track_and_trace" replace />} />
            <Route path="/wallet_sweeps" element={<WalletSweeps />} />
            <Route path="/sweeps" element={<Navigate to="/wallet_sweeps" replace />} />
            <Route path="/bubblemap" element={<BubbleMap />} />
            <Route path="/pct_and_cexs" element={<PctAndCexs />} />
            <Route path="/about" element={<About />} />
            <Route path="/faq" element={<Faq />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>

          <Footer />
        </main>
      </div>

      <TxModal />
      <Toast />
    </>
  );
}
