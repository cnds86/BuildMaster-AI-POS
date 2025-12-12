
import React from 'react';
import { GlobalProvider } from '../context/GlobalContext';
import { Sidebar } from '../components/Sidebar';
import '../index.css'; // Assuming you rename your global css or use standard global.css

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Noto+Sans+Lao:wght@100..900&family=Noto+Sans+Thai:wght@100..900&display=swap" rel="stylesheet" />
        <script src="https://cdn.tailwindcss.com"></script>
        <title>BuildMaster AI POS</title>
      </head>
      <body className="bg-slate-50 font-sans text-slate-900">
        <GlobalProvider>
          <div className="flex h-screen overflow-hidden">
             <Sidebar />
             <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
                {/* Adjust padding for mobile header */}
                <div className="flex-1 overflow-y-auto p-4 md:p-6 mt-16 md:mt-0">
                  {children}
                </div>
             </main>
          </div>
        </GlobalProvider>
      </body>
    </html>
  );
}
