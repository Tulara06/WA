const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// VERIFY WEBHOOK (Meta requirement)
app.get("/webhook", (req, res) => {
  const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }
  res.sendStatus(403);
});

// RECEIVE MESSAGES
app.post("/webhook", async (req, res) => {
  const entry = req.body.entry?.[0];
  const change = entry?.changes?.[0];
  const message = change?.value?.messages?.[0];

  if (!message) return res.sendStatus(200);

  const from = message.from;
  const text = message.text?.body?.toLowerCase();

  if (text === "hi" || text === "hello") {
    await sendMessage(from, "Do you want to book an appointment?\n\nReply:\n1️⃣ Yes\n2️⃣ No");
  } else if (text === "1") {
    await sendMessage(from, "Choose appointment type:\n\n1️⃣ Physical\n2️⃣ Virtual");
  } else if (text === "1 physical" || text === "physical") {
    await sendMessage(
      from,
      "🩺 Dr Neeraj Tulara\nhttps://www.bookurdoc.com/booking-calendar/neeraj-tulara-physical-exam"
    );
  }

  res.sendStatus(200);
});

async function sendMessage(to, body) {
  await axios.post(
    `https://graph.facebook.com/v18.0/${process.env.PHONE_NUMBER_ID}/messages`,
    {
      messaging_product: "whatsapp",
      to,
      text: { body }
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
        "Content-Type": "application/json"
      }
    }
  );
}

app.listen(PORT, () => console.log("Server running"));

