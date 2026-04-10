const express = require("express");
const cors = require("cors");
const cron = require("node-cron");
const { chromium } = require("playwright");

const app = express();
app.use(cors({ origin: "*" }));

let cache = {
 fechas: {}
};

/* 📅 FECHA NICARAGUA */
function getDate(){
 return new Date().toLocaleDateString("en-CA", {
  timeZone: "America/Managua"
 });
}

/* 🔥 BROWSER SCRAPER REAL */
async function scrape(url){

 const browser = await chromium.launch({
  headless: true
 });

 const page = await browser.newPage();

 await page.goto(url, { waitUntil: "networkidle" });

 // esperar render completo
 await page.waitForTimeout(3000);

 const data = await page.evaluate(() => {

  function getBoxes(){

   let boxes = document.querySelectorAll(".result-box");

   let results = [];

   boxes.forEach(b => {

    let date = b.querySelector(".draw-date")?.innerText || "";
    let time = b.querySelector(".draw-time")?.innerText || "";
    let id = b.querySelector(".draw-id")?.innerText || "";

    let digits = [...b.querySelectorAll(".digit")]
      .map(d => d.innerText.trim())
      .join("");

    if(digits){
     results.push({ date, time, id, number: digits });
    }

   });

   return results;
  }

  return getBoxes();

 });

 await browser.close();

 return data.slice(0,4);
}

/* 🎰 DIARIA */
async function diaria(){
 try{

  let results = await scrape("https://loto.com.ni/diaria/");

  return {
   numeros: results.map(r => r.number),
   multiplicador: "7"
  };

 }catch(e){
  return { error:true };
 }
}

/* 🎯 PREMIA 2 */
async function premia2(){
 try{

  let results = await scrape("https://loto.com.ni/premia2/");

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

  let results = await scrape("https://loto.com.ni/juga3/");

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

 console.log("🧠 SCRAPING BROWSER REAL:", fecha);

 let data = {
  diaria: await diaria(),
  premia2: await premia2(),
  juega3: await juega3()
 };

 cache.fechas[fecha] = {
  fecha,
  data
 };

 console.log("🟢 GUARDADO:", fecha);
}

/* ⏰ 9:30 PM NICARAGUA */
cron.schedule("30 3 * * *", async ()=>{
 await actualizar();
});

/* 🚀 START */
actualizar();

/* 📡 API */
app.get("/resultado",(req,res)=>{

 let fecha = getDate();

 res.json({
  fecha,
  data: cache.fechas[fecha] || null
 });
});

/* 🧪 TEST */
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

 res.json({ ok:true, fecha, data });

});

/* 📊 STATUS */
app.get("/status",(req,res)=>{
 res.json({
  ok:true,
  dias: Object.keys(cache.fechas).length
 });
});

app.listen(process.env.PORT || 3000, ()=>{
 console.log("🚀 ULTRA BROWSER SCRAPER ACTIVE");
});
