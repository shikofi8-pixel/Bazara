import { useState } from 'react'
import { supabase } from './supabaseClient'

export default function AddProduct({ user }) {
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')
  const [image, setImage] = useState(null)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    setLoading(true)
    let image_url = ''

    if (image) {
      const fileExt = image.name.split('.').pop()
      const fileName = ${user.id}-${Date.now()}.${fileExt}
      const { error: uploadError } = await supabase.storage
        .from('product - images')
        .upload(fileName, image)
      if (uploadError) {
        setMessage('Image upload failed: ' + uploadError.message)
        setLoading(false)
        return
      }
      const { data } = supabase.storage
        .from('product - images')
        .getPublicUrl(fileName)
      image_url = data.publicUrl
    }

    const { error } = await supabase.from('products').insert({
      seller_id: user.id,
      name,
      price: parseFloat(price),
      category,
      description,
      image: image_url
    })

    if (error) {
      setMessage('Error: ' + error.message)
    } else {
      setMessage('Product added successfully!')
      setName('')
      setPrice('')
      setCategory('')
      setDescription('')
      setImage(null)
    }
    setLoading(false)
  }

  return (
    <div style={{maxWidth:'500px',margin:'30px auto',padding:'20px'}}>
      <h2>Add New Product</h2>
      <input placeholder="Product Name" value={name}
        onChange={e => setName(e.target.value)}
        style={{width:'100%',padding:'10px',marginBottom:'10px'}}/>
      <input placeholder="Price (GHS)" value={price}
        onChange={e => setPrice(e.target.value)}
        style={{width:'100%',padding:'10px',marginBottom:'10px'}}/>
      <input placeholder="Category" value={category}
        onChange={e => setCategory(e.target.value)}
        style={{width:'100%',padding:'10px',marginBottom:'10px'}}/>
      <textarea placeholder="Description" value={description}
        onChange={e => setDescription(e.target.value)}
        style={{width:'100%',padding:'10px',marginBottom:'10px',height:'80px'}}/>
      <input type="file" accept="image/*"
        onChange={e => setImage(e.target.files[0])}
        style={{width:'100%',marginBottom:'10px'}}/>
      <button onClick={handleSubmit} disabled={loading}
        style={{width:'100%',padding:'10px',background:'#f59e0b',color:'white',border:'none',borderRadius:'5px',cursor:'pointer'}}>
        {loading ? 'Adding...' : 'Add Product'}
      </button>
      {message && <p style={{marginTop:'10px',color:'green'}}>{message}</p>}
    </div>
  )
}