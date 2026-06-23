export function Spinner({ size = 32, label }: { size?: number; label?: string }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:12 }}>
      <svg width={size} height={size} viewBox="0 0 32 32" style={{ animation:"spin 0.9s linear infinite" }}>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <circle cx="16" cy="16" r="13" fill="none" stroke="rgba(31,227,194,0.15)" strokeWidth="2.5"/>
        <path d="M16 3 A13 13 0 0 1 29 16" fill="none" stroke="#1FE3C2" strokeWidth="2.5" strokeLinecap="round"/>
      </svg>
      {label && <span style={{ fontSize:12, color:"#8B90A0" }}>{label}</span>}
    </div>
  )
}

export function SkeletonRow({ height = 44, radius = 9 }: { height?: number; radius?: number }) {
  return (
    <div style={{
      height, borderRadius:radius,
      background:"linear-gradient(90deg,#13161D 25%,#1A1D26 50%,#13161D 75%)",
      backgroundSize:"200% 100%",
      animation:"shimmer 1.4s ease-in-out infinite",
    }}>
      <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
    </div>
  )
}

export function SkeletonGrid({ cols = 3, rows = 4 }: { cols?: number; rows?: number }) {
  return (
    <div style={{ display:"grid", gridTemplateColumns:`repeat(${cols},1fr)`, gap:8 }}>
      {Array(cols*rows).fill(0).map((_,i) => <SkeletonRow key={i} height={56} />)}
    </div>
  )
}

export function AnalyzingOverlay({ text = "Анализирую..." }: { text?: string }) {
  return (
    <div style={{
      display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
      gap:20, height:"100%",
    }}>
      <div style={{ position:"relative", width:72, height:72 }}>
        {/* Outer ring */}
        <svg width="72" height="72" viewBox="0 0 72 72" style={{ position:"absolute", animation:"spin 1.2s linear infinite" }}>
          <circle cx="36" cy="36" r="32" fill="none" stroke="rgba(31,227,194,0.10)" strokeWidth="3"/>
          <path d="M36 4 A32 32 0 0 1 68 36" fill="none" stroke="#1FE3C2" strokeWidth="3" strokeLinecap="round"/>
        </svg>
        {/* Inner ring */}
        <svg width="72" height="72" viewBox="0 0 72 72" style={{ position:"absolute", animation:"spin 0.7s linear infinite reverse" }}>
          <path d="M36 14 A22 22 0 0 1 58 36" fill="none" stroke="rgba(31,227,194,0.35)" strokeWidth="2" strokeLinecap="round"/>
        </svg>
        {/* Center dot */}
        <div style={{
          position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center",
        }}>
          <div style={{ width:8, height:8, borderRadius:"50%", background:"#1FE3C2", animation:"pulse 1s ease-in-out infinite" }}>
            <style>{`@keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.4;transform:scale(.6)}}`}</style>
          </div>
        </div>
      </div>
      <div style={{ textAlign:"center" }}>
        <div style={{ fontSize:15, fontWeight:700, color:"#E8EAF2", marginBottom:4 }}>{text}</div>
        <div style={{ fontSize:12, color:"#4A4F60" }}>Загружаем матчапы героев</div>
      </div>
    </div>
  )
}
