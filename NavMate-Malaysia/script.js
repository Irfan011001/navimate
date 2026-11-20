const $=id=>document.getElementById(id), KL={lat:3.139,lon:101.6869,name:"Kuala Lumpur"};
let start={...KL},dest=null,routes=[],chosen=0,line=null,nearLayer=null,alertLayer=null,watch=null,nearType="fuel",filter="flood",stepNo=0;
const map=L.map("map",{zoomControl:false}).setView([KL.lat,KL.lon],12);L.control.zoom({position:"bottomright"}).addTo(map);L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:19,attribution:"© OpenStreetMap contributors"}).addTo(map);
const sayStatus=(s)=>$("status").textContent=s, safe=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function marker(lat,lon,color,label){return L.marker([lat,lon],{icon:L.divIcon({className:"",html:`<b style="display:grid;place-items:center;background:${color};color:white;border:2px solid white;border-radius:50%;width:25px;height:25px">${label}</b>`,iconSize:[25,25],iconAnchor:[12,12]})}).addTo(map)}
async function search(q){let u=new URL("https://nominatim.openstreetmap.org/search");u.search=new URLSearchParams({q:q+", Malaysia",format:"jsonv2",limit:5,countrycodes:"my"});let r=await fetch(u);if(!r.ok)throw Error("Place search unavailable");return r.json()}
function autocomplete(inputId,boxId,which){let timer;$(inputId).oninput=()=>{clearTimeout(timer);let q=$(inputId).value.trim();if(q.length<3){$(boxId).classList.remove("show");return}timer=setTimeout(async()=>{try{let ps=await search(q),box=$(boxId);box.innerHTML="";ps.forEach(p=>{let b=document.createElement("button");b.innerHTML=`<b>${safe(p.display_name.split(",").slice(0,2).join(","))}</b><br><small>${safe(p.display_name)}</small>`;b.onclick=()=>{let v={lat:+p.lat,lon:+p.lon,name:p.display_name.split(",").slice(0,2).join(",")};if(which==="start")start=v;else dest=v;recordHistory(v);$(inputId).value=v.name;box.classList.remove("show");map.setView([v.lat,v.lon],14)};box.append(b)});box.classList.add("show")}catch(e){sayStatus(e.message)}},450)}}
autocomplete("from","fromSuggest","start");autocomplete("to","toSuggest","dest");
function dist(m){return m>1000?(m/1000).toFixed(1)+" km":Math.round(m)+" m"}function mins(s){let m=Math.round(s/60);return m<60?m+" min":Math.floor(m/60)+" hr "+m%60+" min"}
async function findRoutes(){if(!dest){sayStatus("Select a destination first.");return}sayStatus("Calculating routes…");try{let u=`https://router.project-osrm.org/route/v1/driving/${start.lon},${start.lat};${dest.lon},${dest.lat}?overview=full&geometries=geojson&steps=true&alternatives=true`;let r=await fetch(u),d=await r.json();if(d.code!=="Ok")throw Error("No route found");routes=d.routes.slice(0,3);chosen=0;renderRoutes();$("routes").hidden=false;choose(0);sayStatus("Routes ready.")}catch(e){sayStatus(e.message)}}
function renderRoutes(){$("choices").innerHTML="";routes.forEach((r,i)=>{let b=document.createElement("button");b.className=i===chosen?"selected":"";b.textContent=`${i?"Alternative "+i:"Recommended"} — ${dist(r.distance)} · ${mins(r.duration)}`;b.onclick=()=>choose(i);$("choices").append(b)})}
function instruction(s){let m=s.maneuver||{},t=m.type||"continue",mod=m.modifier||"";if(t==="arrive")return"Arrive at destination";if(t==="depart")return"Head "+(mod||"forward")+(s.name?" onto "+s.name:"");let words={turn:"Turn "+mod,continue:"Continue",merge:"Merge",roundabout:"Enter roundabout","on ramp":"Take ramp","off ramp":"Take exit",fork:"Keep "+mod};return(words[t]||"Continue")+(s.name?" onto "+s.name:"")}
function choose(i){chosen=i;renderRoutes();let r=routes[i];if(line)map.removeLayer(line);line=L.geoJSON(r.geometry,{style:{color:"#4285f4",weight:6}}).addTo(map);marker(start.lat,start.lon,"#34a853","A");marker(dest.lat,dest.lon,"#4285f4","B");map.fitBounds(line.getBounds(),{padding:[40,40]});$("distance").textContent=dist(r.distance);$("duration").textContent=mins(r.duration);$("steps").innerHTML="";r.legs.flatMap(l=>l.steps).forEach((s,n)=>{let li=document.createElement("li");li.textContent=instruction(s)+" · "+dist(s.distance);$("steps").append(li)})}
$("find").onclick=findRoutes;
function locate(){return new Promise((ok,no)=>navigator.geolocation?navigator.geolocation.getCurrentPosition(p=>ok({lat:p.coords.latitude,lon:p.coords.longitude,name:"My location"}),e=>no(Error(e.code===1?"Location permission denied":"Location unavailable")),{enableHighAccuracy:true,timeout:12000}):no(Error("Geolocation unsupported")))}
$("locate").onclick=async()=>{try{start=await locate();$("from").value=start.name;marker(start.lat,start.lon,"#34a853","A");map.setView([start.lat,start.lon],15);sayStatus("Current location set.")}catch(e){sayStatus(e.message)}};
function speak(t){if(!window.speechSynthesis){sayStatus("Speech synthesis unsupported.");return}speechSynthesis.cancel();let u=new SpeechSynthesisUtterance(t);u.lang=$("lang").value==="ms"?"ms-MY":"en-MY";speechSynthesis.speak(u)}
$("read").onclick=()=>speak([...$("steps").children].map(x=>x.textContent).join(". "));
function stop(){if(watch!==null)navigator.geolocation.clearWatch(watch);watch=null;$("navstatus").textContent="Navigation stopped.";if(window.speechSynthesis)speechSynthesis.cancel()}
$("stop").onclick=stop;
$("start").onclick=()=>{if(!routes.length)return;stop();stepNo=0;$("navstatus").textContent="GPS navigation active. Keep this page open.";let steps=routes[chosen].legs.flatMap(l=>l.steps);function announce(){if(stepNo<steps.length){let text=instruction(steps[stepNo]);$("navstatus").textContent="Next: "+text;if($("voice").checked)speak(text);stepNo++}}announce();watch=navigator.geolocation.watchPosition(p=>{let ll=[p.coords.latitude,p.coords.longitude];if(window.userDot)map.removeLayer(window.userDot);window.userDot=L.circleMarker(ll,{radius:8,color:"white",weight:3,fillColor:"#34a853",fillOpacity:1}).addTo(map);if(stepNo<steps.length){let loc=steps[stepNo].maneuver.location,meters=map.distance(ll,[loc[1],loc[0]]);if(meters<85)announce()}},e=>$("navstatus").textContent="GPS signal unavailable.",{enableHighAccuracy:true,maximumAge:2000,timeout:15000})};
const tags={fuel:'["amenity"="fuel"]',hospital:'["amenity"="hospital"]',parking:'["amenity"="parking"]'};
document.querySelectorAll("[data-near]").forEach(b=>b.onclick=()=>{nearType=b.dataset.near;document.querySelectorAll("[data-near]").forEach(x=>x.classList.toggle("selected",x===b))});
$("nearby").onclick=async()=>{let box=$("nearbyResults");box.textContent="Searching OpenStreetMap…";try{let q=`[out:json][timeout:20];(node${tags[nearType]}(around:5000,${start.lat},${start.lon});way${tags[nearType]}(around:5000,${start.lat},${start.lon}););out center tags 20;`,r=await fetch("https://overpass-api.de/api/interpreter",{method:"POST",body:q}),d=await r.json();if(nearLayer)map.removeLayer(nearLayer);nearLayer=L.layerGroup().addTo(map);box.innerHTML="";d.elements.slice(0,15).forEach(e=>{let lat=e.lat??e.center?.lat,lon=e.lon??e.center?.lon;if(!lat)return;let name=e.tags?.name||nearType;L.circleMarker([lat,lon],{radius:6,color:"white",fillColor:"#8755c7",fillOpacity:1}).addTo(nearLayer).bindPopup(safe(name));let p=document.createElement("p");p.textContent=name+" ";let b=document.createElement("button");b.textContent="Show";b.onclick=()=>map.setView([lat,lon],17);p.append(b);box.append(p)});if(!box.children.length)box.textContent="No mapped places found."}catch(e){box.textContent="Nearby service unavailable; try again later."}};
function reports(){try{return JSON.parse(localStorage.getItem("navmateReports")||"[]")}catch{return[]}}
function renderAlerts(){let box=$("alerts");box.innerHTML="";if(alertLayer)map.removeLayer(alertLayer);alertLayer=L.layerGroup().addTo(map);let list=reports().filter(r=>filter==="flood"?r.type==="flood":r.type!=="flood");list.forEach(r=>{marker(r.lat,r.lon,"#ea4335","!").bindPopup(safe(r.type)+": "+safe(r.description));let p=document.createElement("p");p.className="alert";p.textContent=r.type.toUpperCase()+": "+r.description+" · "+new Date(r.time).toLocaleString();box.append(p)});if(!list.length)box.textContent="No local reports yet."}
document.querySelectorAll("[data-filter]").forEach(b=>b.onclick=()=>{filter=b.dataset.filter;renderAlerts()});
$("report").onclick=()=>$("dialog").showModal();$("close").onclick=()=>$("dialog").close();
$("reportForm").onsubmit=async e=>{e.preventDefault();let f=$("photo").files[0];if(f&&f.size>1500000){alert("Choose a photo under 1.5 MB");return}let photo=null;if(f)photo=await new Promise(ok=>{let r=new FileReader();r.onload=()=>ok(r.result);r.readAsDataURL(f)});let all=reports();all.unshift({type:$("kind").value,description:$("description").value,lat:map.getCenter().lat,lon:map.getCenter().lng,time:new Date().toISOString(),photo});try{localStorage.setItem("navmateReports",JSON.stringify(all.slice(0,40)));$("dialog").close();$("reportForm").reset();renderAlerts()}catch{alert("Browser storage is full. Try without a photo.")}};
$("contrast").onclick=()=>{const on=document.body.classList.toggle("contrast");$("contrast").setAttribute("aria-pressed",String(on));};
$("larger").onclick=()=>{const on=document.body.classList.toggle("large");$("larger").setAttribute("aria-pressed",String(on));};
(function settingsMenu(){
 const toggle=$("settingsToggle"),panel=$("settingsPanel"),close=$("settingsClose");
 function setOpen(open){panel.hidden=!open;toggle.setAttribute("aria-expanded",String(open));toggle.setAttribute("aria-label",open?"Close settings":"Open settings");if(open)close.focus();else toggle.focus();}
 toggle.addEventListener("click",()=>setOpen(panel.hidden));
 close.addEventListener("click",()=>setOpen(false));
 document.addEventListener("click",e=>{if(!panel.hidden&&!panel.contains(e.target)&&!toggle.contains(e.target)){panel.hidden=true;toggle.setAttribute("aria-expanded","false");toggle.setAttribute("aria-label","Open settings");}});
 document.addEventListener("keydown",e=>{if(e.key==="Escape"&&!panel.hidden)setOpen(false);});
})();$("recenter").onclick=()=>map.setView([start.lat,start.lon],15);
renderAlerts();marker(start.lat,start.lon,"#34a853","A");


// Saved places and recent search history (local to this browser)
function readStore(key){try{return JSON.parse(localStorage.getItem(key)||"[]")}catch{return[]}}
function writeStore(key,value){try{localStorage.setItem(key,JSON.stringify(value));return true}catch{return false}}
function recordHistory(place){let a=readStore("navmateHistory").filter(x=>x.name!==place.name);a.unshift(place);writeStore("navmateHistory",a.slice(0,10));renderHistory()}
function renderHistory(){let box=$("historyList");if(!box)return;box.innerHTML="";let a=readStore("navmateHistory");if(!a.length){box.textContent="No recent searches yet.";return}a.forEach(p=>{let row=document.createElement("div");row.className="history-item";let name=document.createElement("span");name.textContent=p.name;let b=document.createElement("button");b.textContent="Use";b.onclick=()=>{dest=p;$("to").value=p.name;map.setView([p.lat,p.lon],14)};row.append(name,b);box.append(row)})}
function renderSaved(){let box=$("savedList");if(!box)return;box.innerHTML="";let a=readStore("navmateSaved");if(!a.length){box.textContent="No saved places yet.";return}a.forEach((p,i)=>{let row=document.createElement("div");row.className="saved-item";let name=document.createElement("span");name.textContent=p.name;let use=document.createElement("button");use.textContent="Set destination";use.onclick=()=>{dest=p;$("to").value=p.name;map.setView([p.lat,p.lon],14)};let del=document.createElement("button");del.textContent="×";del.setAttribute("aria-label","Remove "+p.name);del.onclick=()=>{let next=readStore("navmateSaved");next.splice(i,1);writeStore("navmateSaved",next);renderSaved()};row.append(name,use,del);box.append(row)})}
function savePlace(place){if(!place){sayStatus("Choose a place first.");return}let a=readStore("navmateSaved").filter(x=>x.name!==place.name);a.unshift(place);if(writeStore("navmateSaved",a.slice(0,20))){renderSaved();sayStatus("Place saved on this device.")}else sayStatus("Could not save place in browser storage.")}
$("saveDestination").onclick=()=>savePlace(dest);
$("saveStart").onclick=()=>savePlace(start);
$("clearHistory").onclick=()=>{writeStore("navmateHistory",[]);renderHistory()};
renderSaved();renderHistory();

// Toll cost planning estimate: deliberately indicative, not a live plaza-by-plaza quote.
function updateToll(){let r=routes[chosen];if(!r){$("tollEstimate").textContent="Set a route to estimate.";return}let km=r.distance/1000,vehicle=$("vehicleClass").value;if(vehicle==="motorcycle"){$("tollEstimate").textContent="Indicative estimate: RM0.00 (many Malaysian expressways exempt motorcycles; check your route).";return}let rates={"1":{low:.08,high:.18},"2":{low:.14,high:.28},"3":{low:.20,high:.40}}[vehicle];let lo=km*rates.low,hi=km*rates.high;$("tollEstimate").textContent=`Very rough planning range: RM${lo.toFixed(2)}–RM${hi.toFixed(2)} for ${km.toFixed(1)} km. This is not an actual toll calculation.`}
$("estimateToll").onclick=updateToll;$("vehicleClass").onchange=updateToll;
const originalChoose=choose;
choose=function(i){originalChoose(i);updateToll()};

// Dark mode preference
let darkSaved=localStorage.getItem("navmateDark")==="true";
if(darkSaved){document.body.classList.add("dark");$("darkMode").setAttribute("aria-pressed","true")}
$("darkMode").onclick=()=>{let on=document.body.classList.toggle("dark");$("darkMode").setAttribute("aria-pressed",String(on));localStorage.setItem("navmateDark",String(on))};

// Local AI-style travel helper. This is an offline demo, not a connected generative AI service.
function assistantReply(q){let s=q.toLowerCase(),r=routes[chosen];if(/route|journey|trip|destination|how long|duration|distance/.test(s)){if(r)return `Your selected route is about ${dist(r.distance)} and ${mins(r.duration)} (OSRM estimate; no live traffic). ${dest?"Destination: "+dest.name+". ":""}Allow extra time for congestion, weather and stops.`;return "Enter a Malaysian starting point and destination, then select Find routes. I can then summarize the estimated distance and duration."}
if(/toll|highway|touch.?n.?go/.test(s))return "Use the Toll Cost Estimator panel for a broad distance-based planning range. It is not a verified toll quote; actual charges depend on highway entry/exit and vehicle class. Check the relevant highway operator before travelling.";
if(/flood|banjir|rain|hujan|weather/.test(s))return "Check official Malaysian weather and flood advisories before departure. Community reports in this prototype are local to this browser and are not verified or real-time official alerts. Never drive through floodwater.";
if(/petrol|fuel|hospital|parking|nearby/.test(s))return "Choose Petrol, Hospitals or Parking in Nearby Places and search around your starting point. OpenStreetMap coverage may be incomplete or outdated.";
if(/save|bookmark/.test(s))return "After selecting a place, use Save destination or Save start. Saved places remain in this browser on this device.";
if(/safe|safety|prepare|checklist/.test(s))return "Before leaving: check official weather and traffic updates, fuel, tyres, brakes, phone battery and route closures. Set navigation before moving, use a phone mount, and never handle the phone while driving.";
return "I can help with route summaries, toll-estimate explanations, nearby services, saved places and road-safety tips. This demo uses local rules and does not send your question to an AI model."}
function askAssistant(){let q=$("assistantInput").value.trim();if(!q)return;let log=$("assistantLog");log.textContent="You: "+q+"\n\nNavMate: "+assistantReply(q);$("assistantInput").value=""}
$("askAssistant").onclick=askAssistant;$("assistantInput").addEventListener("keydown",e=>{if(e.key==="Enter")askAssistant()});

// Keep Leaflet tiles and controls correctly sized after responsive layout changes.
(function responsiveMapSizing(){
  const refreshMapSize=()=>{ if(typeof map!=='undefined' && map && map.invalidateSize){ map.invalidateSize({pan:false,animate:false}); } };
  window.addEventListener('resize',()=>window.requestAnimationFrame(refreshMapSize),{passive:true});
  window.addEventListener('orientationchange',()=>window.setTimeout(refreshMapSize,250),{passive:true});
  if(typeof ResizeObserver!=='undefined'){
    const mapBox=document.querySelector('.mapbox');
    if(mapBox){ const observer=new ResizeObserver(()=>window.requestAnimationFrame(refreshMapSize)); observer.observe(mapBox); }
  }
  window.addEventListener('load',()=>window.setTimeout(refreshMapSize,150),{once:true});
})();
