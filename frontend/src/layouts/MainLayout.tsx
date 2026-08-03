import React from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import AIAssistant from "../components/AIAssistant/AIAssistant";

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <div className="app-shell flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/95 text-white shadow-xl shadow-slate-950/10 backdrop-blur-xl">
        <Header />
      </header>
      <main className="mx-auto w-full max-w-7xl flex-grow px-4 py-7 sm:px-6 lg:px-8 lg:py-10">
        {children}
      </main>
      <footer className="mt-auto border-t border-white/10 bg-slate-950 text-white">
        <Footer />
      </footer>
      <AIAssistant />
    </div>
  );
};

export default MainLayout;
