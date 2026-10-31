const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8787";
export function getToken(){ return localStorage.getItem("24adz_token") || ""; }
export function setToken(token){ localStorage.setItem("24adz_token",token); }
export function clearToken(){ localStorage.removeItem("24adz_token"); }
export async function api(path, options={}) {
  const headers = { ...(options.body instanceof FormData ? {} : {"Content-Type":"application/json"}), ...(options.headers||{}) };
  const token=getToken(); if(token) headers.Authorization=`Bearer ${token}`;
  const res=await fetch(`${API_BASE}${path}`,{...options,headers});
  const data=await res.json().catch(()=>({}));
  if(!res.ok || data.ok===false) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}
export async function uploadImage(file){
  const form=new FormData(); form.append("file",file);
  return api("/api/uploads",{method:"POST",body:form});
}
