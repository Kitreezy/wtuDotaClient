const ENDPOINT = "https://api.stratz.com/graphql"
// Token is read from localStorage so the user can configure it
function token() { return localStorage.getItem("stratz_token") ?? "" }

async function query<T>(q: string, variables?: Record<string, unknown>): Promise<T> {
  const r = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
    body: JSON.stringify({ query: q, variables }),
  })
  const json = await r.json()
  if (json.errors) throw new Error(json.errors[0].message)
  return json.data
}

const BRACKETS = "[DIVINE, IMMORTAL]"

export const stratz = {
  heroWinDay: () => query<any>(`{
    heroStats {
      winDay(bracketIds:${BRACKETS}, days:14) { heroId day winCount matchCount }
    }
  }`),
  heroTalents: (heroId: number) => query<any>(`{
    heroStats {
      talent(heroId:${heroId}, bracketIds:${BRACKETS}) {
        abilityId treeLevel slot matchCount winCount
      }
    }
  }`),
}
