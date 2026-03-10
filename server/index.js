const express = require("express");
const cors = require("cors");
const https = require("https");
require("dotenv").config();

const path = require("path");
const app = express();
const PORT = process.env.PORT || 5001;

const corsOptions = {
  origin: true,
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type"],
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});
app.use(express.json());
app.use(express.static(path.join(__dirname, "../dist")));

async function getAccessToken() {
  const clientId = String(process.env.GMAIL_CLIENT_ID || "").trim();
  const clientSecret = String(process.env.GMAIL_CLIENT_SECRET || "").trim();
  const refreshToken = String(process.env.GMAIL_REFRESH_TOKEN || "").trim();

  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  });

  return new Promise((resolve, reject) => {
    const body = params.toString();
    const options = {
      hostname: "oauth2.googleapis.com",
      path: "/token",
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Content-Length": Buffer.byteLength(body),
      },
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          const parsed = data ? JSON.parse(data) : {};
          if (res.statusCode >= 200 && res.statusCode < 300 && parsed.access_token) {
            resolve(parsed.access_token);
            return;
          }

          const details =
            parsed.error_description || parsed.error || JSON.stringify(parsed);
          const hint =
            res.statusCode === 401
              ? " Check client_id/client_secret/refresh_token pair and regenerate refresh token for this exact OAuth client."
              : "";
          reject(new Error(`Gmail token error ${res.statusCode}: ${details}.${hint}`));
        } catch {
          reject(new Error(`Gmail token parse error: ${data}`));
        }
      });
    });

    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

async function sendGmailMessage({ accessToken, from, to, subject, htmlBody }) {
  const messageParts = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    "MIME-Version: 1.0",
    'Content-Type: text/html; charset="UTF-8"',
    "",
    htmlBody,
  ];

  const raw = Buffer.from(messageParts.join("\r\n"))
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  const body = JSON.stringify({ raw });

  return new Promise((resolve, reject) => {
    const options = {
      hostname: "gmail.googleapis.com",
      path: "/gmail/v1/users/me/messages/send",
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(body),
      },
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(data ? JSON.parse(data) : {});
          return;
        }

        let parsed = null;
        try {
          parsed = data ? JSON.parse(data) : null;
        } catch {
          parsed = null;
        }

        const details =
          parsed?.error?.message ||
          parsed?.error_description ||
          parsed?.error ||
          data;
        const error = new Error(
          `Gmail API error ${res.statusCode}: ${details || "Unknown error"}`
        );
        error.statusCode = res.statusCode;
        error.responseBody = data;
        reject(error);
      });
    });

    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

const getMinimumValue = (minimumText) => {
  const match = String(minimumText || "").match(/\d+/);
  return match ? Number(match[0]) : 0;
};

const buildSectionTable = (title, items) => {
  if (!items.length) {
    return `
      <div style="margin-top:24px;">
        <h3 style="margin-bottom:10px;">${title}</h3>
        <p>No items in this section.</p>
      </div>
    `;
  }

  const rows = items
    .map((item) => {
      const minimumLabel =
        item.minimumText !== undefined && item.minimumText !== null
          ? item.minimumText
          : String(item.minimum ?? "");

      const minimumValue = getMinimumValue(minimumLabel);
      const stockValue = Number(item.inStock || 0);
      const low = stockValue < minimumValue;
      const rowBg = low ? "#ffe5e5" : "#ffffff";
      const status = low ? "⚠️ Low" : "OK";

      return `
        <tr style="background-color:${rowBg};">
          <td style="border:1px solid #cccccc; padding:10px; text-align:left;">${item.name}</td>
          <td style="border:1px solid #cccccc; padding:10px; text-align:center;">${stockValue}</td>
          <td style="border:1px solid #cccccc; padding:10px; text-align:center;">${minimumLabel}</td>
          <td style="border:1px solid #cccccc; padding:10px; text-align:center; font-weight:bold;">${status}</td>
        </tr>
      `;
    })
    .join("");

  return `
    <div style="margin-top:24px;">
      <h3 style="margin-bottom:10px; color:#0f172a;">${title}</h3>
      <table style="border-collapse:collapse; width:100%; max-width:900px; background:#ffffff;">
        <thead>
          <tr style="background-color:#f2f2f2;">
            <th style="border:1px solid #cccccc; padding:10px; text-align:left;">Item</th>
            <th style="border:1px solid #cccccc; padding:10px; text-align:center;">In Stock</th>
            <th style="border:1px solid #cccccc; padding:10px; text-align:center;">Minimum</th>
            <th style="border:1px solid #cccccc; padding:10px; text-align:center;">Status</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    </div>
  `;
};

app.post("/send-inventory", async (req, res) => {
  try {
    const from = process.env.EMAIL_FROM || process.env.EMAIL_USER;
    const to = process.env.EMAIL_TO;

    if (
      !process.env.GMAIL_CLIENT_ID ||
      !process.env.GMAIL_CLIENT_SECRET ||
      !process.env.GMAIL_REFRESH_TOKEN ||
      !from ||
      !to
    ) {
      return res.status(500).json({
        message:
          "Missing env vars. Required: GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN, EMAIL_FROM (or EMAIL_USER), EMAIL_TO",
      });
    }

    const { items } = req.body;

    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ message: "Items are required" });
    }

    const currentDate = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const subject = `Inventory Report - ${currentDate}`;

    const supplyItems = items.filter((item) => item.category === "Supply");
    const inkItems = items.filter((item) => item.category === "Ink");

    const lowStockItems = items.filter((item) => {
      const minimumLabel =
        item.minimumText !== undefined && item.minimumText !== null
          ? item.minimumText
          : String(item.minimum ?? "");
      return Number(item.inStock || 0) < getMinimumValue(minimumLabel);
    });

    const lowStockRows = lowStockItems
      .map((item) => {
        const minimumLabel =
          item.minimumText !== undefined && item.minimumText !== null
            ? item.minimumText
            : String(item.minimum ?? "");
        return `
          <tr>
            <td style="border:1px solid #cccccc; padding:10px;">${item.category}</td>
            <td style="border:1px solid #cccccc; padding:10px;">${item.name}</td>
            <td style="border:1px solid #cccccc; padding:10px; text-align:center;">${Number(item.inStock || 0)}</td>
            <td style="border:1px solid #cccccc; padding:10px; text-align:center;">${minimumLabel}</td>
          </tr>
        `;
      })
      .join("");

    const html = `
      <div style="font-family:Arial, sans-serif; color:#222; padding:20px;">
        <h2 style="margin-bottom:4px;">Inventory Report</h2>
        <p style="margin-top:0; color:#666;">${currentDate}</p>

        ${buildSectionTable("Supply Checklist", supplyItems)}
        ${buildSectionTable("Ink Inventory", inkItems)}

        <div style="margin-top:30px;">
          <h3 style="margin-bottom:10px; color:#0f172a;">Low Stock Items</h3>
          ${
            lowStockItems.length
              ? `
                <table style="border-collapse:collapse; width:100%; max-width:900px; background:#ffffff;">
                  <thead>
                    <tr style="background-color:#f2f2f2;">
                      <th style="border:1px solid #cccccc; padding:10px; text-align:left;">Section</th>
                      <th style="border:1px solid #cccccc; padding:10px; text-align:left;">Item</th>
                      <th style="border:1px solid #cccccc; padding:10px; text-align:center;">In Stock</th>
                      <th style="border:1px solid #cccccc; padding:10px; text-align:center;">Minimum</th>
                    </tr>
                  </thead>
                  <tbody>${lowStockRows}</tbody>
                </table>
              `
              : `<p>No low stock items.</p>`
          }
        </div>
      </div>
    `;

    const accessToken = await getAccessToken();
    await sendGmailMessage({
      accessToken,
      from,
      to,
      subject,
      htmlBody: html,
    });

    console.log("Email sent successfully via Gmail API");
    res.status(200).json({ message: "Inventory email sent successfully" });
  } catch (error) {
    console.error("Email send error:", error.message, error.responseBody || "");
    const code = Number(error.statusCode);

    res.status(code >= 400 && code < 600 ? code : 500).json({
      message: `Failed to send inventory email: ${error.message}`,
      error: error.message,
      statusCode: error.statusCode || 500,
      provider: "gmail",
      details:
        code === 401
          ? "Invalid Gmail credentials or refresh token"
          : code === 403
            ? "OAuth app/test user/scope access denied in Google Cloud"
            : code === 422
              ? "Invalid email payload (check EMAIL_FROM/EMAIL_TO format)"
              : undefined,
    });
  }
});

app.get("/health", (req, res) => {
  res.status(200).json({ ok: true });
});

app.get("/{*splat}", (req, res) => {
  res.sendFile(path.join(__dirname, "../dist/index.html"));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
