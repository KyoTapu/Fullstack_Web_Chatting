import React, { useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Info } from 'lucide-react'

/**
 * InfoBtn — a small ⓘ icon that shows a tooltip on hover.
 * Uses a React Portal so the tooltip is never clipped by overflow:hidden/auto.
 * Usage: <InfoBtn tip="Your helpful hint here" />
 */
export const InfoBtn = ({ tip }) => {
  const [visible, setVisible] = useState(false)
  const [coords, setCoords]   = useState({ top: 0, left: 0 })
  const btnRef = useRef(null)

  const show = () => {
    if (!btnRef.current) return
    const rect = btnRef.current.getBoundingClientRect()
    setCoords({
      // position above the icon, centred horizontally
      top:  rect.top + window.scrollY - 8,
      left: rect.left + window.scrollX + rect.width / 2,
    })
    setVisible(true)
  }

  const hide = () => setVisible(false)

  return (
    <span className="relative inline-flex items-center">
      <button
        ref={btnRef}
        type="button"
        aria-label="More information"
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
        className="flex items-center justify-center w-4 h-4 rounded-full text-gray-400 hover:text-accent transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        <Info className="w-3.5 h-3.5" />
      </button>

      {visible && createPortal(
        <span
          role="tooltip"
          style={{
            position: 'absolute',
            top:  coords.top,
            left: coords.left,
            transform: 'translate(-50%, -100%)',
            zIndex: 9999,
            pointerEvents: 'none',
          }}
          className="w-max max-w-[200px] rounded-lg px-3 py-1.5 bg-gray-900 text-white text-xs leading-snug text-center shadow-lg"
        >
          {tip}
          {/* Arrow pointing down */}
          <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
        </span>,
        document.body
      )}
    </span>
  )
}
