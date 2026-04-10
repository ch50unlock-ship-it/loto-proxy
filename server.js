const express = require("express");
const fetch = require("node-fetch");
const app = express();

app.get("/resultado", async (req, res) => {
 try {
  let r = await fetch("https://loterianacional.com.ni/");
  let html = await r.text();

  // 🔥 busca números más específicos (2 o 3 dígitos aislados)
  let matches = html.match(/\b\d{2,3}\b/g);

  let numero = "00";

  if(matches && matches.length > 0){
    // toma uno de los últimos (más probable resultado reciente)
    numero = matches[matches.length - 1];
  }

  res.json({ numero });

 } catch (e) {
  res.json({ numero: "00" });
 }
});

app.listen(3000, () => console.log("Servidor activo"));
