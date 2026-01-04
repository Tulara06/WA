const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// VERIFY WEBHOOK (Meta requirement)
app.get("/webhook", (req, res) => {
  console.log("VERIFY HIT",req.query);
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
  const value = change?.value;
  const message = value?.messages?.[0];

  if (!message) return res.sendStatus(200);

  const from = message.from;

  // TEXT MESSAGE
  if (message.text) {
    const text = message.text.body.toLowerCase();

    if (text === "hi" || text === "hello") {
      await sendYesNo(from);
    }

    if (text === "yes" || text === "1") {
      await sendAppointmentType(from);
    }

    if (text === "physical") {
      await sendDoctors(from, "physical");
    }

    if (text === "virtual") {
      await sendDoctors(from, "virtual");
    }
  }

  // BUTTON REPLY
  if (message.interactive?.button_reply) {
    const id = message.interactive.button_reply.id;

    if (id === "YES") await sendAppointmentType(from);
    if (id === "PHYSICAL") await sendDoctors(from, "physical");
    if (id === "VIRTUAL") await sendDoctors(from, "virtual");
  }

  res.sendStatus(200);
});
async function sendYesNo(to) {
  await sendInteractive(to, "Do you want to book an appointment?", [
    { id: "YES", title: "Yes" },
    { id: "NO", title: "No" }
  ]);
}
async function sendAppointmentType(to) {
  await sendInteractive(to, "Choose appointment type:", [
    { id: "PHYSICAL", title: "Physical" },
    { id: "VIRTUAL", title: "Virtual" }
  ]);
}
async function sendDoctors(to, type) {
  if (type === "physical") {
    await sendText(
      to,
      "🩺 Choose a doctor:\n\nDr Neeraj Tulara\nhttps://www.bookurdoc.com/booking-calendar/neeraj-tulara-physical-exam"
    );
  }

  if (type === "virtual") {
    await sendText(
      to,
      "💻 Choose a doctor:\n\nDr Neeraj Tulara\nhttps://www.bookurdoc.com/booking-calendar/neeraj-tulara-virtual"
    );
  }
}
async function sendText(to, body) {
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

async function sendInteractive(to, text, buttons) {
  await axios.post(
    `https://graph.facebook.com/v18.0/${process.env.PHONE_NUMBER_ID}/messages`,
    {
      messaging_product: "whatsapp",
      to,
      type: "interactive",
      interactive: {
        type: "button",
        body: { text },
        action: {
          buttons: buttons.map(b => ({
            type: "reply",
            reply: { id: b.id, title: b.title }
          }))
        }
      }
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
        "Content-Type": "application/json"
      }
    }
  );
}


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

