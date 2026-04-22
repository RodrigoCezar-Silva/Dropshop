param()
# PowerShell script to copy docs/html contents into docs\
$src = Join-Path $PSScriptRoot '..\docs\html' | Resolve-Path -ErrorAction SilentlyContinue
if (-not $src) {
  Write-Error "Fonte não encontrada: docs\html"
  exit 1
}
$src = $src.Path
$dst = Join-Path $PSScriptRoot '..\docs' | Resolve-Path -ErrorAction SilentlyContinue
if (-not $dst) { New-Item -ItemType Directory -Path (Join-Path $PSScriptRoot '..\docs') | Out-Null; $dst = (Join-Path $PSScriptRoot '..\docs') }

Write-Host "Copiando $src -> $dst"
Get-ChildItem -Path $src -Recurse | ForEach-Object {
  $relative = $_.FullName.Substring($src.Length).TrimStart('\')
  $target = Join-Path $dst $relative
  if ($_.PSIsContainer) {
    if (-not (Test-Path $target)) { New-Item -ItemType Directory -Path $target | Out-Null }
  } else {
    Copy-Item -Path $_.FullName -Destination $target -Force
  }
}
Write-Host "Cópia concluída. Arquivos em $dst:"
Get-ChildItem -Path $dst -Recurse | Select-Object FullName | Out-String | Write-Host
