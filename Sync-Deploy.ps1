$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$docs = Join-Path $root "docs"

New-Item -ItemType Directory -Path $docs -Force | Out-Null

$files = @("index.html", "style.css", "interaction.js")
foreach ($name in $files) {
  Copy-Item -LiteralPath (Join-Path $root $name) -Destination (Join-Path $docs $name) -Force
}

Copy-Item -LiteralPath (Join-Path $root "assets") -Destination (Join-Path $docs "assets") -Recurse -Force
Copy-Item -LiteralPath (Join-Path $docs "index.html") -Destination (Join-Path $docs "404.html") -Force

Write-Host "Deploy directory synced:" $docs
