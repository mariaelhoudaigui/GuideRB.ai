import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomePage from "./components/HomePage";  // Importer la page d'accueil
import ChatPage from "./components/ChatPage";  // Importer la page de chat

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />  {/* Page d'accueil */}
        <Route path="/chat" element={<ChatPage />} />  {/* Page de chat */}
      </Routes>
    </Router>
  );
}

export default App;
