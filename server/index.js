const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");
require("dotenv").config();

const app = express();
const PORT = 5001;

app.use(cors());
app.use(express.json());

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

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

transporter.verify((error) => {
  if (error) {
    console.error("SMTP verify error:", error);
  } else {
    console.log("SMTP is ready to send emails");
  }
});

app.post("/send-inventory", async (req, res) => {
  try {
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

      const minimumValue = getMinimumValue(minimumLabel);
      return Number(item.inStock || 0) < minimumValue;
    });

    const lowStockRows = lowStockItems.length
      ? lowStockItems
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
          .join("")
      : "";

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
                  <tbody>
                    ${lowStockRows}
                  </tbody>
                </table>
              `
              : `<p>No low stock items.</p>`
          }
        </div>
      </div>
    `;

    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_TO,
      subject,
      html,
    });

    console.log("Accepted:", info.accepted);
    console.log("Rejected:", info.rejected);
    console.log("Response:", info.response);

    res.status(200).json({
      message: "Inventory email sent successfully",
    });
  } catch (error) {
    console.error("Email send error:", error);
    res.status(500).json({
      message: "Failed to send inventory email",
      error: error.message,
      code: error.code || null,
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});