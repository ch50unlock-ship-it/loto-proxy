const express = require("express");
const fetch = require("node-fetch");
const app = express();

app.get("/resultado", async (req, res) => {
 try {
  let r = await fetch("https://loto.com.ni/diaria/");
  let html = await r.text();

  // 🔥 Buscar patrón tipo "67 x5"
  let match = html.match(/(\d{2})\s*x\s*(\d)/i);

  let numero = "00";
  let multi = "1";

  if(match){
    numero = match[1];
    multi = match[2];
  }

  res.json({
   numero,
   multiplicador: multi
  });

 } catch (e) {
  res.json({ numero: "00", multiplicador: "1" });
 }
});

app.listen(3000, () => console.log("Servidor activo"));
