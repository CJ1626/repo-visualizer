import { useState, useEffect } from 'react'

const panelStyle = {
  position: 'fixed',
  top: 0,
  right: 0,
  width: '360px',
  height: '100vh',
  background: '#1a1f2e',
  borderLeft: '1px solid #2d3448',
  display: 'flex',
  flexDirection: 'column',
  zIndex: 100,
  boxShadow: '-4px 0 24px rgba(0,0,0,0.5)',
  transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1)',
}

const headerStyle = {
  padding: '16px 20px',
  borderBottom: '1px solid #2d3448',
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
}

const titleRowStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '8px',
}

const fileNameStyle = {
  fontSize: '15px',
  fontWeight: 700,
  color: '#e2e8f0',
  fontFamily: 'monospace',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}

const closeBtnStyle = {
  background: 'none',
  border: 'none',
  color: '#64748b',
  fontSize: '20px',
  cursor: 'pointer',
  lineHeight: 1,
  padding: '2px 4px',
  borderRadius: '4px',
  flexShrink: 0,
}

const metaStyle = {
  fontSize: '12px',
  color: '#64748b',
  fontFamily: 'monospace',
}

const bodyStyle = {
  flex: 1,
  overflowY: 'auto',
  padding: '20px',
}

const summaryTextStyle = {
  fontSize: '14px',
  lineHeight: 1.7,
  color: '#cbd5e1',
  whiteSpace: 'pre-wrap',
}

const errorStyle = {
  fontSize: '13px',
  color: '#f87171',
  background: 'rgba(248,113,113,0.1)',
  border: '1px solid rgba(248,113,113,0.3)',
  borderRadius: '6px',
  padding: '12px',
}

const spinnerStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '12px',
  padding: '40px 0',
  color: '#64748b',
  fontSize: '14px',
}

const cachedBadgeStyle = {
  display: 'inline-block',
  background: 'rgba(74,158,255,0.15)',
  border: '1px solid rgba(74,158,255,0.4)',
  borderRadius: '4px',
  padding: '2px 8px',
  fontSize: '11px',
  color: '#4a9eff',
  fontWeight: 600,
  marginBottom: '12px',
}

function Spinner() {
  return (
    <div style={spinnerStyle}>
      <svg width="32" height="32" viewBox="0 0 32 32" style={{ animation: 'spin 1s linear infinite' }}>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        <circle cx="16" cy="16" r="12" fill="none" stroke="#4a9eff" strokeWidth="3" strokeDasharray="60 20" />
      </svg>
      Generating summary…
    </div>
  )
}

export default function SummaryPanel({ node, onClose }) {
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [cached, setCached] = useState(false)
  const [visible, setVisible] = useState(false)

  // Slide in on mount
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 10)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (!node) return

    setSummary(null)
    setError(null)
    setCached(false)
    setLoading(true)

    fetch('/api/summarize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: node.data.path }),
    })
      .then(async (res) => {
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || `Server error ${res.status}`)
        return data
      })
      .then((data) => {
        setSummary(data.summary)
        setCached(data.cached)
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [node?.id])

  const loc = node?.data?.loc ?? 0
  const label = node?.data?.label ?? node?.id ?? 'Unknown file'
  const path = node?.data?.path ?? ''

  return (
    <div
      style={{
        ...panelStyle,
        transform: visible ? 'translateX(0)' : 'translateX(100%)',
      }}
    >
      {/* Header */}
      <div style={headerStyle}>
        <div style={titleRowStyle}>
          <span style={fileNameStyle} title={label}>{label}</span>
          <button style={closeBtnStyle} onClick={onClose} title="Close">×</button>
        </div>
        <div style={metaStyle}>
          {loc} lines of code
          {path && <span title={path}> · {path.length > 40 ? '…' + path.slice(-38) : path}</span>}
        </div>
      </div>

      {/* Body */}
      <div style={bodyStyle}>
        {loading && <Spinner />}

        {!loading && error && <div style={errorStyle}>{error}</div>}

        {!loading && summary && (
          <>
            {cached && <div style={cachedBadgeStyle}>Cached</div>}
            <p style={summaryTextStyle}>{summary}</p>
          </>
        )}
      </div>
    </div>
  )
}
