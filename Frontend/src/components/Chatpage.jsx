import { useRef, useState } from "react";
import "./ChatPage.css";
import {
  FaPlus,
  FaMicrophone,
  FaPaperPlane,
  FaArrowAltCircleLeft,
  FaArrowAltCircleRight,
  FaCopy,
} from "react-icons/fa";

function ChatPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [history, setHistory] = useState([]);
  const [conversationId, setConversationId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(true);

  // Démarrer une nouvelle conversation
  const startNewConversation = () => {
    setMessages([]);
    setConversationId(Date.now());
  };

  // Fonction pour déclencher la reconnaissance vocale
  const handleVoiceInput = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/process_voice_input', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.text) {
        setInput(data.text); // Mettre la transcription dans le champ de texte
      } else {
        console.error('Erreur :', data.error);
      }
    } catch (error) {
      console.error('Erreur lors de l\'envoi à l\'API:', error);
    }
    setLoading(false);
  };

  const formatBotMessage = (message) => {
    let formattedMessage = message;

    formattedMessage = formattedMessage.replace(
      /\b([A-Z][a-zéèêëîïôöûü-]+(?:\s[A-Z][a-zéèêëîïôöûü-]+)*)\b/g,
      "$1"
    );

    formattedMessage = formattedMessage
      .replace(/- (.*?)(\n|$)/g, "<li>$1</li>")
      .replace(/\n\n/g, "</p><p>")
      .replace(/\n/g, "<br>");

    if (formattedMessage.includes("<li>")) {
      formattedMessage = "<ul>" + formattedMessage + "</ul>";
    }

    const icons = {
      covoiturage: "🚖",
      vélo: "🚲",
      bus: "🚌",
      train: "🚆",
      taxi: "🚕",
      hôtel: "🏨",
      aéroport: "✈",
    };

    Object.entries(icons).forEach(([word, icon]) => {
      formattedMessage = formattedMessage.replace(
        new RegExp(word, "gi"),
        `${icon} ${word}`
      );
    });

    return formattedMessage;
  };

  const updateHistory = (conversationTitle, newMessages) => {
    const existingIndex = history.findIndex((session) => session.id === conversationId);
    let newHistory = [...history];

    if (existingIndex !== -1) {
      newHistory[existingIndex] = {
        ...newHistory[existingIndex],
        messages: newMessages,
        title: conversationTitle,
      };
    } else {
      newHistory.push({ id: conversationId, title: conversationTitle, messages: newMessages });
    }
    setHistory(newHistory);
  };

  const generateTitle = (messages) => {
    return messages.map((msg) => msg.content).join(" ").slice(0, 50);
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("http://localhost:5000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input }),
      });
      const data = await response.json();

      const botMessage = {
        role: "bot",
        content: formatBotMessage(data.message),
      };

      setMessages((prev) => [...prev, botMessage]);

      const conversationTitle = generateTitle([...messages, userMessage, botMessage]);
      updateHistory(conversationTitle, [...messages, userMessage, botMessage]);
    } catch (error) {
      console.error("Erreur de communication avec le chatbot:", error);
    }

    setLoading(false);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert("Texte copié !");
  };

  return (
    <div className="chat-container">
      <div className={`chat-sidebar ${sidebarVisible ? "" : "hidden"}`}>
        <div className="header-sidebar">
          <h2>New chat</h2>
          <button onClick={startNewConversation} className="new-conversation-button">
            <FaPlus />
          </button>
          <ul>
            {history.map((session) => (
              <li key={session.id}>
                <button onClick={() => setMessages(session.messages)} className="history-button">
                  {session.title}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="chat-main">
        <div className="chat-header">
          <button onClick={() => setSidebarVisible(!sidebarVisible)} className="toggle-sidebar-button">
            {sidebarVisible ? <FaArrowAltCircleLeft /> : <FaArrowAltCircleRight />}
          </button>
          <span className="chatbot-name">GuideRB.ai</span>
        </div>
        <div className="chat-box">
          {messages.map((msg, index) => (
            <div key={index} className={`message ${msg.role}`}>
              <span dangerouslySetInnerHTML={{ __html: msg.content }} />
              {msg.role === "bot" && (
                <button className="copy-button" onClick={() => copyToClipboard(msg.content)}>
                  <FaCopy />
                </button>
              )}
            </div>
          ))}
          {loading && <div className="loading">...</div>}
        </div>
        <div className="input-container">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Tapez un message..."
          />
          <button className="send-icon" onClick={sendMessage} disabled={loading}>
            <FaPaperPlane />
          </button>
          <button className="record-icon" onClick={handleVoiceInput} disabled={loading}>
            <FaMicrophone />
          </button>
        </div>
      </div>
    </div>
  );
}

export default ChatPage;
