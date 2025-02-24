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
    setMessages([]); // Réinitialise les messages
    const newConversationId = Date.now(); // Utilise le timestamp comme ID de conversation unique
    setConversationId(newConversationId);
  };

  // Démarrer l'enregistrement de la voix via SpeechRecognition
  const handleVoiceInput = async () => {
    setLoading(true);

    try {
      // Envoi de la requête au backend pour enregistrer et transcrire l'audio
      const response = await fetch('http://localhost:5000/process_voice_input', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.text) {
        // Mettre le texte transcrit dans la zone de saisie
        setInput(data.text);
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
      "$1" // Remove the <strong> tags
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

  // Mise à jour de l'historique
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

  // Générer un titre basé sur les messages
  const generateTitle = (messages) => {
    return messages.map((msg) => msg.content).join(" ").slice(0, 50); // Exemple de titre basé sur les 50 premiers caractères des messages
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    console.log("Envoi du message:", input);

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

        console.log("Réponse reçue:", response);

        const data = await response.json();

        console.log("Contenu de la réponse:", data);

        if (!data.message) {
            console.error("Erreur: la réponse ne contient pas de message.");
            return;
        }

        const botMessage = { role: "bot", content: formatBotMessage(data.message) };
        setMessages((prev) => [...prev, botMessage]);

        // Mettre à jour l'historique avec le nouveau message
     updateHistory(generateTitle([userMessage]), [...history, { id: conversationId, title: generateTitle([userMessage]), messages: [userMessage] }]);

    } catch (error) {
        console.error("Erreur de communication avec le chatbot:", error);
    }

    setLoading(false);
};

  const copyToClipboard = (htmlText) => {
    const tempElement = document.createElement("div");
    tempElement.innerHTML = htmlText;
    const plainText = tempElement.textContent || tempElement.innerText;
    navigator.clipboard.writeText(plainText);
  };

  return (
    <div className="chat-container">
      <div className={`chat-sidebar ${sidebarVisible ? "" : "hidden"}`}>
        <div className="header-sidebar">
          <h2>New CHAT</h2>
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
          <button className="record-icon" onClick={handleVoiceInput}>
            <FaMicrophone />
          </button>
        </div>
      </div>
    </div>
  );
}

export default ChatPage;
