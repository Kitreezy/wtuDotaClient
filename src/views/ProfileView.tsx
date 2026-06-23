import { useState } from "react"
import PlayerDetailView from "./PlayerDetailView"
import type { Screen } from "../App"

interface Props { onNavigate: (s: Screen) => void }

const STEAM64 = 76561197960265728n

function parseId(raw: string): number | null {
  try {
    const big = BigInt(raw.trim())
    if (big > STEAM64) return Number(big - STEAM64)
    if (big > 0n) return Number(big)
  } catch {}
  return null
}

export default function ProfileView({ onNavigate }: Props) {
  const [input, setInput] = useState("")
  const [accountId, setAccountId] = useState<number|null>(() => {
    const s = localStorage.getItem("wtu_account_id")
    return s ? parseInt(s) : null
  })

  function save() {
    const id = parseId(input)
    if (!id) return
    localStorage.setItem("wtu_account_id", String(id))
    setAccountId(id)
  }

  function reset() {
    localStorage.removeItem("wtu_account_id")
    setAccountId(null)
    setInput("")
  }

  if (accountId) {
    return (
      <PlayerDetailView
        player={{ account_id: accountId, name: `ID ${accountId}` }}
        onBack={reset}
        onNavigate={onNavigate}
      />
    )
  }

  return (
    <div style={{ height:"100%", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{
        background:"#13161D", border:"1px solid rgba(255,255,255,0.07)",
        borderRadius:16, padding:"36px 32px", maxWidth:340, width:"100%",
      }}>
        <h2 style={{ margin:"0 0 6px", fontSize:18, fontWeight:800, textAlign:"center" }}>Мой профиль</h2>
        <p style={{ color:"#8B90A0", fontSize:12, textAlign:"center", marginBottom:24, lineHeight:1.6 }}>
          Steam64 ID или Dota Account ID
        </p>
        <input
          value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key==="Enter" && save()}
          placeholder="76561198xxxxxxxxx"
          style={{
            width:"100%", padding:"10px 14px",
            background:"#1A1D26", border:"1px solid rgba(255,255,255,0.09)",
            borderRadius:9, color:"#E8EAF2", fontSize:14, outline:"none",
            marginBottom:12,
          }}
        />
        <button onClick={save} style={{
          width:"100%", padding:"11px 0", borderRadius:10, border:"none",
          background:"#1FE3C2", color:"#0D0F14", fontWeight:700, fontSize:14, cursor:"pointer",
        }}>Сохранить</button>
      </div>
    </div>
  )
}
