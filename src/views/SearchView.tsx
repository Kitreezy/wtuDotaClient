import { useEffect, useState } from "react"
import { opendota } from "../services/opendota"
import type { Screen } from "../App"

interface Props { onNavigate: (s: Screen) => void }

export default function SearchView({ onNavigate }: Props) {
  const [query, setQuery] = useState("")
  const [players, setPlayers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    opendota.proPlayers().then(d => { setPlayers(d); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  const filtered = query.trim().length > 1
    ? players.filter(p =>
        p.name?.toLowerCase().includes(query.toLowerCase()) ||
        p.team_name?.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 30)
    : []

  return (
    <div style={{ height:"100%", overflow:"auto", padding:"20px 24px" }}>
      <h1 style={{ margin:0, fontSize:18, fontWeight:800, marginBottom:4 }}>Поиск игроков</h1>
      <p style={{ margin:0, fontSize:11, color:"#8B90A0", marginBottom:18 }}>Профессиональные игроки и матчи</p>

      <input
        value={query} onChange={e => setQuery(e.target.value)}
        placeholder="Имя или команда..."
        style={{
          width:"100%", maxWidth:440, padding:"10px 14px",
          background:"#13161D", border:"1px solid rgba(255,255,255,0.09)",
          borderRadius:10, color:"#E8EAF2", fontSize:14, outline:"none",
          marginBottom:18,
        }}
      />

      {loading && <div style={{ color:"#8B90A0", fontSize:13 }}>Загрузка...</div>}
      {!loading && query.trim().length <= 1 && (
        <div style={{ color:"#4A4F60", fontSize:13 }}>Введите минимум 2 символа</div>
      )}

      <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
        {filtered.map(p => (
          <button key={p.account_id} onClick={() => onNavigate({ type:"player", player:p })} style={{
            background:"#13161D", border:"1px solid rgba(255,255,255,0.06)",
            borderRadius:9, padding:"10px 14px", cursor:"pointer",
            display:"flex", alignItems:"center", gap:12, textAlign:"left",
          }}>
            {p.avatar
              ? <img src={p.avatar} style={{ width:36,height:36,borderRadius:7,flexShrink:0 }} alt="" />
              : <div style={{ width:36,height:36,borderRadius:7,background:"#1A1D26",flexShrink:0 }} />
            }
            <div>
              <div style={{ fontSize:13, fontWeight:600, color:"#E8EAF2" }}>{p.name}</div>
              <div style={{ fontSize:11, color:"#8B90A0", marginTop:1 }}>{p.team_name ?? "—"}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
