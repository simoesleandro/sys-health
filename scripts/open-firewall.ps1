# Execute como Administrador: npm run firewall:open
$ruleName = "SYS.HEALTH Next.js 3535"

$existing = Get-NetFirewallRule -DisplayName $ruleName -ErrorAction SilentlyContinue
if ($existing) {
  Write-Host "Regra de firewall ja existe: $ruleName"
  exit 0
}

New-NetFirewallRule `
  -DisplayName $ruleName `
  -Direction Inbound `
  -Action Allow `
  -Protocol TCP `
  -LocalPort 3535 `
  -Profile Private,Public

Write-Host "Firewall liberado para a porta 3535 (TCP entrada)."
