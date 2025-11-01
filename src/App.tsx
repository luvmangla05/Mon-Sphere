import { Routes, Route, Navigate } from 'react-router-dom';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { Home } from './pages/Home';
import { Chats } from './pages/Chats';
import { Forums } from './pages/Forums';
import { ForumDetail } from './pages/ForumDetail';
import { History } from './pages/History';
import { Friends } from './pages/Friends';
import { Settings } from './pages/Settings';

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-4 max-w-[1200px] mx-auto w-full">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/chats" element={<Chats />} />
            <Route path="/forums" element={<Forums />} />
            <Route path="/forums/:id" element={<ForumDetail />} />
            <Route path="/friends" element={<Friends />} />
            <Route path="/history" element={<History />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
