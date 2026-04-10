const express = require("express");
const cors = require("cors");

const app = express();

// 🔥 IMPORTANTE PARA FRONTEND
app.use(cors({ origin: "*" }));

app.get("/resultado", (req, res) => {
  const numero = Math.floor(Math.random() * 100).toString().padStart(2, "0");
  const multiplicador = (Math.random() * 5).toFixed(1);

  res.json({
    numero,
    multiplicador
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Servidor corriendo en puerto", PORT);
});
