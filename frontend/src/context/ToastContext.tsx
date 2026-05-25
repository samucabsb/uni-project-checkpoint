import {createContext,useContext,useState,ReactNode} from 'react';
type Toast={id:number;type:'success'|'error'|'info';message:string};
const C=createContext({toast:(message:string,type?:Toast['type'])=>{}});
export function ToastProvider({children}:{children:ReactNode}){const[toasts,setToasts]=useState<Toast[]>([]);function toast(message:string,type:Toast['type']='success'){const id=Date.now();setToasts(t=>[...t,{id,type,message}]);setTimeout(()=>setToasts(t=>t.filter(x=>x.id!==id)),3200)}return <C.Provider value={{toast}}>{children}<div className="fixed right-5 top-5 z-[99] space-y-3">{toasts.map(t=><div key={t.id} className={`rounded-2xl px-5 py-4 shadow-xl ${t.type==='error'?'bg-red-500 text-white':t.type==='info'?'bg-zinc-800 text-white':'bg-checkpoint-green text-black'}`}><b>{t.message}</b></div>)}</div></C.Provider>}
export const useToast=()=>useContext(C);
