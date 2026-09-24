<#
.SYNOPSIS
  Builds every plugin under this folder (any directory with a package.json
  that has a "build" script, excluding node_modules).

.EXAMPLE
  .\build-all.ps1                     # install deps where missing, build all
  .\build-all.ps1 -Only IMPORT        # only plugins whose path contains "IMPORT"
  .\build-all.ps1 -SkipInstall        # don't run npm ci / npm install
  .\build-all.ps1 -CleanInstall       # delete node_modules and reinstall first
  .\build-all.ps1 -StopOnError        # stop at the first failing plugin

  If scripts are blocked:  powershell -ExecutionPolicy Bypass -File .\build-all.ps1
#>
param(
  [string]$Only = "",
  [switch]$SkipInstall,
  [switch]$CleanInstall,
  [switch]$StopOnError
)

$ErrorActionPreference = "Stop"
$root = $PSScriptRoot

if (-not (Get-Command npm.cmd -ErrorAction SilentlyContinue)) {
  Write-Host "npm not found on PATH. Install Node.js first." -ForegroundColor Red
  exit 1
}

# ── Discover plugins ───────────────────────────────────────────────
# Walks folders manually and never enters node_modules / dist / .git.
# (Get-ChildItem -Recurse descends into node_modules and fails on paths
# longer than 260 characters.)
$skipDirs = @("node_modules", "dist", ".git", "build", ".vite")

function Find-PackageDirs([string]$dir) {
  $pkgFile = Join-Path $dir "package.json"
  if ([System.IO.File]::Exists($pkgFile)) {
    try {
      $pkg = Get-Content -LiteralPath $pkgFile -Raw | ConvertFrom-Json
      if ($pkg.scripts -and $pkg.scripts.build) { $dir }
    } catch {
      Write-Host "Skipping unreadable package.json: $pkgFile" -ForegroundColor DarkYellow
    }
  }
  try {
    $children = [System.IO.Directory]::GetDirectories($dir)
  } catch {
    return
  }
  foreach ($child in $children) {
    $leaf = [System.IO.Path]::GetFileName($child)
    if ($skipDirs -notcontains $leaf) { Find-PackageDirs $child }
  }
}

Write-Host "Scanning for plugins under $root ..." -ForegroundColor DarkGray
$plugins = Find-PackageDirs $root |
  Where-Object { $Only -eq "" -or $_ -like "*$Only*" } |
  Sort-Object

if (-not $plugins) {
  Write-Host "No plugins found." -ForegroundColor Yellow
  exit 0
}

Write-Host "Found $(@($plugins).Count) plugin(s):" -ForegroundColor Cyan
$plugins | ForEach-Object { Write-Host ("  - " + $_.Substring($root.Length + 1)) }
Write-Host ""

# ── Build each ─────────────────────────────────────────────────────
$results  = @()
$total    = @($plugins).Count
$index    = 0
$runStart = Get-Date

function Write-Step([string]$msg) {
  $t = (Get-Date).ToString("HH:mm:ss")
  Write-Host "[$t] $msg" -ForegroundColor Yellow
}

foreach ($dir in $plugins) {
  $index++
  $name  = $dir.Substring($root.Length + 1)
  $start = Get-Date
  $status = "OK"
  $note   = ""

  $okSoFar   = @($results | Where-Object { $_.Status -eq "OK" }).Count
  $failSoFar = $results.Count - $okSoFar
  Write-Progress -Activity "Building plugins" -Status "[$index/$total] $name" -PercentComplete ((($index - 1) / $total) * 100)

  Write-Host ("=" * 70) -ForegroundColor DarkGray
  Write-Host "[$index/$total] Building: $name" -ForegroundColor Cyan
  Write-Host "        So far: $okSoFar OK, $failSoFar failed, $($total - $index + 1) remaining" -ForegroundColor DarkGray
  Write-Host ("=" * 70) -ForegroundColor DarkGray

  Push-Location $dir
  try {
    if ($CleanInstall -and (Test-Path node_modules)) {
      Write-Step "[$index/$total] Removing node_modules..."
      # rmdir handles long node_modules paths that Remove-Item chokes on
      & cmd.exe /c "rmdir /s /q node_modules"
    }

    if (-not $SkipInstall -and -not (Test-Path node_modules)) {
      Write-Progress -Activity "Building plugins" -Status "[$index/$total] $name - installing dependencies" -PercentComplete ((($index - 1) / $total) * 100)
      if (Test-Path package-lock.json) {
        Write-Step "[$index/$total] Step 1/2: Installing dependencies (npm ci)..."
        & npm.cmd ci --no-audit --no-fund
        if ($LASTEXITCODE -ne 0) {
          Write-Step "[$index/$total] npm ci failed, falling back to npm install..."
          & npm.cmd install --no-audit --no-fund
        }
      } else {
        Write-Step "[$index/$total] Step 1/2: Installing dependencies (npm install)..."
        & npm.cmd install --no-audit --no-fund
      }
      if ($LASTEXITCODE -ne 0) { throw "dependency install failed" }
      Write-Step "[$index/$total] Dependencies installed."
    } else {
      Write-Step "[$index/$total] Step 1/2: Dependencies already installed, skipping."
    }

    Write-Progress -Activity "Building plugins" -Status "[$index/$total] $name - building" -PercentComplete ((($index - 1) / $total) * 100)
    Write-Step "[$index/$total] Step 2/2: Building (npm run build)..."
    & npm.cmd run build
    if ($LASTEXITCODE -ne 0) { throw "build failed (exit $LASTEXITCODE)" }

    if (Test-Path dist) { $note = "-> dist\" }
  }
  catch {
    $status = "FAILED"
    $note   = $_.Exception.Message
  }
  finally {
    Pop-Location
  }

  $secs = [math]::Round(((Get-Date) - $start).TotalSeconds, 1)
  $results += [pscustomobject]@{ Plugin = $name; Status = $status; Seconds = $secs; Note = $note }

  $elapsed = [math]::Round(((Get-Date) - $runStart).TotalMinutes, 1)
  if ($status -eq "OK") {
    Write-Host "[$index/$total] OK: $name ($secs s)  | total elapsed: $elapsed min" -ForegroundColor Green
  } else {
    Write-Host "[$index/$total] FAILED: $name - $note  | total elapsed: $elapsed min" -ForegroundColor Red
    if ($StopOnError) { break }
  }
  Write-Host ""
}

Write-Progress -Activity "Building plugins" -Completed

# ── Summary ────────────────────────────────────────────────────────
Write-Host ("=" * 70) -ForegroundColor DarkGray
Write-Host "SUMMARY" -ForegroundColor Cyan
Write-Host ("=" * 70) -ForegroundColor DarkGray
$results | Format-Table -AutoSize | Out-String | Write-Host
Write-Host "Total time: $([math]::Round(((Get-Date) - $runStart).TotalMinutes, 1)) min" -ForegroundColor Cyan

$failed = @($results | Where-Object { $_.Status -ne "OK" })
if ($failed.Count -gt 0) {
  Write-Host "$($failed.Count) of $($results.Count) plugin(s) failed." -ForegroundColor Red
  exit 1
}
Write-Host "All $($results.Count) plugin(s) built successfully." -ForegroundColor Green
exit 0