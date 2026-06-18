import React, { useEffect, useRef } from 'react'
import JsBarcode from 'jsbarcode'

export default function BarcodeDisplay({ value, height = 60, width = 2, displayValue = true, fontSize = 14, className = '' }) {
  const svgRef = useRef(null)

  useEffect(() => {
    if (!value || !svgRef.current) return
    try {
      JsBarcode(svgRef.current, String(value), {
        format: 'CODE128',
        height,
        width,
        displayValue,
        fontSize,
        margin: 4,
      })
    } catch (err) {
      console.error('Barcode render error:', err)
    }
  }, [value, height, width, displayValue, fontSize])

  if (!value) {
    return <span className="text-gray-400 text-sm">Sin código</span>
  }

  return <svg ref={svgRef} className={className} />
}
