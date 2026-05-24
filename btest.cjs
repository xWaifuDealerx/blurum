const fs=require("fs");const {JSDOM}=require("jsdom");
const src=fs.readFileSync("index.html","utf8").replace('<script type="module">','<script>');
const errors=[];
const mk=()=>({request:async({method})=>method==="eth_requestAccounts"?["0x12ab000000000000000000000000000000face01"]:null,on(){}});
const dom=new JSDOM(src,{runScripts:"dangerously",pretendToBeVisual:true,url:"https://blurum.app/",
  beforeParse(w){ w.ethereum=mk(); w.HTMLElement.prototype.getBoundingClientRect=()=>({left:10,top:10,width:40,height:40,right:50,bottom:50}); if(!w.navigator.clipboard)w.navigator.clipboard={writeText(){}}; w.localStorage.clear(); }});
const w=dom.window,d=w.document; w.addEventListener("error",e=>errors.push(""+(e.message||e.error))); w.addEventListener("unhandledrejection",()=>{});
setTimeout(()=>{
  const brand=d.querySelector(".brand h1").textContent.trim();
  const connectBtn=d.querySelector("#connectBtn").textContent.trim();
  const balLabel=d.querySelector("#balTop span").textContent.trim();
  const title=d.querySelector("title").textContent;
  const fcMeta=!!d.querySelector('meta[name="fc:miniapp"]');
  const ogImg=d.querySelector('meta[property="og:image"]').getAttribute("content");
  console.log("brand:",brand,"| connect btn:",connectBtn,"| balance label:",balLabel);
  console.log("title:",title.slice(0,30),"| fc:miniapp meta:",fcMeta,"| og:image:",ogImg);
  console.log("errors:",errors.length?errors:"NONE");
  console.log((brand==="BLURUM"&&connectBtn==="Connect Wallet"&&balLabel==="$BLURUM"&&fcMeta&&!errors.length)?"OK — BLURUM rebrand + Connect Wallet + Mini App meta":"FAIL");
  w.close();process.exit(0);
},200);
