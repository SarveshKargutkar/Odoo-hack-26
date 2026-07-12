require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors({ origin: "http://localhost:4200", credentials: true }));
app.use(express.json());

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/dashboard", require("./routes/dashboard"));
app.use("/api/vehicles", require("./routes/vehicles"));
app.use("/api/drivers", require("./routes/drivers"));
app.use("/api/trips", require("./routes/trips"));
app.use("/api/maintenance", require("./routes/maintenance"));
app.use("/api/fuel", require("./routes/fuel"));
app.use("/api/expenses", require("./routes/expenses"));
app.use("/api/analytics", require("./routes/analytics"));

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res
    .status(500)
    .json({ message: "Internal server error", error: err.message });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`TransitOps API running on port ${PORT}`));
