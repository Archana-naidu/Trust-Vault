import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import UploadModal from '../components/UploadModal';

export default function AppLayout() {
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadSuccessTrigger, setUploadSuccessTrigger] = useState(0);

  const handleUploadSuccess = () => {
    setIsUploadOpen(false);
    // Increment to trigger reload in active views
    setUploadSuccessTrigger((prev) => prev + 1);
  };

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      {/* Dark Navy Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto min-h-screen">
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
          <Outlet context={{ openUpload: () => setIsUploadOpen(true), uploadSuccessTrigger }} />
        </main>
      </div>

      {/* Global Upload Modal */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onSuccess={handleUploadSuccess}
      />
    </div>
  );
}
