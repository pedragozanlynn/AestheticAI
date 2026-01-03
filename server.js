const express = require('express');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');

const app = express();
const upload = multer(); // This keeps the image in RAM (memory) for speed

// Allow the HTML file to talk to this server (CORS)
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    next();
});

// 1. Paste your Colab URL here (Update this every time you restart Colab)
const COLAB_URL = "https://baggiest-sterigmatic-kandi.ngrok-free.dev";

app.post('/api/redesign-room', upload.single('photo'), async (req, res) => {
    console.log("-----------------------------------------");
    console.log("📸 RECEIVED: Request from Phone");
    console.log("📂 FILE: ", req.file ? req.file.originalname : "No file found");
    console.log("✍️ PROMPT: ", req.body.prompt);

    try {
        // req.file contains the image sent from your phone
        if (!req.file) {
            return res.status(400).send('No photo uploaded.');
        }

        console.log("🚀 SENDING: Forwarding to Google Colab AI...");

        // 2. Prepare the data to send to Colab
        const form = new FormData();
        form.append('file', req.file.buffer, {
            filename: 'room.jpg',
            contentType: req.file.mimetype,
        });
        form.append('prompt', req.body.prompt || "modern luxury living room");

        // 3. Call the Colab AI
        const aiResponse = await axios.post(`${COLAB_URL}/redesign`, form, {
            headers: { ...form.getHeaders() },
            responseType: 'arraybuffer', // We want the raw image bytes back
            timeout: 150000 // AI can take up to 2.5 minutes
        });

        // 4. Send the AI result back to your mobile app
        res.set('Content-Type', 'image/png');
        res.send(aiResponse.data);

    } catch (error) {
        console.error("Error connecting to AI:", error.message);
        res.status(500).json({ error: "AI Service is currently offline or timing out." });
    }
});

const PORT = 3000;

app.listen(PORT, () => {
    console.log('-------------------------------------------');
    console.log(`✅ Node.js Bridge running on port ${PORT}`);
    console.log(`🚀 Ready to receive AI redesign requests`);
    console.log('-------------------------------------------');
});