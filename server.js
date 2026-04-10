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

/* 🧠 SCRAPER ROBUSTO (SIN DEPENDER DE CLASES) */
async function scrape(url){

 let browser = null;

 try{

  browser = await chromium.launch({
   headless: true,
   args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  const page = await browser.newPage();

  await page.goto(url, { waitUntil: "domcontentloaded" });

  await page.waitForTimeout(5000);

  const data = await page.evaluate(() => {

   let text = document.body.innerText;

   // buscar números de 3 o 4 dígitos en toda la página
   let matches = text.match(/\b\d{3,4}\b/g);

   if(!matches) return [];

   let clean = [...new Set(matches)]
    .filter(n =>
      n !== "0000" &&
      n !== "000" &&
      n.length >= 3
    );

   return clean.slice(0,4);

  });

  await browser.close();

  return data;

 }catch(e){

  if(browser) await browser.close();

  console.log("❌ SCRAPER ERROR:", e.message);

  return [];
 }
}

/* 🎰 DIARIA */
async function diaria(){
 let numeros = await scrape("https://loto.com.ni/diaria/");

 return {
  numeros,
  multiplicador: "7"
 };
}

/* 🎯 PREMIA 2 */
async function premia2(){
 let numeros = await scrape("https://loto.com.ni/premia2/");

 return {
  numeros
 };
}

/* 🎲 JUEGA 3 */
async function juega3(){
 let numeros = await scrape("https://loto.com.ni/juga3/");

 return {
  numeros
 };
}

/* 🔄 ACTUALIZAR CACHE */
async function actualizar(){

 let fecha = getDate();

 console.log("🔄 SCRAPING ROBUSTO:", fecha);

 let data = {
  diaria: await diaria(),
  premia2: await premia2(),
  juega3: await juega3()
 };

 cache.fechas[fecha] = {
  fecha,
  data
 };

 console.log("🟢 GUARDADO OK:", fecha);
}

/* ⏰ 9:30 PM NICARAGUA */
cron.schedule("30 3 * * *", async ()=>{
 await actualizar();
});

/* 🚀 API RESULTADO */
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

/* 🚀 START SERVER */
app.listen(process.env.PORT || 3000, ()=>{
 console.log("🚀 LOTO ROBUST SCRAPER ONLINE");
});
