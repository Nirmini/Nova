// createTrelloWebhook.js
import fetch from "node-fetch";

// Replace with your credentials
const API_KEY = 'de73ab549b06cf7fea93b1f376ab2f3a';  // Trello Power-Up API key
const API_TOKEN = 'ATTAf560abf166f4ac01759f1540bd16a2e8d4dfb0019007ed537df3e147f6e7dd430E901300'; // Trello OAuth2 token
const CALLBACK_URL = "https://thatwest7014.pages.dev/API/Nova/Trello/NotifApp"; // Public webhook endpoint
const BOARD_ID = "674bab5e66ebaeec21fd47e2"; // Board ID to watch

async function createWebhook() {
    try {
        const url = `https://api.trello.com/1/webhooks/?key=${API_KEY}&token=${API_TOKEN}`;

        const body = {
            description: "My Trello Webhook",
            callbackURL: CALLBACK_URL,
            idModel: BOARD_ID
        };

        const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });

        const text = await res.text(); // Trello sometimes returns plain text on error

        let data;
        try {
            data = JSON.parse(text);
        } catch {
            data = text;
        }

        if (!res.ok) {
            throw new Error(`Error ${res.status}: ${JSON.stringify(data)}`);
        }

        console.log("Webhook created successfully:", data);
    } catch (err) {
        console.error("Failed to create Trello webhook:", err);
    }
}

createWebhook();
