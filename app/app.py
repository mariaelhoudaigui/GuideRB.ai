import tempfile

from flask_cors import CORS
from langdetect import detect
import os
import json
from typing import List, Dict, Any
from dataclasses import dataclass
from flask import Flask, request, jsonify, render_template, Response
from groq import Groq
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
#from sympy.physics.units import s
import sounddevice as sd
import scipy.io.wavfile as wav
import speech_recognition as sr


@dataclass
class RabatLocation:
    category: str
    name: str
    address: str
    details: Dict[str, Any]
@dataclass
class RabatTransport:
    category: str
    type: str
    name: str
    details: Dict[str, Any]

class RabatRAG:
    def __init__(self, data_path: str = 'database.json'):
        self.model = SentenceTransformer('paraphrase-multilingual-MiniLM-L12-v2')
        self.data = self.load_data(data_path)
        self.embeddings = {}
        self.initialize_embeddings()

    def load_data(self, data_path: str) -> List[RabatLocation]:
        # Construct the full path relative to the script's location
        script_dir = os.path.dirname(os.path.abspath(__file__))
        # Construct the full path relative to the script's directory
        full_path = os.path.join(script_dir, data_path)
        print(f"Loading data from: {full_path}")  # Debugging: Print the full path

        try:
            with open(full_path, 'r', encoding='utf-8') as f:
                raw_data = json.load(f)
        except FileNotFoundError:
            raise ValueError(f"File not found: {full_path}")
        except json.JSONDecodeError:
            raise ValueError(f"Error decoding JSON in file: {full_path}")

        locations = []
        for category, items in raw_data.items():
            for item in items:
                if category == "moyens_de_transport":
                    locations.append(
                        RabatTransport(
                            category=category,
                            type=item.get('type', ''),
                            name=item.get('nom', ''),
                            details=item
                        )
                    )
                else :
                    locations.append(
                           RabatLocation(
                            category=category,
                            name=item.get('smiya', ''),
                            address=item.get('adresse', ''),
                            details=item
                    )
                )
        return locations

    def initialize_embeddings(self):
        for location in self.data:
            if location.category == "moyens_de_transport":
                text = f"{location.type} {location.name} {' '.join(str(v) for v in location.details.values() if isinstance(v, (str, list)))}"
            else:
                text = f"{location.name} {location.address} {' '.join(str(v) for v in location.details.values() if isinstance(v, (str, list)))}"
            self.embeddings[location.name] = self.model.encode(text)

    def retrieve_relevant_info(self, query: str, k: int = 3) -> List[Dict]:
        query_embedding = self.model.encode(query)

        similarities = []
        for location in self.data:
            similarity = cosine_similarity(
                [query_embedding],
                [self.embeddings[location.name]]
            )[0][0]
            similarities.append((similarity, location))

        relevant_items = sorted(similarities, key=lambda x: x[0], reverse=True)[:k]

        return [
            {
                'category': item[1].category,
                'name': item[1].name,
                'address': item[1].type  if item[1].category == "moyens_de_transport" else item[1].address,
                'details': item[1].details,
                'similarity': float(item[0])
            }
            for item in relevant_items
        ]


class RabatChatbot:
    def __init__(self, rag_system: RabatRAG, groq_client: Groq):
        self.rag = rag_system
        self.client = groq_client

    def generate_response(self, user_input: str) -> str:
        # Détecter la langue du message utilisateur
        detected_language = detect(user_input)

        relevant_info = self.rag.retrieve_relevant_info(user_input)
        context = self._format_context(relevant_info)
        prompt = self._create_prompt(user_input, context)

        try:
            response = self.client.chat.completions.create(
                model="llama3-70b-8192",
                messages=[
                    {"role": "system",
                     "content": f"You are a helpful assistant for Rabat. Reply in {detected_language}."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=1000,
                temperature=0.7
            )
        except Exception as e:
            raise ValueError(f"Error during Groq API call: {str(e)}")

        return response.choices[0].message.content.strip()

    def _format_context(self, relevant_info: List[Dict]) -> str:
        context_parts = []
        for info in relevant_info:
            if info["category"] == "moyens_de_transport":
                context_parts.append(
                    f"Category: {info['category']}\n"
                    f"Name: {info['name']}\n"
                    f"Type: {info['address']}\n"
                    f"Details: {json.dumps(info['details'], ensure_ascii=False)}\n"
                )
            else:
                context_parts.append(
                    f"Category: {info['category']}\n"
                    f"Name: {info['name']}\n"
                    f"Address: {info['address']}\n"
                    f"Details: {json.dumps(info['details'], ensure_ascii=False)}\n"
                )
        return "\n".join(context_parts)

    def _create_prompt(self, user_input: str, context: str) -> str:
        detected_language = detect(user_input)
        return f"""Based on the following information about locations and events in Rabat:

    {context}

    Please answer this question or request: {user_input}

    Provide a natural, helpful response in {detected_language}. Include relevant details from the context."""


# Flask application setup
app = Flask(__name__)
CORS(app)
# Initialize RAG system and chatbot

GROQ_API = "GROQ_KEY"
rag_system = RabatRAG(r'C:\path\database.json')
groq_client = Groq(api_key=GROQ_API)
Rabat_bot = RabatChatbot(rag_system, groq_client)


# Fonction pour enregistrer l'audio
def record_audio(duration, sample_rate=44100):
    print("Enregistrement en cours... Parlez maintenant.")
    # Créer un fichier temporaire pour enregistrer l'audio
    with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as temp_file:
        filename = temp_file.name
        recording = sd.rec(int(duration * sample_rate), samplerate=sample_rate, channels=1, dtype='int16')
        sd.wait()  # Attendre la fin de l'enregistrement
        wav.write(filename, sample_rate, recording)
        print(f"Enregistrement terminé. Fichier sauvegardé : {filename}")
        return filename


# Fonction pour convertir l'audio en texte
def audio_to_text(filename):
    recognizer = sr.Recognizer()
    try:
        with sr.AudioFile(filename) as source:
            print("Conversion de l'audio en texte...")
            audio = recognizer.record(source)
            # Spécifier la langue française
            text = recognizer.recognize_google(audio, language="fr-FR")
            print(f"Texte reconnu : {text}")
            return text
    except sr.UnknownValueError:
        print("L'audio n'a pas pu être compris.")
    except sr.RequestError as e:
        print(f"Erreur lors de la requête à Google Speech Recognition : {e}")
    return None


@app.route('/process_voice_input', methods=['POST'])
def process_voice_input():
    # Durée d'enregistrement (par exemple, 5 secondes)
    record_duration = 10
    audio_file = record_audio(record_duration)

    # Convertir l'audio en texte
    text_result = audio_to_text(audio_file)

    # Nettoyage du fichier temporaire
    os.remove(audio_file)

    if text_result:
        return jsonify({"text": text_result})
    else:
        return jsonify({"error": "Erreur lors de la conversion de l'audio en texte."}), 500


# Routes
'''@app.route("/")
def landing_page():
    return render_template('index_landing.html')'''
@app.route("/", methods=["GET"])
def home():
    return "Le serveur fonctionne!"
@app.route("/chat", methods=["POST"])
def chat():
    try:
        app.logger.info("Received chat request")
        user_input = request.json.get("message", "").strip()
        app.logger.info(f"User input: {user_input}")

        if not user_input:
            app.logger.warning("No input provided")
            return jsonify({"error": "No input provided"}), 400

        response = Rabat_bot.generate_response(user_input)
        app.logger.info(f"Generated response: {response}")
        return jsonify({"message": response})

    except Exception as e:
        app.logger.error(f"Error processing chat request: {str(e)}", exc_info=True)
        return jsonify({"error": str(e)}), 500



if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)  # Added debug=True for better error messages
