import React from 'react'

const P = ({ size = 20, children, stroke = 1.8, ...rest }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" {...rest}>{children}</svg>
)
export const Eye = (p) => <P {...p}><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></P>
export const EyeOff = (p) => <P {...p}><path d="M3 3l18 18" /><path d="M10.6 5.1A10 10 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-3.2 4.1M6.6 6.6A16.6 16.6 0 0 0 2 12s3.6 7 10 7a9.7 9.7 0 0 0 4.4-1" /><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" /></P>
export const ArrowRight = (p) => <P {...p}><path d="M5 12h14M13 6l6 6-6 6" /></P>
export const ArrowLeft = (p) => <P {...p}><path d="M19 12H5M11 6l-6 6 6 6" /></P>
export const Chevron = (p) => <P {...p}><path d="m9 6 6 6-6 6" /></P>
export const Check = (p) => <P {...p}><path d="m5 12.5 4.5 4.5L19 7.5" /></P>
export const Plus = (p) => <P {...p}><path d="M12 5v14M5 12h14" /></P>
export const Chart = (p) => <P {...p}><path d="M4 19V5M4 19h16" /><path d="m8 15 3-4 3 2 4-6" /></P>
export const Pie = (p) => <P {...p}><path d="M12 3v9h9" /><path d="M20.5 15A9 9 0 1 1 9 3.5" /></P>
export const Bond = (p) => <P {...p}><rect x="4" y="5" width="16" height="14" rx="2" /><path d="M8 10h8M8 14h5" /></P>
export const Flag = (p) => <P {...p}><path d="M5 21V4M5 5h11l-2 4 2 4H5" /></P>
export const Umbrella = (p) => <P {...p}><path d="M3 12a9 9 0 0 1 18 0H3Z" /><path d="M12 12v6a2 2 0 0 0 4 0" /></P>
export const Landmark = (p) => <P {...p}><path d="M3 10 12 4l9 6M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 20h18" /></P>
export const Shield = (p) => <P {...p}><path d="M12 3 5 6v6c0 4.4 3 7.4 7 9 4-1.6 7-4.6 7-9V6l-7-3Z" /><path d="m9 12 2 2 4-4" /></P>
export const Clock = (p) => <P {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></P>
export const Bell = (p) => <P {...p}><path d="M6 17V11a6 6 0 1 1 12 0v6l1.5 2h-15L6 17Z" /><path d="M10 21h4" /></P>
export const Download = (p) => <P {...p}><path d="M12 4v11M7 11l5 5 5-5M5 20h14" /></P>
export const Phone = (p) => <P {...p}><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z" /></P>
export const Star = (p) => <P {...p}><path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9L12 3Z" /></P>
export const Lock = (p) => <P {...p}><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></P>
export const Users = (p) => <P {...p}><circle cx="9" cy="8" r="3.2" /><path d="M3 20a6 6 0 0 1 12 0M16 5a3.2 3.2 0 0 1 0 6M17 14.5a6 6 0 0 1 4 5.5" /></P>
export const Key = (p) => <P {...p}><circle cx="8" cy="15" r="4" /><path d="m11 12 8-8M16 7l3 3" /></P>
export const Plug = (p) => <P {...p}><path d="M9 3v5M15 3v5M6 8h12v3a6 6 0 0 1-12 0V8ZM12 17v4" /></P>
export const File = (p) => <P {...p}><path d="M7 3h7l5 5v13H7V3Z" /><path d="M14 3v5h5M10 13h6M10 17h6" /></P>
export const Wallet = (p) => <P {...p}><path d="M4 7a2 2 0 0 1 2-2h12v4M4 7v10a2 2 0 0 0 2 2h14V9H6a2 2 0 0 1-2-2Z" /><circle cx="16.5" cy="14" r="1" /></P>
export const Sprout = (p) => <P {...p}><path d="M12 21v-9M12 12c0-4 3-6 7-6 0 4-3 6-7 6ZM12 14c0-3-2.5-5-6-5 0 3 2.5 5 6 5Z" /></P>
