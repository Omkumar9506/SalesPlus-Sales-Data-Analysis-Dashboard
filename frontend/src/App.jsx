import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Toast from './components/Toast';
import ConfirmModal from './components/ConfirmModal';

import OverviewPage from './pages/OverviewPage';
import SalesAnalyticsPage from './pages/SalesAnalyticsPage';
import ProductPerformancePage from './pages/ProductPerformancePage';
import ForecastPage from './pages/ForecastPage';
import TransactionsPage from './pages/TransactionsPage';
import DataManagerPage from './pages/DataManagerPage';

import { salesService } from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [backendHealthy, setBackendHealthy] = useState(false);

  // Global Filter State
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [dateRangePreset, setDateRangePreset] = useState('all');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Toast notifications
  const [toasts, setToasts] = useState([]);

  // Reset Modal state
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetting, setResetting] = useState(false);

  const addToast = useCallback(({ type = 'info', title, message, duration = 4000 }) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, title, message }]);
    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Check health and load categories on mount
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const health = await salesService.checkHealth();
        if (health.status === 'healthy') {
          setBackendHealthy(true);
        }
      } catch (err) {
        setBackendHealthy(false);
      }

      try {
        const cats = await salesService.getCategories();
        setCategories(cats || []);
      } catch (err) {
        console.error('Failed to load categories list:', err);
      }
    };

    checkStatus();
  }, [refreshTrigger]);

  // Compute date filter parameters based on selected preset
  const filterParams = useMemo(() => {
    const params = {};
    if (selectedCategory && selectedCategory !== 'All') {
      params.category = selectedCategory;
    }

    // Dataset reference max date in sample data is mid-2026
    const baseDate = new Date(2026, 5, 30); // 2026-06-30

    if (dateRangePreset === 'last30') {
      const d = new Date(baseDate);
      d.setDate(d.getDate() - 30);
      params.start_date = d.toISOString().split('T')[0];
      params.end_date = baseDate.toISOString().split('T')[0];
    } else if (dateRangePreset === 'last90') {
      const d = new Date(baseDate);
      d.setDate(d.getDate() - 90);
      params.start_date = d.toISOString().split('T')[0];
      params.end_date = baseDate.toISOString().split('T')[0];
    } else if (dateRangePreset === 'last180') {
      const d = new Date(baseDate);
      d.setDate(d.getDate() - 180);
      params.start_date = d.toISOString().split('T')[0];
      params.end_date = baseDate.toISOString().split('T')[0];
    } else if (dateRangePreset === 'year2025') {
      params.start_date = '2025-01-01';
      params.end_date = '2025-12-31';
    } else if (dateRangePreset === 'year2026') {
      params.start_date = '2026-01-01';
      params.end_date = '2026-12-31';
    }

    return params;
  }, [selectedCategory, dateRangePreset]);

  const handleRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
    addToast({
      type: 'info',
      title: 'Refreshing Data',
      message: 'Synchronizing latest analytics with the backend server...',
      duration: 2000,
    });
  };

  const handleResetConfirm = async () => {
    setResetting(true);
    try {
      const res = await salesService.resetDataset();
      if (res.success) {
        setIsResetModalOpen(false);
        setRefreshTrigger((prev) => prev + 1);
        addToast({
          type: 'success',
          title: 'Dataset Restored',
          message: 'Restored baseline 18-month sales dataset.',
        });
      }
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Reset Failed',
        message: 'Could not restore baseline dataset.',
      });
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex">
      {/* Toast Notification Container */}
      <Toast toasts={toasts} removeToast={removeToast} />

      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        backendHealthy={backendHealthy}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <Navbar
          isCollapsed={isCollapsed}
          activeTab={activeTab}
          categories={categories}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          dateRangePreset={dateRangePreset}
          setDateRangePreset={setDateRangePreset}
          onRefresh={handleRefresh}
          onOpenUpload={() => setActiveTab('data')}
          onOpenReset={() => setIsResetModalOpen(true)}
          loading={false}
        />

        {/* Page Content View */}
        <main
          className={`flex-1 p-6 transition-all duration-300 ${
            isCollapsed ? 'ml-20' : 'ml-64'
          }`}
        >
          {activeTab === 'overview' && (
            <OverviewPage
              filterParams={filterParams}
              setActiveTab={setActiveTab}
              refreshTrigger={refreshTrigger}
            />
          )}

          {activeTab === 'analytics' && (
            <SalesAnalyticsPage
              filterParams={filterParams}
              refreshTrigger={refreshTrigger}
            />
          )}

          {activeTab === 'products' && (
            <ProductPerformancePage
              filterParams={filterParams}
              refreshTrigger={refreshTrigger}
            />
          )}

          {activeTab === 'forecast' && (
            <ForecastPage
              filterParams={filterParams}
              refreshTrigger={refreshTrigger}
            />
          )}

          {activeTab === 'transactions' && (
            <TransactionsPage
              filterParams={filterParams}
              refreshTrigger={refreshTrigger}
            />
          )}

          {activeTab === 'data' && (
            <DataManagerPage
              onDatasetUpdated={() => setRefreshTrigger((prev) => prev + 1)}
              addToast={addToast}
            />
          )}
        </main>
      </div>

      {/* Dataset Reset Confirmation Modal */}
      <ConfirmModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        onConfirm={handleResetConfirm}
        title="Restore Default Realistic Sales Dataset"
        message="This action will reload the 18-month baseline dataset (~4,400 orders) into the system. All current analytics and ML models will be recalculated."
        confirmText="Confirm Reset"
        isDanger={true}
        loading={resetting}
      />
    </div>
  );
}
