const express = require("express");
const cors = require("cors");
const axios = require("axios");
const cheerio = require("cheerio");
const cron = require("node-cron");

const app = express();
app.use(cors({ origin: "*" }));

/* 🧠 CACHE */
let cache = {
 fecha: null,
 data: null
};

function clean(t){
 return t.replace(/\s+/g,' ').trim();
}

/* 🔥 sacar hasta 4 resultados */
function extraer(text, regex){
 let m = [...text.matchAll(regex)];
 return m.map(x => x[1]).slice(0,4);
}

/* 🎰 DIARIA */
async function diaria(){
 try{
  let res = await axios.get("https://loto.com.ni/diaria/");
  let $ = cheerio.load(res.data);
  let text = clean($("body").text());

  let numeros = extraer(text, /#\d+\s*(\d{1,2})/g);
  let multi = text.match(/(\d+)xMAS|MULTI[- ]?X\s*(\d+)/i);

  return {
   numeros,
   multiplicador: multi ? (multi[1] || multi[2]) : null
  };
 }catch(e){
  return { error:true };
 }
}

/* 🎯 PREMIA 2 */
async function premia2(){
 try{
  let res = await axios.get("https://loto.com.ni/premia2/");
  let $ = cheerio.load(res.data);
  let text = clean($("body").text());

  let numeros = extraer(text, /#\d+\s*(\d{4})/g);

  return { numeros };
 }catch(e){
  return { error:true };
 }
}

/* 🎲 JUEGA 3 */
async function juega3(){
 try{
  let res = await axios.get("https://loto.com.ni/juga3/");
  let $ = cheerio.load(res.data);
  let text = clean($("body").text());

  let numeros = extraer(text, /#\d+\s*(\d{3})/g);

  return { numeros };
 }catch(e){
  return { error:true };
 }
}

/* 🔄 ACTUALIZAR */
async function actualizar(){

 console.log("🔄 Actualizando LOTO...");

 let d = await diaria();
 let p = await premia2();
 let j = await juega3();

 cache = {
  fecha: new Date().toISOString().split("T")[0],
  data: {
   diaria: d,
   premia2: p,
   juega3: j
  }
 };

 console.log("🟢 CACHE OK");
}

/* ⏰ 9:30 PM NICARAGUA (3:30 AM UTC) */
cron.schedule("30 3 * * *", async ()=>{
 await actualizar();
});

/* 📡 API */
app.get("/resultado",(req,res)=>{
 res.json(cache);
});

/* STATUS */
app.get("/status",(req,res)=>{
 res.json({ ok:true, cache });
});

app.listen(process.env.PORT || 3000, ()=>{
 console.log("🚀 LOTO SERVER ON");
});
actualizar();
