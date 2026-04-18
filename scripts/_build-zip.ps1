$root = "c:\dev\AI4Consulting - Elio scaffold"
$ver  = (Get-Content "$root\SCAFFOLD_VERSION" -Raw).Trim()
$out  = "$root\elio-scaffold-v$ver.zip"

# Dirs to exclude everywhere
$excludeDirs = @(".venv", "__pycache__", "node_modules", ".git")
# Top-level items to exclude (internal / sensitive / editor-only)
$excludeTop  = @("elio coding contract", "Input", "AZURE Credentials.txt",
                  "scaffold.files", ".cursorignore", "deliverables",
                  "elio-scaffold-*.zip", "elio-scaffold-patch-*.zip",
                  "google ai studio dev guide", "GSD", ".testlogs", "AI-STUDIO-CONTEXT.md")

if (Test-Path $out) { Remove-Item $out -Force }

$tmp = "C:\Temp\elio-scaffold-v$ver"
if (Test-Path $tmp) { Remove-Item $tmp -Recurse -Force -ErrorAction SilentlyContinue }
if (Test-Path $tmp) { cmd /c "rmdir /s /q `"$tmp`"" }

# ── Robocopy the whole folder, excluding noise dirs ───────────────────────────
$xd = ($excludeDirs | ForEach-Object { "`"$_`"" }) -join " "
$robocopyArgs = "`"$root`" `"$tmp`" /E /XD $xd /NFL /NDL /NJH /NJS /NC /NS /NP"
cmd /c "robocopy $robocopyArgs" | Out-Null

# ── Remove top-level items that don't belong in the scaffold ──────────────────
foreach ($item in $excludeTop) {
    Get-ChildItem $tmp -Filter $item -ErrorAction SilentlyContinue |
        ForEach-Object { Remove-Item $_.FullName -Recurse -Force -ErrorAction SilentlyContinue }
}

Compress-Archive -Path "$tmp\*" -DestinationPath $out -CompressionLevel Optimal
Remove-Item $tmp -Recurse -Force -ErrorAction SilentlyContinue

$count = (Get-ChildItem $tmp -Recurse -File -ErrorAction SilentlyContinue).Count
if (-not $count) { $count = "?" }
$size  = [math]::Round((Get-Item $out).Length / 1KB, 1)
Write-Host "Done: $out - $size KB"
