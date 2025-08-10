'use client';
import { getAuth, onIdTokenChanged, User } from 'firebase/auth';
import { useEffect, useState } from 'react';
type Claims={isAdmin?:boolean}; export function useAuthClaims(){
  const [u,setU]=useState<User|null>(null); const [c,setC]=useState<Claims>({}); const [l,setL]=useState(true);
  useEffect(()=>onIdTokenChanged(getAuth(), async (user)=>{
    if(!user){setU(null);setC({});setL(false);return;}
    const t=await user.getIdTokenResult(true); setU(user); setC(t.claims as Claims); setL(false);
  }),[]);
  return {user:u,claims:c,loading:l};
}