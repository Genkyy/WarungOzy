import React, { useEffect, useState } from 'react';
import { usePOSStore } from './store/usePOSStore';
import { useBarcodeScanner } from './hooks/useBarcodeScanner';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Toast } from './components/Toast';
import { PaymentModal } from './components/PaymentModal';
import { ReceiptModal } from './components/ReceiptModal';
import { CameraScannerModal } from './components/CameraScannerModal';
import { AddProductModal } from './components/AddProductModal';
import { ConfirmModal } from './components/ConfirmModal';
import { SplashScreen } from './components/SplashScreen';

import { POSPage } from './pages/POSPage';
import { OrdersPage } from './pages/OrdersPage';
import { DashboardPage } from './pages/DashboardPage';
import { StockReportPage } from './pages/StockReportPage';
import { ExpensesPage } from './pages/ExpensesPage';
import { SettingsPage } from './pages/SettingsPage';

export const App: React.FC = () => {
  const { activeTab, fetchMasterData } = usePOSStore();
  const [showSplash, setShowSplash] = useState(true);

  // Enable global hardware barcode scanner listener
  useBarcodeScanner();

  useEffect(() => {
    fetchMasterData();
  }, [fetchMasterData]);

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'pos':
        return <POSPage />;
      case 'orders':
        return <OrdersPage />;
      case 'dashboard':
        return <DashboardPage />;
      case 'stock':
        return <StockReportPage />;
      case 'expenses':
        return <ExpensesPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <POSPage />;
    }
  };

  return (
    <>
      {showSplash && <SplashScreen onFinished={() => setShowSplash(false)} />}

      <div className="flex h-screen w-screen overflow-hidden bg-[#0b0f19] text-slate-100 font-sans select-none">
        {/* Sidebar Navigation */}
        <Sidebar />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden relative bg-[#0b0f19]">
          <Header />
          <main className="flex-1 overflow-hidden bg-[#0b0f19]">{renderActiveTab()}</main>
        </div>

        {/* Global Modals & Notifications */}
        <PaymentModal />
        <ReceiptModal />
        <CameraScannerModal />
        <AddProductModal />
        <ConfirmModal />
        <Toast />
      </div>
    </>
  );
};

export default App;
