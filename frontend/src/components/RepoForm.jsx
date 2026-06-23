import { useState } from 'react'

const styles = {
  form: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '12px 20px',
    background: '#161b27',
    borderBottom: '1px solid #2d3448',
  },
  label: {
    fontSize: '14px',
    color: '#94a3b8',
    whiteSpace: 'nowrap',
  },
  input: {
    flex: 1,
    padding: '8px 12px',
    background: '#0f1117',
    border: '1px solid #2d3448',
    borderRadius: '6px',
    color: '#e2e8f0',
    fontSize: '14px',
    outline: 'none',
    fontFamily: 'monospace',
    transition: 'border-color 0.2s',
  },
  button: {
    padding: '8px 18px',
    background: '#4a9eff',
    border: 'none',
    borderRadius: '6px',
    color: '#fff',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: 'background 0.2s',
  },
  buttonDisabled: {
    background: '#2d3448',
    cursor: 'not-allowed',
    color: '#64748b',
  },
  spinner: {
    fontSize: '13px',
    color: '#94a3b8',
    marginLeft: '8px',
  },
}

export default function RepoForm({ onScanStart, onScanSuccess, onScanError }) {
  const [path, setPath] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    const trimmed = path.trim()
    if (!trimmed) return

    setLoading(true)
    if (onScanStart) onScanStart()

    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: trimmed }),
      })
      const data = await res.json()
      if (!res.ok) {
        onScanError(data.error || `Server error: ${res.status}`)
      } else {
        onScanSuccess(data)
      }
    } catch (err) {
      onScanError(`Network error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      <label style={styles.label} htmlFor="repo-path">
        Repository path
      </label>
      <input
        id="repo-path"
        type="text"
        value={path}
        onChange={(e) => setPath(e.target.value)}
        placeholder="/path/to/your/repo"
        disabled={loading}
        style={styles.input}
        autoComplete="off"
        spellCheck="false"
      />
      <button
        type="submit"
        disabled={loading || !path.trim()}
        style={{
          ...styles.button,
          ...(loading || !path.trim() ? styles.buttonDisabled : {}),
        }}
      >
        {loading ? 'Scanning...' : 'Scan Repository'}
      </button>
      {loading && <span style={styles.spinner}>Analysing files…</span>}
    </form>
  )
}
