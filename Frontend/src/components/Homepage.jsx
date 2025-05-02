import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { FaArrowRight, FaGithub, FaLinkedin, FaEnvelope } from "react-icons/fa";
import "./Homepage.css";

function HomePage() {
  const socialLinks = {
    maria: {
      github: "https://github.com/mariaelhoudaigui",
      linkedin: "https://www.linkedin.com/in/maria-el-houdaigui/",
      email: "mailto:maria.elhoudaigui@gmail.com",
      color: "black",
    },
    ilham: {
      github: "https://github.com/IlhamBouatioui15",
      linkedin: "https://www.linkedin.com/in/ilham-bouatioui-b34b66223/",
      email: "mailto:bouatioui.ensa@uhp.ac.ma",
      color: "black",
    },
  };

  return (
    <div className="home-container">
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
        className="home-content"
      >
        <h1 className="chatbot-title">GuideRB.ai</h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 1 }}
          className="chatbot-description"
        >
          <p className="descirption">
            Votre assistant intelligent dédié à répondre à toutes vos questions et à vous fournir des informations
            complètes et précises sur la ville de Rabat. Que vous recherchiez des lieux à visiter, des moyens de
            transport, des événements culturels, des restaurants ...
          </p>
        </motion.p>


        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
          <Link to="/chat" className="start-button">
            <FaArrowRight size={24} />
          </Link>
        </motion.div>

        {/* Conteneur des réseaux sociaux */}
        <div className="social-container">
          {["maria", "ilham"].map((person) => (
            <div key={person} className="person-info">
              <p className="person-text">{person === "maria" ? "Maria El houdaigui" : "Ilham Bouatioui"} </p>
              <div className="social-icons">
                <a
                  href={socialLinks[person].github}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: socialLinks[person].color }}
                >
                  <FaGithub size={30} />
                </a>
                <a
                  href={socialLinks[person].linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: socialLinks[person].color }}
                >
                  <FaLinkedin size={30} />
                </a>
                <a href={socialLinks[person].email} style={{ color: socialLinks[person].color }}>
                  <FaEnvelope size={30} />
                </a>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

export default HomePage;
