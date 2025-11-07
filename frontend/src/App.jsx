import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import VideoTracker from "./components/VideoTracker";
import RemindersPanel from "./components/RemindersPanel"; // ✅ yaha import karo
import ChatBot from "./components/ChatBot";
import AssignmentCard from "./components/AssignmentCard";
import Blog from "./components/blogs";
import AuthModal from "./components/AuthModal";


  

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/videos" element={<VideoTracker />} />
        <Route path="/chatbot" element={<ChatBot />} />
        <Route path="/reminders" element={<RemindersPanel />} /> {/* ✅ route */}
        <Route path="/assignments" element={<AssignmentCard/>} />
        <Route path="/blogs" element={<Blog />} />
        <Route path="/authmodal" element={<AuthModal />} />
        
      </Routes>
    </BrowserRouter>
  );
}

export default App;
