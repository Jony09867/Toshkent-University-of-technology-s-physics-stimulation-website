$ErrorActionPreference = 'Stop'
$nodeCommand = Get-Command node -ErrorAction SilentlyContinue
$localNode = Join-Path (Split-Path $PSScriptRoot -Parent) '.tools\node.exe'
if ($nodeCommand) {
    $taskNode = $nodeCommand.Source
} elseif (Test-Path -LiteralPath $localNode) {
    $taskNode = $localNode
} else {
    throw 'Node.js 20+ o‘rnating: https://nodejs.org/'
}
Push-Location $PSScriptRoot
try { & $taskNode (Join-Path $PSScriptRoot 'scripts\serve.js') }
finally { Pop-Location }
