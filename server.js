const express = require("express");
const fetch = require("node-fetch");
const app = express();

app.get("/resultado", async (req, res) => {
 try {
  let r = await fetch("https://loterianacional.com.ni/");
  let html = await r.text();

  let match = html.match(/\d{2,3}/);
  let numero = match ? match[0] : "00";

  res.json({
   numero
  });

 } catch (e) {
  res.json({ numero: "00" });
 }
});

app.listen(3000, () => console.log("Servidor activo"));
