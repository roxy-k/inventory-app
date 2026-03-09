import React, { useEffect, useMemo, useState } from "react";

const defaultItems = [
  // SUPPLY CHECKLIST
  { id: 1, category: "Supply", name: "Grey Duct Tape", inStock: 0, minimumText: "3" },
  { id: 2, category: "Supply", name: "Blue Tape", inStock: 0, minimumText: "2" },
  { id: 3, category: "Supply", name: "Pink Gloves (Small)", inStock: 0, minimumText: "1 pack (3)" },
  { id: 4, category: "Supply", name: "Dremel Blades", inStock: 0, minimumText: "1 pack (12)" },
  { id: 5, category: "Supply", name: "Rags", inStock: 0, minimumText: "1 pack" },
  { id: 6, category: "Supply", name: "Black Latex Gloves (Large)", inStock: 0, minimumText: "1 box (100)" },
  { id: 7, category: "Supply", name: "Small Gloves", inStock: 0, minimumText: "2 packs (24)" },
  { id: 8, category: "Supply", name: "Medium Gloves", inStock: 0, minimumText: "2 packs (24)" },
  { id: 9, category: "Supply", name: "Large Gloves", inStock: 0, minimumText: "2 packs (24)" },
  { id: 10, category: "Supply", name: "White Strap Rolls", inStock: 0, minimumText: "6" },
  { id: 11, category: "Supply", name: "Green Strap Rolls", inStock: 0, minimumText: "6" },
  { id: 12, category: "Supply", name: "Packing Tape", inStock: 0, minimumText: "1 box (36)" },
  { id: 13, category: "Supply", name: "Glue Bottles", inStock: 0, minimumText: "5" },
  { id: 14, category: "Supply", name: "Hand Wrap", inStock: 0, minimumText: "1 box (4)" },
  { id: 15, category: "Supply", name: "Glue", inStock: 0, minimumText: "1 tote" },
  { id: 16, category: "Supply", name: "Machine Oil", inStock: 0, minimumText: "1" },
  { id: 17, category: "Supply", name: "Acetone", inStock: 0, minimumText: "2" },
  { id: 18, category: "Supply", name: "Absorber", inStock: 0, minimumText: "1" },
  { id: 19, category: "Supply", name: "Advantage Cleaner", inStock: 0, minimumText: "1" },
  { id: 20, category: "Supply", name: "Grease", inStock: 0, minimumText: "4 tubes" },
  { id: 21, category: "Supply", name: "Bail Wire", inStock: 0, minimumText: "1" },
  { id: 22, category: "Supply", name: "White Duct Tape", inStock: 0, minimumText: "2" },
  { id: 23, category: "Supply", name: "Spray N Slide", inStock: 0, minimumText: "4" },
  { id: 24, category: "Supply", name: "White Straps (Langston)", inStock: 0, minimumText: "6" },
  { id: 25, category: "Supply", name: "White Masking Tape", inStock: 0, minimumText: "2" },

  // INK INVENTORY
  { id: 26, category: "Ink", name: "GCMI 90 Black", inStock: 0, minimumText: "3" },
  { id: 27, category: "Ink", name: "GCMI 74 Red", inStock: 0, minimumText: "1" },
  { id: 28, category: "Ink", name: "GCMI 9002 Grey", inStock: 0, minimumText: "1" },
  { id: 29, category: "Ink", name: "GCMI 33 Blue", inStock: 0, minimumText: "1" },
  { id: 30, category: "Ink", name: "GCMI 34 Blue", inStock: 0, minimumText: "1" },
  { id: 31, category: "Ink", name: "GCMI 25 Green", inStock: 0, minimumText: "1" },
  { id: 32, category: "Ink", name: "PMS 200U Red", inStock: 0, minimumText: "0" },
  { id: 33, category: "Ink", name: "GCMI 394 Blue", inStock: 0, minimumText: "0" },
  { id: 34, category: "Ink", name: "Cascade White", inStock: 0, minimumText: "0" },
  { id: 35, category: "Ink", name: "Reflex Blue", inStock: 0, minimumText: "1" },
  { id: 36, category: "Ink", name: "GCMI 3061", inStock: 0, minimumText: "0" },
  { id: 37, category: "Ink", name: "GCMI 91 White", inStock: 0, minimumText: "0" },
  { id: 38, category: "Ink", name: "GCMI 10 Yellow", inStock: 0, minimumText: "0" }
];

function getMinimumValue(minimumText) {
  const match = String(minimumText).match(/\d+/);
  return match ? Number(match[0]) : 0;
}

function App() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 768);
  const [items, setItems] = useState(() => {
    const savedItems = localStorage.getItem("inventoryItems");
    return savedItems ? JSON.parse(savedItems) : defaultItems;
  });

  const [previousItems, setPreviousItems] = useState(() => {
    const savedPreviousItems = localStorage.getItem("inventoryPreviousItems");
    return savedPreviousItems ? JSON.parse(savedPreviousItems) : defaultItems;
  });

  const [history, setHistory] = useState(() => {
    const savedHistory = localStorage.getItem("inventoryHistory");
    return savedHistory ? JSON.parse(savedHistory) : [];
  });

  const [showLowOnly, setShowLowOnly] = useState(false);

  const [newCategory, setNewCategory] = useState("Supply");
  const [newName, setNewName] = useState("");
  const [newStock, setNewStock] = useState("");
  const [newMinimumText, setNewMinimumText] = useState("");

  const [isSending, setIsSending] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    localStorage.setItem("inventoryItems", JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    localStorage.setItem("inventoryPreviousItems", JSON.stringify(previousItems));
  }, [previousItems]);

  useEffect(() => {
    localStorage.setItem("inventoryHistory", JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const createHistoryRecord = (itemName, previousValue, newValue, customText = null) => {
    const now = new Date();

    return {
      id: Date.now() + Math.random(),
      itemName,
      previousValue,
      newValue,
      changedAt: now.toLocaleString(),
      dateGroup: now.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric"
      }),
      timeOnly: now.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit"
      }),
      customText
    };
  };

  const updateItemField = (id, field, value) => {
    setItems((prevItems) =>
      prevItems.map((item) => {
        if (item.id !== id) return item;

        if (field === "name" || field === "minimumText") {
          return { ...item, [field]: value };
        }

        if (field === "inStock") {
          if (value === "") return { ...item, inStock: "" };

          const numericValue = Number(value);

          if (Number.isNaN(numericValue) || numericValue < 0) {
            return item;
          }

          return { ...item, inStock: numericValue };
        }

        return item;
      })
    );
  };

  const saveInventory = () => {
    const changes = [];

    items.forEach((item) => {
      const prevItem = previousItems.find((p) => p.id === item.id);
      if (!prevItem) return;

      const currentStock = item.inStock === "" ? 0 : Number(item.inStock);
      const prevStock = prevItem.inStock === "" ? 0 : Number(prevItem.inStock);

      if (prevItem.name !== item.name) {
        changes.push(
          createHistoryRecord(
            item.name,
            prevItem.name,
            item.name,
            `Name changed: "${prevItem.name}" → "${item.name}"`
          )
        );
      }

      if (prevStock !== currentStock) {
        changes.push(
          createHistoryRecord(
            item.name,
            prevStock,
            currentStock,
            `Stock changed: ${prevStock} → ${currentStock}`
          )
        );
      }

      if (prevItem.minimumText !== item.minimumText) {
        changes.push(
          createHistoryRecord(
            item.name,
            prevItem.minimumText,
            item.minimumText,
            `Minimum changed: "${prevItem.minimumText}" → "${item.minimumText}"`
          )
        );
      }
    });

    if (changes.length > 0) {
      setHistory((prev) => [...changes, ...prev]);
      setMessage("Inventory saved.");
    } else {
      setMessage("No changes to save.");
    }

    const normalizedItems = items.map((item) => ({
      ...item,
      name: item.name.trim(),
      inStock: item.inStock === "" ? 0 : Number(item.inStock),
      minimumText: item.minimumText.trim()
    }));

    setItems(normalizedItems);
    setPreviousItems(normalizedItems);
  };

  const addItem = () => {
    const trimmedName = newName.trim();
    const trimmedMinimumText = newMinimumText.trim();

    if (!trimmedName) {
      setMessage("Enter item name.");
      return;
    }

    if (newStock === "") {
      setMessage("Enter In Stock.");
      return;
    }

    if (!trimmedMinimumText) {
      setMessage("Enter Minimum.");
      return;
    }

    const stockValue = Number(newStock);

    if (Number.isNaN(stockValue) || stockValue < 0) {
      setMessage("In Stock must be 0 or more.");
      return;
    }

    const duplicateName = items.some(
      (item) =>
        item.category === newCategory &&
        item.name.toLowerCase() === trimmedName.toLowerCase()
    );

    if (duplicateName) {
      setMessage("This item already exists in this section.");
      return;
    }

    const newItem = {
      id: Date.now(),
      category: newCategory,
      name: trimmedName,
      inStock: stockValue,
      minimumText: trimmedMinimumText
    };

    setItems((prev) => [...prev, newItem]);
    setPreviousItems((prev) => [...prev, newItem]);

    setHistory((prev) => [
      createHistoryRecord(trimmedName, "", "", `Item added to ${newCategory}: "${trimmedName}"`),
      ...prev
    ]);

    setNewCategory("Supply");
    setNewName("");
    setNewStock("");
    setNewMinimumText("");
    setMessage("New item added.");
  };

  const deleteItem = (id) => {
    const itemToDelete = items.find((item) => item.id === id);
    if (!itemToDelete) return;

    const confirmed = window.confirm(`Delete "${itemToDelete.name}"?`);
    if (!confirmed) return;

    setItems((prev) => prev.filter((item) => item.id !== id));
    setPreviousItems((prev) => prev.filter((item) => item.id !== id));

    setHistory((prev) => [
      createHistoryRecord(
        itemToDelete.name,
        "",
        "",
        `Item deleted from ${itemToDelete.category}: "${itemToDelete.name}"`
      ),
      ...prev
    ]);

    setMessage("Item deleted.");
  };

  const sendInventory = async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);
    const envBase = import.meta.env.VITE_API_URL
      ? String(import.meta.env.VITE_API_URL).replace(/\/$/, "")
      : "";
    const endpoint = `${envBase}/send-inventory`.replace(/^\/send-inventory$/, "/send-inventory");

    try {
      setIsSending(true);
      setMessage("Sending email...");

      const normalizedItems = items.map((item) => ({
        ...item,
        name: String(item.name || "").trim(),
        inStock: item.inStock === "" ? 0 : Number(item.inStock),
        minimumText: String(item.minimumText || "").trim(),
        minimum: getMinimumValue(item.minimumText)
      }));

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ items: normalizedItems }),
        signal: controller.signal
      });

      const text = await response.text();
      let data = {};

      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        data = { message: text };
      }

      if (!response.ok) {
        throw new Error(data.message || "Failed to send inventory email");
      }

      setMessage("Inventory email sent successfully.");
    } catch (error) {
      if (error.name === "AbortError") {
        setMessage("Request took too long. Try again in 20–30 seconds.");
      } else if (error instanceof TypeError) {
        setMessage("Cannot connect to mail server. Check backend on port 5001.");
      } else {
        setMessage(error.message || "Something went wrong.");
      }
    } finally {
      clearTimeout(timeoutId);
      setIsSending(false);
    }
  };

  const groupedHistory = useMemo(() => {
    const groups = {};

    history.forEach((record) => {
      const key = record.dateGroup || "Unknown Date";
      if (!groups[key]) groups[key] = [];
      groups[key].push(record);
    });

    return Object.entries(groups);
  }, [history]);

  const supplyItems = items.filter((item) => item.category === "Supply");
  const inkItems = items.filter((item) => item.category === "Ink");

  const renderTable = (title, sectionItems) => {
    const visibleItems = sectionItems.filter((item) => {
      if (!showLowOnly) return true;
      return Number(item.inStock || 0) < getMinimumValue(item.minimumText);
    });

    return (
      <div style={{ marginBottom: "28px" }}>
        <h2 style={sectionTitleStyle}>{title}</h2>

        <div style={cardStyle}>
          <table style={{ ...tableStyle, minWidth: isMobile ? "640px" : "760px" }}>
            <thead>
              <tr style={tableHeadRowStyle}>
                <th style={{ ...thStyle, fontSize: isMobile ? "13px" : "14px", padding: isMobile ? "10px 8px" : "12px" }}>
                  Item
                </th>
                <th style={{ ...thStyle, fontSize: isMobile ? "13px" : "14px", padding: isMobile ? "10px 8px" : "12px" }}>
                  In Stock
                </th>
                <th style={{ ...thStyle, fontSize: isMobile ? "13px" : "14px", padding: isMobile ? "10px 8px" : "12px" }}>
                  Minimum
                </th>
                <th style={{ ...thStyle, fontSize: isMobile ? "13px" : "14px", padding: isMobile ? "10px 8px" : "12px" }}>
                  Status
                </th>
                <th style={{ ...thStyle, fontSize: isMobile ? "13px" : "14px", padding: isMobile ? "10px 8px" : "12px" }}>
                  Action
                </th>
              </tr>
            </thead>

            <tbody>
              {visibleItems.map((item) => {
                const low = Number(item.inStock || 0) < getMinimumValue(item.minimumText);

                return (
                  <tr key={item.id} style={{ backgroundColor: low ? "#fff1f2" : "#ffffff" }}>
                    <td style={{ ...tdStyle, padding: isMobile ? "10px 8px" : "12px" }}>
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => updateItemField(item.id, "name", e.target.value)}
                        style={{ ...inputStyle, width: "100%" }}
                      />
                    </td>

                    <td style={{ ...tdStyle, padding: isMobile ? "10px 8px" : "12px" }}>
                      <input
                        type="number"
                        min="0"
                        value={item.inStock}
                        onChange={(e) => updateItemField(item.id, "inStock", e.target.value)}
                        style={{ ...inputStyle, width: isMobile ? "72px" : "90px" }}
                      />
                    </td>

                    <td style={{ ...tdStyle, padding: isMobile ? "10px 8px" : "12px" }}>
                      <input
                        type="text"
                        value={item.minimumText}
                        onChange={(e) => updateItemField(item.id, "minimumText", e.target.value)}
                        style={{ ...inputStyle, width: isMobile ? "120px" : "140px" }}
                      />
                    </td>

                    <td style={{ ...tdStyle, padding: isMobile ? "10px 8px" : "12px" }}>
                      <span
                        style={{
                          ...statusStyle,
                          color: low ? "#b91c1c" : "#166534",
                          backgroundColor: low ? "#fee2e2" : "#dcfce7"
                        }}
                      >
                        {low ? "⚠️ Low" : "OK"}
                      </span>
                    </td>

                    <td style={{ ...tdStyle, padding: isMobile ? "10px 8px" : "12px" }}>
                      <button onClick={() => deleteItem(item.id)} style={deleteButtonStyle}>
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div style={{ ...pageStyle, padding: isMobile ? "14px" : "32px" }}>
      <div style={{ ...headerStyle, alignItems: isMobile ? "flex-start" : "center" }}>
        <img src="/logo.png" alt="logo" style={logoStyle} />
        <div>
          <h1 style={{ ...titleStyle, fontSize: isMobile ? "28px" : "32px" }}>Inventory</h1>
          <p style={subtitleStyle}>Supply Checklist + Ink Inventory</p>
        </div>
      </div>

      <div style={toolbarStyle}>
        <button onClick={() => setShowLowOnly(!showLowOnly)} style={buttonStyle}>
          {showLowOnly ? "Show All Items" : "Low Stock Only"}
        </button>

        <button onClick={saveInventory} style={buttonStyle}>
          Save Inventory
        </button>

        <button
          onClick={sendInventory}
          disabled={isSending}
          style={{
            ...buttonStyle,
            opacity: isSending ? 0.7 : 1,
            cursor: isSending ? "not-allowed" : "pointer"
          }}
        >
          {isSending ? "Sending..." : "Send Inventory"}
        </button>
      </div>

      {message && <div style={messageStyle}>{message}</div>}

      {renderTable("Supply Checklist", supplyItems)}
      {renderTable("Ink Inventory", inkItems)}

      <h2 style={sectionTitleStyle}>Add Item</h2>
      <div style={cardStyle}>
        <div style={addFormStyle}>
          <select
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            style={{ ...inputStyle, width: "150px" }}
          >
            <option value="Supply">Supply</option>
            <option value="Ink">Ink</option>
          </select>

          <input
            type="text"
            placeholder="Item name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            style={{ ...inputStyle, minWidth: "240px" }}
          />

          <input
            type="number"
            min="0"
            placeholder="In stock"
            value={newStock}
            onChange={(e) => setNewStock(e.target.value)}
            style={{ ...inputStyle, minWidth: "140px",width: "100%" }}
          />

          <input
            type="text"
            placeholder='Minimum (example: 3 or 1 pack (12))'
            value={newMinimumText}
            onChange={(e) => setNewMinimumText(e.target.value)}
            style={{ ...inputStyle, minWidth: "220px",width: "100%" }}
          />

          <button onClick={addItem} style={buttonStyle}>
            Add
          </button>
        </div>
      </div>

      <h2 style={sectionTitleStyle}>History</h2>
      {history.length === 0 ? (
        <div style={cardStyle}>
          <p style={{ margin: 0 }}>No changes yet.</p>
        </div>
      ) : (
        groupedHistory.map(([date, records]) => (
          <div key={date} style={{ marginBottom: "24px" }}>
            <h3 style={historyDateTitleStyle}>{date}</h3>
            <div style={cardStyle}>
              <table style={tableStyle}>
                <thead>
                  <tr style={tableHeadRowStyle}>
                    <th style={thStyle}>Time</th>
                    <th style={thStyle}>Item</th>
                    <th style={thStyle}>Previous</th>
                    <th style={thStyle}>New</th>
                    <th style={thStyle}>Note</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((record) => (
                    <tr key={record.id}>
                      <td style={tdStyle}>{record.timeOnly || record.changedAt}</td>
                      <td style={tdStyle}>{record.itemName}</td>
                      <td style={tdStyle}>{record.previousValue}</td>
                      <td style={tdStyle}>{record.newValue}</td>
                      <td style={tdStyle}>{record.customText || ""}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

const pageStyle = {
  padding: "32px",
  fontFamily: "Arial, sans-serif",
  maxWidth: "1200px",
  margin: "0 auto",
  backgroundColor: "#f8fafc",
  minHeight: "100vh"
};

const headerStyle = {
  display: "flex",
  alignItems: "center",
  gap: "16px",
  marginBottom: "24px"
};

const logoStyle = {
  height: "64px",
  width: "64px",
  objectFit: "contain",
  borderRadius: "12px",
  backgroundColor: "#ffffff",
  padding: "6px",
  boxShadow: "0 1px 3px rgba(0,0,0,0.08)"
};

const titleStyle = {
  margin: 0,
  fontSize: "32px",
  color: "#0f172a"
};

const subtitleStyle = {
  margin: "4px 0 0 0",
  color: "#475569"
};

const toolbarStyle = {
  display: "flex",
  gap: "12px",
  flexWrap: "wrap",
  marginBottom: "18px"
};

const messageStyle = {
  marginBottom: "18px",
  padding: "12px 14px",
  borderRadius: "10px",
  backgroundColor: "#ffffff",
  border: "1px solid #e2e8f0",
  color: "#0f172a",
  fontWeight: "bold"
};

const cardStyle = {
  backgroundColor: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: "14px",
  padding: "18px",
  boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
  overflowX: "auto"
};

const tableStyle = {
  borderCollapse: "collapse",
  width: "100%",
  minWidth: "760px"
};

const tableHeadRowStyle = {
  backgroundColor: "#f8fafc"
};

const thStyle = {
  borderBottom: "1px solid #e2e8f0",
  padding: "12px",
  textAlign: "left",
  color: "#334155",
  fontSize: "14px"
};

const tdStyle = {
  borderBottom: "1px solid #f1f5f9",
  padding: "12px",
  verticalAlign: "middle"
};

const inputStyle = {
  padding: "10px 12px",
  border: "1px solid #cbd5e1",
  borderRadius: "8px",
  outline: "none",
  fontSize: "14px",
  backgroundColor: "#ffffff"
};

const buttonStyle = {
  padding: "10px 16px",
  border: "1px solid #cbd5e1",
  borderRadius: "8px",
  backgroundColor: "#ffffff",
  cursor: "pointer",
  fontSize: "14px",
  fontWeight: "bold",
  color: "#0f172a"
};

const deleteButtonStyle = {
  padding: "8px 12px",
  border: "1px solid #fecaca",
  borderRadius: "8px",
  backgroundColor: "#fff1f2",
  cursor: "pointer",
  fontSize: "13px",
  fontWeight: "bold",
  color: "#b91c1c"
};

const statusStyle = {
  display: "inline-block",
  padding: "6px 10px",
  borderRadius: "999px",
  fontSize: "13px",
  fontWeight: "bold"
};

const addFormStyle = {
  display: "flex",
  gap: "12px",
  flexWrap: "wrap",
  alignItems: "center"
};

const sectionTitleStyle = {
  margin: "0 0 10px 0",
  color: "#0f172a"
};

const historyDateTitleStyle = {
  margin: "0 0 10px 0",
  color: "#334155",
  paddingBottom: "8px",
  borderBottom: "2px solid #e2e8f0"
};

export default App;
