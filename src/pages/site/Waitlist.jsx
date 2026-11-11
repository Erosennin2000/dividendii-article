import React from 'react'
import RequestForm from '../../components/RequestForm.jsx'

export default function Waitlist() {
  return (
    <section className="block alt" id="waitlist">
      <div className="wrap wl">
        <div className="sechead"><h2>Be first in when investing opens</h2><p>Recovery is open now. Investing is coming next. Leave your details and we will message you on WhatsApp the day it opens.</p></div>
        <RequestForm kind="invest" id="wl" />
      </div>
    </section>
  )
}
