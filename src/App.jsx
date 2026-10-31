import React,{useEffect,useMemo,useState} from "react";
import {api,getToken,setToken,clearToken,uploadImage} from "./api";

const MAIN_CATEGORIES=[
  {name:"Cars",icon:"🚗",desc:"Cars for sale"},
  {name:"Bikes",icon:"🏍️",desc:"Bikes for sale"},
  {name:"House",icon:"🏠",desc:"Rent and sale"},
  {name:"Mobiles",icon:"📱",desc:"Phones and devices"},
  {name:"Jobs",icon:"💼",desc:"Jobs and careers"},
  {name:"House Movers",icon:"🚚",desc:"Moving services"}
];
const DEMO=[
 {id:"demo1",category:"Cars",title:"Used Hatchback Car",price:450000,district:"Coimbatore",area:"Gandhipuram",description:"Sample listing for layout testing. Not a real seller offer.",vip:true,demo:true},
 {id:"demo2",category:"House",title:"2 BHK House for Rent",price:12000,district:"Chennai",area:"Tambaram",description:"Sample house listing for demonstration only.",vip:true,demo:true},
 {id:"demo3",category:"House Movers",title:"Local House Moving Service",price:2500,district:"Erode",area:"Erode",description:"Sample house-moving service listing.",vip:true,demo:true},
 {id:"demo4",category:"Mobiles",title:"Smartphone – Sample",price:15000,district:"Tiruppur",area:"Avinashi Road",description:"Sample mobile listing for demonstration.",vip:true,demo:true},
 {id:"demo5",category:"Bikes",title:"Used Bike – Sample",price:65000,district:"Salem",area:"Salem",description:"Sample bike listing for demonstration.",vip:true,demo:true},
 ...Array.from({length:20},(_,i)=>({id:`demo${i+6}`,category:MAIN_CATEGORIES[i%6].name,title:`${MAIN_CATEGORIES[i%6].name} Demo Listing ${i+1}`,price:1000+(i*1250),district:"Tiruppur",area:"Tiruppur",description:"Sample listing only. This is not a real seller offer.",vip:false,demo:true}))
];
const money=n=>Number(n||0).toLocaleString("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0});
export default function App(){
 const [ads,setAds]=useState(DEMO),[categories,setCategories]=useState(MAIN_CATEGORIES),[districts,setDistricts]=useState([]),[filter,setFilter]=useState({q:"",category:"",district:""}),[vipIndex,setVipIndex]=useState(0),[status,setStatus]=useState("Connecting to 24Adz API…");
 const [user,setUser]=useState(null),[modal,setModal]=useState(""),[form,setForm]=useState({name:"",phone:"",password:""}),[otp,setOtp]=useState(""),[otpSent,setOtpSent]=useState(false),[activeChatId,setActiveChatId]=useState(""),[chatMessages,setChatMessages]=useState([]),[chatText,setChatText]=useState(""),[adForm,setAdForm]=useState({title:"",description:"",category_id:"",district_id:"",price:"",contact_name:"",contact_phone:"",whatsapp_enabled:true}),[image,setImage]=useState(null),[busy,setBusy]=useState(false),[notice,setNotice]=useState("");
 const [pending,setPending]=useState([]),[adminToken,setAdminToken]=useState("");
 const [detailAd,setDetailAd]=useState(null);
 const vipAds=useMemo(()=>ads.filter(a=>a.vip),[ads]);
 const visible=useMemo(()=>ads.filter(a=>(!filter.q||`${a.title} ${a.description}`.toLowerCase().includes(filter.q.toLowerCase()))&&(!filter.category||a.category===filter.category)&&(!filter.district||a.district===filter.district)),[ads,filter]);
 useEffect(()=>{const t=setInterval(()=>setVipIndex(i=>(i+1)%Math.max(vipAds.length,1)),2000);return()=>clearInterval(t)},[vipAds.length]);
 async function refresh(){
  try{
   const [a,c,d]=await Promise.all([api("/api/ads?limit=25"),api("/api/categories"),api("/api/districts")]);
   setAds([...a.ads,...DEMO]);setCategories(c.categories.length?c.categories:MAIN_CATEGORIES);setDistricts(d.districts);setStatus(`${a.ads.length} approved live ads + 25 sample demo ads.`);
  }catch(e){setAds(DEMO);setStatus("Demo mode: API not connected. 25 sample ads shown.");}
 }
 useEffect(()=>{refresh();if(getToken())api("/api/auth/me").then(x=>setUser(x.user)).catch(()=>clearToken())},[]);
 async function submitAuth(e){
  e.preventDefault();setBusy(true);setNotice("");
  try{
   if(modal==="register"){await api("/api/auth/register",{method:"POST",body:JSON.stringify(form)});setNotice("Registration complete. Send OTP to verify your mobile.");}
   else {const r=await api("/api/auth/login",{method:"POST",body:JSON.stringify({phone:form.phone,password:form.password})});setToken(r.token);setUser(r.user);setModal("");}
  }catch(e){setNotice(e.message)}finally{setBusy(false)}
 }
 async function submitAd(e){
  e.preventDefault();if(!user){setModal("login");return}setBusy(true);setNotice("");
  try{
   let image_key="";
   if(image){const uploaded=await uploadImage(image);image_key=uploaded.image_key}
   const r=await api("/api/ads",{method:"POST",body:JSON.stringify({...adForm,price:Number(adForm.price||0),image_key})});
   setNotice(r.message);setModal("");setAdForm({title:"",description:"",category_id:"",district_id:"",price:"",contact_name:user.name,contact_phone:user.phone,whatsapp_enabled:true});setImage(null);
  }catch(e){setNotice(e.message)}finally{setBusy(false)}
 }
 async function sendOtp(){
  setBusy(true);setNotice("");
  try{const r=await api("/api/auth/otp/send",{method:"POST",body:JSON.stringify({phone:form.phone})});setOtpSent(true);setNotice(r.message)}
  catch(e){setNotice(e.message)}finally{setBusy(false)}
 }
 async function verifyOtp(){
  setBusy(true);setNotice("");
  try{const r=await api("/api/auth/otp/verify",{method:"POST",body:JSON.stringify({phone:form.phone,otp})});setNotice(r.message+" You can now login.");setOtpSent(false);setOtp("")}
  catch(e){setNotice(e.message)}finally{setBusy(false)}
 }
 async function refreshChat(chatId=activeChatId){
  if(!chatId)return;
  try{const r=await api(`/api/chats/${chatId}/messages`);setChatMessages(r.messages)}
  catch(e){setNotice(e.message)}
 }
 async function sendChatMessage(e){
  e.preventDefault();if(!chatText.trim()||!activeChatId)return;
  try{await api(`/api/chats/${activeChatId}/messages`,{method:"POST",body:JSON.stringify({body:chatText})});setChatText("");await refreshChat()}
  catch(e){setNotice(e.message)}
 }
 async function openChat(ad){
  if(!user){setModal("login");return}
  if(ad.demo){setNotice("Demo ads do not have a real seller. Chat is available on real approved ads.");return}
  try{const r=await api("/api/chats",{method:"POST",body:JSON.stringify({ad_id:ad.id})});setActiveChatId(r.chat_id);setModal("chat");const m=await api(`/api/chats/${r.chat_id}/messages`);setChatMessages(m.messages)}
  catch(e){setNotice(e.message)}
 }
 async function adminLogin(e){
  e.preventDefault();setBusy(true);
  try{const r=await api("/api/admin/login",{method:"POST",body:JSON.stringify({username:form.name,password:form.password})});setToken(r.token);setUser(r.user);setModal("");await loadPending()}
  catch(e){setNotice(e.message)}finally{setBusy(false)}
 }
 async function loadPending(){
  try{const r=await api("/api/admin/ads?status=pending");setPending(r.ads)}catch(e){setNotice(e.message)}
 }
 async function moderateAd(id,action){
  try{await api(`/api/admin/ads/${id}/${action}`,{method:"POST",body:JSON.stringify({})});await loadPending();await refresh()}catch(e){setNotice(e.message)}
 }
 return <div className="app">
  <header className="top"><div className="brand">24<span>Adz</span>.com<small>TAMIL NADU CLASSIFIEDS</small></div><nav>{user?<><span className="user">{user.name}</span><button onClick={()=>{clearToken();setUser(null)}}>Logout</button></>:<><button onClick={()=>{setModal("register");setNotice("")}}>Register</button><button onClick={()=>{setModal("login");setNotice("")}}>Login</button><button onClick={()=>{setModal("admin");setNotice("")}}>Admin</button></>}<button className="orange" onClick={()=>user?setModal("post"):setModal("login")}>＋ Post Ad Free</button></nav></header>
  <main>
   <section className="hero"><div className="adspace"><small>ADVERTISEMENT SPACE</small><h2>PROMOTE YOUR BUSINESS</h2><p>Reach customers across Tamil Nadu</p></div><h1>24ADZ.COM</h1><button className="orange postbig" onClick={()=>user?setModal("post"):setModal("login")}>＋ Post Ad Free</button><p>24Adz.com · Tamil Nadu Classifieds</p><div className="stats"><div><b>38</b><br/>Tamil Nadu Districts</div><div><b>6</b><br/>Main Categories</div><div><b>24/7</b><br/>Browse Listings</div></div></section>
   <section className="vip"><div className="viphead"><b>⭐ VIP SPOTLIGHT</b><span>{vipAds.length?`${vipIndex%vipAds.length+1} / ${vipAds.length}`:"Featured Ads"}</span></div>{vipAds.length?<div className="vipitem" onClick={()=>setDetailAd(vipAds[vipIndex%vipAds.length])} style={{cursor:"pointer"}}><div className="vipphoto">{vipAds[vipIndex%vipAds.length].image_url?<img src={vipAds[vipIndex%vipAds.length].image_url}/>:<strong>{MAIN_CATEGORIES.find(x=>x.name===vipAds[vipIndex%vipAds.length].category)?.icon||"📦"}</strong>}</div><h2>{vipAds[vipIndex%vipAds.length].title}</h2><h3>{money(vipAds[vipIndex%vipAds.length].price)}</h3><p>{vipAds[vipIndex%vipAds.length].area} {vipAds[vipIndex%vipAds.length].district}</p><small>{vipAds[vipIndex%vipAds.length].demo?"DEMO SAMPLE ONLY":"FEATURED AD"}</small><p><button className="orange" type="button" onClick={e=>{e.stopPropagation();setDetailAd(vipAds[vipIndex%vipAds.length])}}>👁 View Full Ad</button></p></div>:<p className="empty">VIP advertisements will appear here.</p>}</section>
   <section><h2>Explore <em>Categories</em></h2><div className="categories">{MAIN_CATEGORIES.map(c=><button key={c.name} onClick={()=>setFilter(f=>({...f,category:c.name}))}><strong>{c.icon}</strong><b>{c.name}</b><small>{c.desc}</small></button>)}</div></section>
   <section><h2>Search <em>Listings</em></h2><div className="filters"><input placeholder="Search ads…" value={filter.q} onChange={e=>setFilter(f=>({...f,q:e.target.value}))}/><select value={filter.category} onChange={e=>setFilter(f=>({...f,category:e.target.value}))}><option value="">All Categories</option>{MAIN_CATEGORIES.map(c=><option key={c.name}>{c.name}</option>)}</select><select value={filter.district} onChange={e=>setFilter(f=>({...f,district:e.target.value}))}><option value="">All Districts</option>{districts.map(d=><option key={d.id} value={d.name}>{d.name}</option>)}</select><button onClick={()=>setFilter({q:"",category:"",district:""})}>Reset</button></div></section>
   <section><h2>Latest <em>Ads</em></h2><p className="muted">{status}</p><div className="grid">{visible.map(ad=><article className="card" key={ad.id}><div className="photo">{ad.image_url?<img src={ad.image_url}/>:<strong>{MAIN_CATEGORIES.find(x=>x.name===ad.category)?.icon||"📦"}</strong>}{ad.vip&&<label>⭐ VIP</label>}{ad.demo&&<label className="demo">DEMO</label>}</div><div className="cardbody"><small>{ad.category}</small><h3>{ad.title}</h3><b className="price">{money(ad.price)}</b><p>📍 {ad.area} {ad.district}</p><p>{ad.description}</p><div className="actions"><button onClick={()=>setDetailAd(ad)}>👁 View Full Ad</button>{ad.demo?<><button disabled>📞 Call</button><button disabled>WhatsApp</button></>:<><a href={`tel:${ad.contact_phone}`}>📞 Call</a>{ad.whatsapp_enabled&&<a target="_blank" rel="noreferrer" href={`https://wa.me/${String(ad.contact_phone).replace(/\D/g,"").replace(/^([6-9])/,"91$1")}`}>WhatsApp</a>}</>}<button onClick={()=>openChat(ad)}>💬 Chat</button></div></div></article>)}</div></section>
   {user?.role==="admin"&&<section className="admin"><h2>Admin · Pending Ads</h2><button onClick={loadPending}>Refresh Queue</button>{pending.map(a=><div className="pending" key={a.id}><b>{a.title}</b><span>{a.category} · {a.district}</span><button onClick={()=>moderateAd(a.id,"approve")}>Approve</button><button onClick={()=>moderateAd(a.id,"reject")}>Reject</button></div>)}</section>}
   <section className="scam"><b>⚠ SCAM ALERT:</b> Never share OTPs or banking passwords. Verify the buyer or seller before making payments. 24Adz.com is a listing platform and is not a party to transactions between users.</section>
  </main>
  <footer>© {new Date().getFullYear()} 24Adz.com · Tamil Nadu Classifieds</footer>
  {detailAd&&<div className="overlay" onClick={()=>setDetailAd(null)}>
   <div className="modal" onClick={e=>e.stopPropagation()}>
    <button className="x" onClick={()=>setDetailAd(null)}>×</button>
    <h2>{detailAd.title}</h2>
    {detailAd.image_url?<img src={detailAd.image_url} alt={detailAd.title} style={{width:"100%",maxHeight:"320px",objectFit:"contain",borderRadius:"12px",background:"#222"}}/>:<div className="photo" style={{borderRadius:"12px",marginBottom:"12px"}}><strong>{MAIN_CATEGORIES.find(x=>x.name===detailAd.category)?.icon||"📦"}</strong></div>}
    <h2 className="price">{money(detailAd.price)}</h2>
    <p><b>Category:</b> {detailAd.category||"—"}</p>
    <p><b>District:</b> {detailAd.district||"—"}</p>
    <p><b>Area:</b> {detailAd.area||"—"}</p>
    <h3>Description</h3><p style={{whiteSpace:"pre-wrap"}}>{detailAd.description||"No description provided."}</p>
    {detailAd.demo?<p className="muted">Demo sample only. No real seller contact is available.</p>:<>
     {detailAd.contact_name&&<p><b>Seller:</b> {detailAd.contact_name}</p>}
     {detailAd.contact_phone&&<p><b>Mobile:</b> {detailAd.contact_phone}</p>}
     <div className="actions">
      {detailAd.contact_phone&&<a href={`tel:${detailAd.contact_phone}`}>📞 Call Seller</a>}
      {detailAd.whatsapp_enabled&&detailAd.contact_phone&&<a target="_blank" rel="noreferrer" href={`https://wa.me/${String(detailAd.contact_phone).replace(/\D/g,"").replace(/^([6-9])/,"91$1")}`}>WhatsApp</a>}
     </div>
    </>}
    <button className="orange" style={{marginTop:"16px",width:"100%"}} onClick={()=>setDetailAd(null)}>Close</button>
   </div>
  </div>}
  {notice&&<div className="toast" onClick={()=>setNotice("")}>{notice} ×</div>}
  {modal&&<div className="overlay" onClick={()=>setModal("")}><div className="modal" onClick={e=>e.stopPropagation()}><button className="x" onClick={()=>setModal("")}>×</button>
   {["login","register"].includes(modal)&&<><h2>{modal==="login"?"Customer Login":"Create Account"}</h2><form onSubmit={submitAuth}>{modal==="register"&&<input placeholder="Your name" required value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/>}<input placeholder="10-digit mobile number" required value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/><input type="password" placeholder="Password (8+ characters)" required value={form.password} onChange={e=>setForm({...form,password:e.target.value})}/><button className="orange" disabled={busy}>{busy?"Please wait…":modal==="login"?"Login":"Register"}</button></form>{modal==="register"&&<div className="otpbox"><button type="button" onClick={sendOtp} disabled={busy}>Send Mobile OTP</button>{otpSent&&<><input placeholder="6-digit OTP" value={otp} onChange={e=>setOtp(e.target.value)} maxLength="6"/><button type="button" onClick={verifyOtp} disabled={busy}>Verify OTP</button></>}</div>}<p className="muted">Mobile OTP verification is required before posting an ad. MSG91 credentials must be configured in Worker secrets.</p></>}
   {modal==="post"&&<><h2>Post an Ad</h2><form onSubmit={submitAd}><input placeholder="Ad title" required value={adForm.title} onChange={e=>setAdForm({...adForm,title:e.target.value})}/><textarea placeholder="Description" required value={adForm.description} onChange={e=>setAdForm({...adForm,description:e.target.value})}/><select required value={adForm.category_id} onChange={e=>setAdForm({...adForm,category_id:e.target.value})}><option value="">Category</option>{categories.map(c=><option value={c.id} key={c.id}>{c.name}</option>)}</select><select required value={adForm.district_id} onChange={e=>setAdForm({...adForm,district_id:e.target.value})}><option value="">District</option>{districts.map(d=><option value={d.id} key={d.id}>{d.name}</option>)}</select><input type="number" min="0" placeholder="Price" value={adForm.price} onChange={e=>setAdForm({...adForm,price:e.target.value})}/><input placeholder="Contact name" required value={adForm.contact_name} onChange={e=>setAdForm({...adForm,contact_name:e.target.value})}/><input placeholder="Contact mobile" required value={adForm.contact_phone} onChange={e=>setAdForm({...adForm,contact_phone:e.target.value})}/><label>Ad image <input type="file" accept="image/png,image/jpeg,image/webp" onChange={e=>setImage(e.target.files?.[0]||null)}/></label><label><input type="checkbox" checked={adForm.whatsapp_enabled} onChange={e=>setAdForm({...adForm,whatsapp_enabled:e.target.checked})}/> Enable WhatsApp contact</label><button className="orange" disabled={busy}>{busy?"Submitting…":"Submit for Admin Approval"}</button></form></>}
   {modal==="admin"&&<><h2>Admin Login</h2><form onSubmit={adminLogin}><input placeholder="Admin username" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/><input type="password" placeholder="Admin password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})}/><button className="orange">Login</button></form></>}
   {modal==="chat"&&<><h2>24Adz Private Chat</h2><div className="chatbox">{chatMessages.map(m=><div className="chatline" key={m.id}><b>{m.sender_name}</b><p>{m.body}</p><small>{m.created_at}</small></div>)}</div><form onSubmit={sendChatMessage}><input placeholder="Type your message…" value={chatText} onChange={e=>setChatText(e.target.value)}/><button className="orange">Send</button></form><button onClick={()=>refreshChat()}>Refresh Messages</button></>}
   {notice&&<p>{notice}</p>}
  </div></div>}
 </div>
}
