import { useEffect } from 'react'
import emailjs from '@emailjs/browser'

export default function Payment({ user, amount, onSuccess }) {
  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://js.paystack.co/v1/inline.js'
    document.body.appendChild(script)
    emailjs.init('2Vwih-znnjiAtOzfE')
  }, [])

  const handlePayment = () => {
    if (!window.PaystackPop) { alert('loading...'); return }
    const handler = window.PaystackPop.setup({
     key: 'pk_test_ab2fdb023669bc15f973060ca82260b36710f813',
      email: user.email,
      amount: amount * 100,
      currency: 'GHS',
      callback: function(response) {
        emailjs.send('service_sqt2u4a', 'template_whziktn', {
          email: user.email,
          order_id: response.reference,
        })
        onSuccess(response)
      },
      onClose: function() {
        alert('Payment cancelled')
      }
    })
    handler.openIframe()
  }

  return (
    <button onClick={handlePayment}
      style={{padding:'10px 20px', background:'#e16a34e',
      color:'white', border:'none', borderRadius:8, cursor:'pointer'}}>
      Pay GHS {amount}
    </button>
  )
}