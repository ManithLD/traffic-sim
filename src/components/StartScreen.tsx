import { useState } from "react"

export interface SimConfig {
  spawn_rate: number
  max_vehicles: number
  speed_multiplier: number
  signal_mode: string
}

export function SetupScreen({ onStart }: { onStart: (cfg: SimConfig) => void }) {
  const [spawnRate, setSpawnRate] = useState(10)
  const [maxVehicles, setMaxVehicles] = useState(150)
  const [speedMultiplier, setSpeedMultiplier] = useState(1.0)
  const [signalMode, setSignalMode] = useState<'fixed' | 'adaptive'>('fixed')
  const [loading, setLoading] = useState(false)

  const handleStart = async () => {
    setLoading(true)
    try {
      await fetch('http://localhost:8000/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spawn_rate: spawnRate, max_vehicles: maxVehicles, speed_multiplier: speedMultiplier, signal_mode: signalMode }),
      })
      onStart({ spawn_rate: spawnRate, max_vehicles: maxVehicles, speed_multiplier: speedMultiplier, signal_mode: signalMode })
    } catch (err) {
      console.error('Failed to start simulation', err)
      setLoading(false)
    }
  }

  return (
    <div style={{
      width: '99vw', height: '98vh', background: '#00000072',
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div style={{
        background: 'white', borderRadius: 12, padding: '2rem',
        width: 360, boxShadow: '0 4px 24px rgba(0,0,0,0.15)'
      }}>
        <p style={{ fontSize: 11, fontWeight: 500, color: '#888', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 6px' }}>
          UrbanFlow Simulation Engine
        </p>
        <h2 style={{ fontSize: 20, fontWeight: 500, margin: '0 0 1.5rem' }}>Configure simulation</h2>

        <SliderField
          label="Vehicle cap" value={maxVehicles}
          min={10} max={500} step={10}
          format={v => String(v)}
          onChange={setMaxVehicles}
        />
        <SliderField
          label="Spawn every" value={spawnRate}
          min={1} max={50} step={1}
          format={v => `${v} ticks`}
          hint={['faster (1)', 'slower (50)']}
          onChange={setSpawnRate}
        />
        <SliderField
          label="Speed multiplier" value={speedMultiplier}
          min={0.5} max={5} step={0.5}
          format={v => `${v.toFixed(1)}×`}
          onChange={setSpeedMultiplier}
        />

        <div style={{ marginBottom: '1.25rem' }}>
          <label style={{ fontSize: 13, color: '#666', display: 'block', marginBottom: 8 }}>Signal mode</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {(['fixed', 'adaptive'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setSignalMode(mode)}
                style={{
                  flex: 1, padding: '8px 0', fontSize: 13, fontWeight: 500,
                  border: '1.5px solid',
                  borderColor: signalMode === mode ? (mode === 'adaptive' ? '#16a34a' : '#2563eb') : '#e5e7eb',
                  borderRadius: 8, cursor: 'pointer',
                  background: signalMode === mode ? (mode === 'adaptive' ? '#f0fdf4' : '#eff6ff') : 'white',
                  color: signalMode === mode ? (mode === 'adaptive' ? '#16a34a' : '#2563eb') : '#888',
                }}
              >
                {mode === 'fixed' ? 'Fixed' : 'Adaptive'}
              </button>
            ))}
          </div>
          <p style={{ fontSize: 11, color: '#aaa', margin: '6px 0 0' }}>
            {signalMode === 'adaptive' ? 'Max-Pressure: green duration adjusts to queue length' : 'Fixed 50-tick green/red cycle'}
          </p>
        </div>

        <div style={{ borderTop: '1px solid #eee', paddingTop: '1.25rem' }}>
          <button
            onClick={handleStart}
            disabled={loading}
            style={{
              width: '100%', padding: '10px', fontSize: 14, fontWeight: 500,
              background: '#111', color: 'white', border: 'none',
              borderRadius: 8, cursor: loading ? 'default' : 'pointer',
              opacity: loading ? 0.6 : 1
            }}
          >
            {loading ? 'Starting…' : 'Start simulation'}
          </button>
        </div>
      </div>
    </div>
  )
}

function SliderField({ label, value, min, max, step, format, hint, onChange }: {
  label: string, value: number, min: number, max: number, step: number,
  format: (v: number) => string, hint?: [string, string],
  onChange: (v: number) => void
}) {
  return (
    <div style={{ marginBottom: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <label style={{ fontSize: 13, color: '#666' }}>{label}</label>
        <span style={{ fontSize: 15, fontWeight: 500 }}>{format(value)}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ width: '100%' }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#aaa', marginTop: 4 }}>
        <span>{hint?.[0] ?? min}</span>
        <span>{hint?.[1] ?? max}</span>
      </div>
    </div>
  )
}