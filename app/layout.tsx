
import React from 'react';
import { GlobalProvider } from '../context/GlobalContext';
import '../index.css';

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
          {children}
        </GlobalProvider>
      </body>
    </html>
  );
}
