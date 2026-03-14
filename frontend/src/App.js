import { Routes, Route } from "react-router-dom";  // ✅ FIXED: Removed wrong 'Router' import (BrowserRouter is already in index.js)

import Landing from "./pages/landing";
import Authentication from "./pages/authentication";
import Home from "./pages/home";
import VideoMeet from "./pages/VideoMeet";
import History from "./pages/history";           // ✅ FIXED: Was missing - History route existed but page was never imported
import { AuthProvider } from "./contexts/AuthContext";

function App() {
  return (
    <div className="App">
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/auth" element={<Authentication />} />
          <Route path="/home" element={<Home />} />
          <Route path="/history" element={<History />} />  {/* ✅ FIXED: Route was missing entirely */}
          <Route path="/meet/:roomId" element={<VideoMeet />} />
        </Routes>
      </AuthProvider>
    </div>
  );
}

export default App;
