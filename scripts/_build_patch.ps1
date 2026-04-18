<#
.SYNOPSIS
    Build a scaffold patch zip containing only files that changed between two versions.

.DESCRIPTION
    Compares scaffold-owned files (listed in scaffold.files) between two git tags
    and packages the changed/added files into a patch zip.
    Also generates a PATCH_NOTES.md template listing what changed.

.PARAMETER From
    The source version tag (e.g. v6.0.0). Defaults to previous tag.

.PARAMETER To
    The target version tag or "HEAD" for current state. Defaults to HEAD.

.PARAMETER WhatIf
    Show what would be included without creating the zip.

.EXAMPLE
    .\scripts\_build_patch.ps1 -From v6.0.0 -To v6.1.0
    .\scripts\_build_patch.ps1 -From v6.0.0              # compares to HEAD
    .\scripts\_build_patch.ps1 -From v6.0.0 -WhatIf      # dry run
#>
param(
    [Parameter(Mandatory)][string]$From,
    [string]$To = "HEAD",
    [switch]$WhatIf
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $root

# ── Validate git tags ──
if ($From -ne "HEAD") {
    $tagExists = git tag -l $From
    if (-not $tagExists) {
        Write-Error "Tag '$From' not found. Available tags: $(git tag -l | Join-String ', ')"
        exit 1
    }
}
if ($To -ne "HEAD") {
    $tagExists = git tag -l $To
    if (-not $tagExists) {
        Write-Error "Tag '$To' not found. Available tags: $(git tag -l | Join-String ', ')"
        exit 1
    }
}

# ── Read scaffold file list ──
$manifestPath = Join-Path $root "scaffold.files"
if (-not (Test-Path $manifestPath)) {
    Write-Error "scaffold.files not found at repo root."
    exit 1
}

$scaffoldFiles = Get-Content $manifestPath |
    Where-Object { $_ -and -not $_.StartsWith('#') } |
    ForEach-Object { $_.Trim() } |
    Where-Object { $_ -ne '' }

Write-Host "Scaffold manifest: $($scaffoldFiles.Count) file patterns"

# ── Get changed files between the two refs ──
$diffOutput = git diff --name-status $From $To -- $scaffoldFiles 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Error "git diff failed: $diffOutput"
    exit 1
}

$changes = @()
foreach ($line in $diffOutput) {
    if ($line -match '^([AMD])\s+(.+)$') {
        $changes += [PSCustomObject]@{
            Status = $Matches[1]
            File   = $Matches[2]
        }
    }
}

if ($changes.Count -eq 0) {
    Write-Host "No scaffold files changed between $From and $To."
    exit 0
}

# ── Report ──
$added    = $changes | Where-Object { $_.Status -eq 'A' }
$modified = $changes | Where-Object { $_.Status -eq 'M' }
$deleted  = $changes | Where-Object { $_.Status -eq 'D' }

Write-Host ""
Write-Host "=== Scaffold patch: $From -> $To ==="
Write-Host "  Added:    $($added.Count)"
Write-Host "  Modified: $($modified.Count)"
Write-Host "  Deleted:  $($deleted.Count)"
Write-Host ""

foreach ($c in $changes) {
    $icon = switch ($c.Status) { 'A' { '+' } 'M' { '~' } 'D' { '-' } }
    Write-Host "  $icon $($c.File)"
}

# ── Also detect shared file changes (not in patch, but noted) ──
$sharedFiles = @(
    "back/main.py",
    "front/src/App.tsx",
    "front/src/i18n/locales/en.json",
    "front/src/i18n/locales/fr.json"
)
$sharedChanges = git diff --name-status $From $To -- $sharedFiles 2>&1
$sharedChanged = @()
foreach ($line in $sharedChanges) {
    if ($line -match '^([AMD])\s+(.+)$') {
        $sharedChanged += $Matches[2]
    }
}

if ($sharedChanged.Count -gt 0) {
    Write-Host ""
    Write-Host "  SHARED files also changed (manual merge needed):"
    foreach ($sf in $sharedChanged) {
        Write-Host "    ! $sf"
    }
}

if ($WhatIf) {
    Write-Host ""
    Write-Host "[WhatIf] No zip created."
    exit 0
}

# ── Determine version label ──
$toLabel = if ($To -eq "HEAD") {
    $versionFile = Join-Path $root "SCAFFOLD_VERSION"
    if (Test-Path $versionFile) { (Get-Content $versionFile -First 1).Trim() } else { "dev" }
} else {
    $To -replace '^v', ''
}
$fromLabel = $From -replace '^v', ''

# ── Build patch zip ──
$zipName = "elio-scaffold-patch-$fromLabel-to-$toLabel.zip"
$zipPath = Join-Path $root $zipName

$stagingDir = Join-Path ([System.IO.Path]::GetTempPath()) "elio-scaffold-patch-$fromLabel-to-$toLabel"
if (Test-Path $stagingDir) { Remove-Item $stagingDir -Recurse -Force }
New-Item -ItemType Directory $stagingDir -Force | Out-Null

# Copy changed/added files (skip deleted)
$filesToPack = $changes | Where-Object { $_.Status -ne 'D' }
foreach ($c in $filesToPack) {
    $src = Join-Path $root $c.File
    if (-not (Test-Path $src)) {
        Write-Warning "File not found on disk (skipping): $($c.File)"
        continue
    }
    $dst = Join-Path $stagingDir $c.File
    $dstDir = Split-Path $dst -Parent
    if (-not (Test-Path $dstDir)) { New-Item -ItemType Directory $dstDir -Force | Out-Null }
    Copy-Item $src $dst -Force
}

# Copy SCAFFOLD_VERSION
$svSrc = Join-Path $root "SCAFFOLD_VERSION"
if (Test-Path $svSrc) { Copy-Item $svSrc (Join-Path $stagingDir "SCAFFOLD_VERSION") -Force }

# ── Generate PATCH_NOTES.md ──
$notesLines = @()
$notesLines += "# Patch Notes: $fromLabel -> $toLabel"
$notesLines += ""
$notesLines += "Generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
$notesLines += ""
$notesLines += "## Auto-applied files (just extract the zip)"
$notesLines += ""
foreach ($c in ($changes | Where-Object { $_.Status -ne 'D' })) {
    $icon = if ($c.Status -eq 'A') { 'NEW' } else { 'UPD' }
    $notesLines += "- [$icon] ``$($c.File)``"
}
$notesLines += ""

if ($deleted.Count -gt 0) {
    $notesLines += "## Files to delete manually"
    $notesLines += ""
    foreach ($d in $deleted) {
        $notesLines += "- Delete: ``$($d.File)``"
    }
    $notesLines += ""
}

if ($sharedChanged.Count -gt 0) {
    $notesLines += "## Manual merge required (shared files)"
    $notesLines += ""
    $notesLines += "These files contain both scaffold code and your agent registrations."
    $notesLines += "Review the changes and merge manually:"
    $notesLines += ""
    foreach ($sf in $sharedChanged) {
        $notesLines += "### ``$sf``"
        $notesLines += ""
        $notesLines += "``````diff"
        $diffContent = git diff $From $To -- $sf 2>&1
        $notesLines += $diffContent
        $notesLines += "``````"
        $notesLines += ""
    }
}

$notesLines += "## Post-patch steps"
$notesLines += ""
$notesLines += "1. Extract the zip over your workspace: ``Expand-Archive $zipName -DestinationPath . -Force``"
$notesLines += "2. If ``back/pyproject.toml`` changed: ``cd back; uv sync``"
$notesLines += "3. If ``front/package.json`` changed: ``cd front; npm install``"
$notesLines += "4. Review any manual merge sections above"
$notesLines += ""

$notesContent = $notesLines -join "`n"
$notesPath = Join-Path $stagingDir "PATCH_NOTES.md"
[System.IO.File]::WriteAllText($notesPath, $notesContent)

# ── Zip it ──
if (Test-Path $zipPath) { Remove-Item $zipPath -Force }
Compress-Archive -Path "$stagingDir\*" -DestinationPath $zipPath -CompressionLevel Optimal

# ── Cleanup ──
try { Remove-Item $stagingDir -Recurse -Force -ErrorAction SilentlyContinue } catch {}

$size = [math]::Round((Get-Item $zipPath).Length / 1KB, 1)
Write-Host ""
Write-Host "Patch zip created: $zipPath ($size KB)"
Write-Host "Contains: $($filesToPack.Count) files + PATCH_NOTES.md + SCAFFOLD_VERSION"
