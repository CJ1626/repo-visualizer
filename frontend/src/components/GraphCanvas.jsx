import { useEffect, useCallback } from 'react'
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
} from 'reactflow'
import 'reactflow/dist/style.css'

// ---------------------------------------------------------------------------
// Mock data – shown when no real graph has been loaded yet
// ---------------------------------------------------------------------------
const MOCK_NODES = [
  { id: 'app.py', data: { label: 'app.py', loc: 60, path: '/mock/app.py' }, position: { x: 300, y: 50 } },
  { id: 'scanner/walker.py', data: { label: 'walker.py', loc: 45, path: '/mock/scanner/walker.py' }, position: { x: 80, y: 200 } },
  { id: 'scanner/parser.py', data: { label: 'parser.py', loc: 80, path: '/mock/scanner/parser.py' }, position: { x: 300, y: 200 } },
  { id: 'scanner/graph_builder.py', data: { label: 'graph_builder.py', loc: 120, path: '/mock/scanner/graph_builder.py' }, position: { x: 540, y: 200 } },
  { id: 'ai/summarizer.py', data: { label: 'summarizer.py', loc: 55, path: '/mock/ai/summarizer.py' }, position: { x: 150, y: 370 } },
  { id: 'ai/cache.py', data: { label: 'cache.py', loc: 30, path: '/mock/ai/cache.py' }, position: { x: 450, y: 370 } },
]

const MOCK_EDGES = [
  { id: 'e1', source: 'app.py', target: 'scanner/graph_builder.py' },
  { id: 'e2', source: 'app.py', target: 'ai/summarizer.py' },
  { id: 'e3', source: 'scanner/graph_builder.py', target: 'scanner/walker.py' },
  { id: 'e4', source: 'scanner/graph_builder.py', target: 'scanner/parser.py' },
  { id: 'e5', source: 'ai/summarizer.py', target: 'ai/cache.py' },
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Interpolate between blue (#4a9eff) and red (#ff6b6b) based on loc / maxLoc.
 * Low loc → blue, high loc → red.
 */
function lerp(a, b, t) {
  return Math.round(a + (b - a) * t)
}

function getNodeColor(loc, maxLoc) {
  if (!maxLoc || maxLoc === 0) return '#4a9eff'
  const t = Math.min(loc / maxLoc, 1)
  const r = lerp(0x4a, 0xff, t)
  const g = lerp(0x9e, 0x6b, t)
  const b = lerp(0xff, 0x6b, t)
  return `rgb(${r},${g},${b})`
}

function buildStyledNodes(rawNodes) {
  if (!rawNodes || rawNodes.length === 0) return []
  const maxLoc = Math.max(...rawNodes.map((n) => n.loc ?? n.data?.loc ?? 0), 1)

  return rawNodes.map((n, i) => {
    const loc = n.loc ?? n.data?.loc ?? 0
    const label = n.label ?? n.data?.label ?? n.id
    const path = n.path ?? n.data?.path ?? ''
    const color = getNodeColor(loc, maxLoc)

    // Scale node width and font size slightly with loc
    const t = Math.min(loc / maxLoc, 1)
    const width = Math.round(120 + t * 80)   // 120–200 px
    const fontSize = Math.round(11 + t * 3)  // 11–14 px

    // Spread nodes in a grid if no position supplied
    const cols = Math.ceil(Math.sqrt(rawNodes.length))
    const col = i % cols
    const row = Math.floor(i / cols)
    const position = n.position ?? { x: col * 220, y: row * 120 }

    return {
      id: n.id,
      position,
      data: { label, loc, path },
      style: {
        background: color,
        color: '#fff',
        border: '1px solid rgba(255,255,255,0.2)',
        borderRadius: '8px',
        padding: '8px 12px',
        width,
        fontSize,
        fontWeight: 600,
        boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
        cursor: 'pointer',
      },
    }
  })
}

function buildStyledEdges(rawEdges) {
  if (!rawEdges) return []
  return rawEdges.map((e) => ({
    ...e,
    style: { stroke: '#4a5568', strokeWidth: 1.5 },
    animated: false,
  }))
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function GraphCanvas({ nodes: propNodes, edges: propEdges, onNodeClick }) {
  const useMock = !propNodes || propNodes.length === 0

  const [nodes, setNodes, onNodesChange] = useNodesState(buildStyledNodes(MOCK_NODES))
  const [edges, setEdges, onEdgesChange] = useEdgesState(buildStyledEdges(MOCK_EDGES))

  useEffect(() => {
    if (useMock) {
      setNodes(buildStyledNodes(MOCK_NODES))
      setEdges(buildStyledEdges(MOCK_EDGES))
    } else {
      setNodes(buildStyledNodes(propNodes))
      setEdges(buildStyledEdges(propEdges || []))
    }
  }, [propNodes, propEdges, useMock, setNodes, setEdges])

  const handleNodeClick = useCallback(
    (_event, node) => {
      if (onNodeClick) onNodeClick(node)
    },
    [onNodeClick]
  )

  return (
    <div style={{ height: '100%', minHeight: 400, flex: 1, position: 'relative' }}>
      {useMock && (
        <div
          style={{
            position: 'absolute',
            top: 12,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(74,158,255,0.15)',
            border: '1px solid rgba(74,158,255,0.4)',
            borderRadius: '6px',
            padding: '6px 16px',
            fontSize: '12px',
            color: '#94a3b8',
            zIndex: 10,
            pointerEvents: 'none',
          }}
        >
          Demo graph — scan a repository above to see real data
        </div>
      )}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.1}
        maxZoom={3}
        attributionPosition="bottom-left"
      >
        <Background color="#2d3448" gap={20} />
        <Controls style={{ background: '#1a1f2e', border: '1px solid #2d3448' }} />
        <MiniMap
          nodeColor={(n) => n.style?.background ?? '#4a9eff'}
          maskColor="rgba(15,17,23,0.7)"
          style={{ background: '#161b27', border: '1px solid #2d3448' }}
        />
      </ReactFlow>
    </div>
  )
}
