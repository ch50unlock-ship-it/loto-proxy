const express = require("express");
const cors = require("cors");
const axios = require("axios");
const cheerio = require("cheerio");
const cron = require("node-cron");

const app = express();
app.use(cors({ origin: "*" }));

/* 🧠 CACHE */
let cache = {
 fechas: {}
};

/* 📅 FECHA NICARAGUA */
function getDate(){
 return new Date().toLocaleDateString("en-CA", {
  timeZone: "America/Managua"
 });
}

/* 🌐 LOAD */
async function load(url){
 let res = await axios.get(url);
 return cheerio.load(res.data);
}

/* 🔥 EXTRAER POR BLOQUES REALES */
function parseResultBox($, selector){

 let results = [];

 $(selector).each((i,el)=>{

  let date = $(el).find(".draw-date").text().trim();
  let time = $(el).find(".draw-time").text().trim();
  let id = $(el).find(".draw-id").text().trim();

  let digits = [];

  $(el).find(".digit").each((i,d)=>{
   digits.push($(d).text().trim());
  });

  if(digits.length > 0){
   results.push({
    date,
    time,
    id,
    number: digits.join("")
   });
  }

 });

 return results.slice(0,4);
}

/* 🎰 DIARIA */
async function diaria(){
 try{
  let $ = await load("https://loto.com.ni/diaria/");

  let results = parseResultBox($, ".result-box");

  let multiplicador = null;

  let text = $.text();
  let match = text.match(/(\d+)xMAS|MULTI[- ]?X\s*(\d+)/i);
  if(match) multiplicador = match[1] || match[2];

  return {
   numeros: results.map(r => r.number),
   multiplicador
  };

 }catch(e){
  return { error:true };
 }
}

/* 🎯 PREMIA 2 */
async function premia2(){
 try{
  let $ = await load("https://loto.com.ni/premia2/");

  let results = parseResultBox($, ".result-box");

  return {
   numeros: results.map(r => r.number)
  };

 }catch(e){
  return { error:true };
 }
}

/* 🎲 JUEGA 3 */
async function juega3(){
 try{
  let $ = await load("https://loto.com.ni/juga3/");

  let results = parseResultBox($, ".result-box");

  return {
   numeros: results.map(r => r.number)
  };

 }catch(e){
  return { error:true };
 }
}

/* 🔄 ACTUALIZAR */
async function actualizar(){

 let fecha = getDate();

 console.log("🔄 SCRAPING REAL HTML:", fecha);

 let data = {
  diaria: await diaria(),
  premia2: await premia2(),
  juega3: await juega3()
 };

 cache.fechas[fecha] = {
  fecha,
  data
 };

 console.log("🟢 OK REAL GUARDADO:", fecha);
}

/* ⏰ 9:30 PM NICARAGUA */
cron.schedule("30 3 * * *", async ()=>{
 await actualizar();
});

/* 🚀 START */
actualizar();

/* 📡 RESULTADO */
app.get("/resultado",(req,res)=>{

 let fecha = getDate();

 res.json({
  fecha,
  data: cache.fechas[fecha] || null
 });
});

/* 🧪 TEST POR FECHA */
app.get("/test/:date", async (req,res)=>{

 let fecha = req.params.date;

 let data = {
  diaria: await diaria(),
  premia2: await premia2(),
  juega3: await juega3()
 };

 cache.fechas[fecha] = {
  fecha,
  data
 };

 res.json({
  ok:true,
  fecha,
  data
 });

});

/* 📊 STATUS */
app.get("/status",(req,res)=>{
 res.json({
  ok:true,
  dias: Object.keys(cache.fechas).length
 });
});

app.listen(process.env.PORT || 3000, ()=>{
 console.log("🚀 PRECISIÓN HTML REAL ACTIVE");
});
