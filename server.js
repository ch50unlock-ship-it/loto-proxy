const express = require("express");
const cors = require("cors");
const axios = require("axios");
const cheerio = require("cheerio");
const cron = require("node-cron");

const app = express();
app.use(cors({ origin: "*" }));

/* 🧠 CACHE POR FECHA */
let cache = {
 fechas: {}
};

/* 📅 FECHA NICARAGUA */
function getDate(){
 return new Date().toLocaleDateString("en-CA", {
  timeZone: "America/Managua"
 });
}

/* 🌐 LOAD HTML */
async function load(url){
 let res = await axios.get(url);
 return cheerio.load(res.data);
}

/* 🧹 LIMPIEZA FUERTE */
function clean(t){
 return t.replace(/\s+/g,' ').trim();
}

/* 🔥 SOLO BLOQUES REALES DE RESULTADOS */
function getBlocks($){
 let blocks = [];

 $("*").each((i,el)=>{
  let t = $(el).text();

  // solo líneas que parecen resultados reales
  if(/#\d+/.test(t) && t.length < 200){
   blocks.push(clean(t));
  }
 });

 return blocks;
}

/* 🎯 EXTRAER ÚLTIMOS 4 LIMPIOS */
function extractNumbers(blocks, regex, size){
 return blocks
  .map(b => (b.match(regex) || [])[1])
  .filter(v =>
   v &&
   v !== "0" &&
   v !== "000" &&
   v !== "0000"
  )
  .slice(0, size);
}

/* 🎰 DIARIA */
async function diaria(){
 try{
  let $ = await load("https://loto.com.ni/diaria/");
  let blocks = getBlocks($);

  let numeros = extractNumbers(blocks, /(\d{1,2})/, 4);

  let multi = blocks[0]?.match(/(\d+)xMAS|MULTI[- ]?X\s*(\d+)/i);

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
  let $ = await load("https://loto.com.ni/premia2/");
  let blocks = getBlocks($);

  let numeros = extractNumbers(blocks, /(\d{4})/, 4);

  return { numeros };

 }catch(e){
  return { error:true };
 }
}

/* 🎲 JUEGA 3 */
async function juega3(){
 try{
  let $ = await load("https://loto.com.ni/juga3/");
  let blocks = getBlocks($);

  let numeros = extractNumbers(blocks, /(\d{3})/, 4);

  return { numeros };

 }catch(e){
  return { error:true };
 }
}

/* 🔄 ACTUALIZAR DÍA */
async function actualizar(){

 let fecha = getDate();

 console.log("🔄 PRECISIÓN TOTAL:", fecha);

 let data = {
  diaria: await diaria(),
  premia2: await premia2(),
  juega3: await juega3()
 };

 cache.fechas[fecha] = {
  fecha,
  data
 };

 console.log("🟢 OK GUARDADO:", fecha);
}

/* ⏰ 9:30 PM NICARAGUA */
cron.schedule("30 3 * * *", async ()=>{
 await actualizar();
});

/* 🚀 AUTO START */
actualizar();

/* 📡 RESULTADO DÍA ACTUAL */
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

 console.log("🧪 TEST PRECISIÓN:", fecha);

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

/* 📊 HISTORIAL */
app.get("/historial",(req,res)=>{
 res.json(cache);
});

/* 🔥 STATUS */
app.get("/status",(req,res)=>{
 res.json({
  ok:true,
  dias: Object.keys(cache.fechas).length
 });
});

app.listen(process.env.PORT || 3000, ()=>{
 console.log("🚀 PRECISIÓN TOTAL LOTO PRO ACTIVE");
});
