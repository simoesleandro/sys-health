import { networkInterfaces } from "node:os"

const port = process.env.PORT ?? "3535"

function isVirtualLanIp(address) {
  return (
    address.startsWith("169.254.") ||
    address.startsWith("192.168.56.") ||
    address.startsWith("172.17.") ||
    address.startsWith("172.18.")
  )
}

const ips = []

for (const [iface, entries] of Object.entries(networkInterfaces())) {
  for (const entry of entries ?? []) {
    if (entry.family !== "IPv4" || entry.internal) continue
    if (isVirtualLanIp(entry.address)) continue
    ips.push({ address: entry.address, name: iface })
  }
}

const wifiFirst = [...ips].sort((a, b) => {
  const score = (name) =>
    /wi-?fi/i.test(name) ? 0 : /ethernet/i.test(name) && !/virtual|vmware|hyper|vethernet/i.test(name) ? 1 : 2
  return score(a.name) - score(b.name)
})

console.log("")
console.log("Acesso no celular (mesma rede Wi-Fi):")
if (wifiFirst.length === 0) {
  console.log(`  Não foi possível detectar o IP local. Use: http://<IP-do-PC>:${port}`)
} else {
  for (const { address, name } of wifiFirst) {
    console.log(`  http://${address}:${port}  (${name})`)
  }
}
console.log("")
console.log("Não use localhost no celular. Evite IPs de adaptadores virtuais (ex.: 192.168.56.x).")
console.log("")
