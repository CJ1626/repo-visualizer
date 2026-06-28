import { useState } from 'react'
import GraphCanvas from './components/GraphCanvas.jsx'
import RepoForm from './components/RepoForm.jsx'
import SummaryPanel from './components/SummaryPanel.jsx'

const headerStyle = {
  padding: '14px 24px',
  background: '#161b27',
  borderBottom: '1px solid #2d3448',
  display: 'flex',
  alignItems: 'baseline',
  gap: '12px',
  flexShrink: 0,
}

const titleStyle = {
  fontSize: '18px',
  fontWeight: 700,
  color: '#e2e8f0',
  letterSpacing: '-0.3px',
}

const subtitleStyle = {
  fontSize: '13px',
  color: '#64748b',
}

const errorBannerStyle = {
  background: 'rgba(248,113,113,0.1)',
  border: '1px solid rgba(248,113,113,0.3)',
  borderRadius: '6px',
  margin: '12px 20px',
  padding: '10px 16px',
  fontSize: '13px',
  color: '#f87171',
  flexShrink: 0,
}

const statsBarStyle = {
  padding: '6px 20px',
  background: '#161b27',
  borderBottom: '1px solid #2d3448',
  fontSize: '12px',
  color: '#64748b',
  flexShrink: 0,
}

export default function App() {
  const [graphData, setGraphData] = useState(null)
  const [scanning, setScanning] = useState(false)
  const [error, setError] = useState(null)
  const [selectedNode, setSelectedNode] = useState(null)

  function handleScanStart() {
    setScanning(true)
    setError(null)
    setSelectedNode(null)
  }

  function handleScanSuccess(data) {
    setScanning(false)
    setGraphData(data)
    setError(null)
  }

  function handleScanError(msg) {
    setScanning(false)
    setError(msg)
  }

  const nodes = graphData?.nodes ?? []
  const edges = graphData?.edges ?? []

  return (
    <>
      {/* Top bar */}
      <header style={headerStyle}>
        <span style={titleStyle}>Repo Visualizer</span>
        <span style={subtitleStyle}>
          Interactive file-dependency graph with AI-powered file summaries
        </span>
      </header>

      {/* Scan form */}
      <RepoForm
        onScanStart={handleScanStart}
        onScanSuccess={handleScanSuccess}
        onScanError={handleScanError}
      />

      {/* Error banner */}
      {error && <div style={errorBannerStyle}>{error}</div>}

      {/* Stats bar when graph is loaded */}
      {graphData && !error && (
        <div style={statsBarStyle}>
          {nodes.length} files &nbsp;·&nbsp; {edges.length} import edges
          {selectedNode && (
            <span> &nbsp;·&nbsp; Selected: <strong style={{ color: '#e2e8f0' }}>{selectedNode.data?.label}</strong></span>
          )}
        </div>
      )}

      {/* Graph canvas — fills remaining space */}
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        <GraphCanvas
          nodes={nodes}
          edges={edges}
          onNodeClick={setSelectedNode}
        />
      </div>

      {/* Summary side panel */}
      {selectedNode && (
        <SummaryPanel
          node={selectedNode}
          onClose={() => setSelectedNode(null)}
        />
      )}
    </>
  )
}
