import { useState } from 'react'
import { supabase } from './supabaseClient'

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')

  const handleLogin = async () => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setMessage(error.message); return }
    onLogin(data.user)
  }

  return (
    <div style={{maxWidth:'400px',margin:'100px auto',padding:'20px'}}>
      <h2>Seller Login</h2>
      <input placeholder="Email" value={email}
        onChange={e => setEmail(e.target.value)}
        style={{width:'100%',padding:'10px',marginBottom:'10px'}}/>
      <input placeholder="Password" type="password" value={password}
        onChange={e => setPassword(e.target.value)}
        style={{width:'100%',padding:'10px',marginBottom:'10px'}}/>
      <button onClick={handleLogin}
        style={{width:'100%',padding:'10px',background:'#f59e0b',color:'white',border:'none',borderRadius:'5px'}}>
        Login
      </button>
      {message && <p>{message}</p>}
    </div>
  )
}