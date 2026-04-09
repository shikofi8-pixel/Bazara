import { useState } from 'react'
import { supabase } from './supabaseClient'

export default function Register({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [message, setMessage] = useState('')

  const handleRegister = async () => {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) { setMessage(error.message); return }
    await supabase.from('sellers').insert({ id: data.user.id, email, name })
    setMessage('Registered! Please log in.')
  }

  return (
    <div style={{maxWidth:'400px',margin:'100px auto',padding:'20px'}}>
      <h2>Seller Registration</h2>
      <input placeholder="Full Name" value={name}
        onChange={e => setName(e.target.value)}
        style={{width:'100%',padding:'10px',marginBottom:'10px'}}/>
      <input placeholder="Email" value={email}
        onChange={e => setEmail(e.target.value)}
        style={{width:'100%',padding:'10px',marginBottom:'10px'}}/>
      <input placeholder="Password" type="password" value={password}
        onChange={e => setPassword(e.target.value)}
        style={{width:'100%',padding:'10px',marginBottom:'10px'}}/>
      <button onClick={handleRegister}
        style={{width:'100%',padding:'10px',background:'#f59e0b',color:'white',border:'none',borderRadius:'5px'}}>
        Register
      </button>
      <p onClick={onLogin} style={{cursor:'pointer',color:'blue',marginTop:'10px'}}>
        Already have an account? Login
      </p>
      {message && <p>{message}</p>}