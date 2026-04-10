const express = require("express");
const cors = require("cors");
const axios = require("axios");
const cheerio = require("cheerio");
const cron = require("node-cron");

const app = express();
app.use(cors({ origin: "*" }));

/* 🧠 HISTORIAL POR FECHA */
let cache = {
 fechas: {}
};

/* 📅 FECHA NICARAGUA */
function getDate(){
 return new Date().toLocaleDateString("en-CA", {
  timeZone: "America/Managua"
 });
}

/* 🧹 LIMPIEZA */
function clean(t){
 return t.replace(/\s+/g,' ').trim();
}

/* 🌐 CARGAR HTML */
async function load(url){
 let res = await axios.get(url);
 return cheerio.load(res.data);
}

/* 🔥 EXTRAER 4 RESULTADOS */
function extract(text, regex){
 let m = [...text.matchAll(regex)];
 return m.map(x => x[1]).slice(-4);
}

/* 🎰 DIARIA (con MULTIPLICADOR X) */
async function diaria(){
 try{
  let $ = await load("https://loto.com.ni/diaria/");
  let text = clean($.text());

  let numeros = extract(text, /#\d+\s*(\d{1,2})/g);

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
  let $ = await load("https://loto.com.ni/premia2/");
  let text = clean($.text());

  let numeros = extract(text, /#\d+\s*(\d{4})/g);

  return { numeros };

 }catch(e){
  return { error:true };
 }
}

/* 🎲 JUEGA 3 */
async function juega3(){
 try{
  let $ = await load("https://loto.com.ni/juga3/");
  let text = clean($.text());

  let numeros = extract(text, /#\d+\s*(\d{3})/g);

  return { numeros };

 }catch(e){
  return { error:true };
 }
}

/* 🔄 ACTUALIZAR DÍA */
async function actualizar(){

 let fecha = getDate();

 console.log("🔄 Actualizando LOTO:", fecha);

 let data = {
  diaria: await diaria(),
  premia2: await premia2(),
  juega3: await juega3()
 };

 cache.fechas[fecha] = {
  fecha,
  data
 };

 console.log("🟢 Guardado día:", fecha);
}

/* ⏰ 9:30 PM NICARAGUA */
cron.schedule("30 3 * * *", async () => {
 await actualizar();
});

/* 📡 API */
app.get("/resultado",(req,res)=>{

 let fecha = getDate();

 res.json({
  fecha,
  data: cache.fechas[fecha] || null
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
  diasGuardados: Object.keys(cache.fechas).length
 });
});

app.listen(process.env.PORT || 3000, ()=>{
 console.log("🚀 LOTO PRO SERVER READY");
});
app.get("/test/:date", async (req,res)=>{

 let fecha = req.params.date;

 console.log("🧪 TEST FECHA:", fecha);

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
