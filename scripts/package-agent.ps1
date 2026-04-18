<#
.SYNOPSIS
    Packages a single agent for transfer to the Elio dev team.

.DESCRIPTION
    Collects all files that constitute an agent (backend, frontend page, store,
    i18n keys, docs, PRODUCT.md, BACKLOG.md, SUBMISSION.md) and produces a
    ready-to-transfer zip with a synthetic compliance checklist.

.PARAMETER AgentName
    The Python folder name of the agent (underscores). E.g. "mon_usecase"

.EXAMPLE
    .\scripts\package-agent.ps1 -AgentName mon_usecase
#>
param(
    [Parameter(Mandatory = $true)]
    [string]$AgentName
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

# --- Paths -----------------------------------------------------------------
$Root = Split-Path $PSScriptRoot -Parent
$AgentKebab = $AgentName -replace '_', '-'
$AgentPascal = ($AgentName -split '_' | Where-Object { $_ -ne '' } | ForEach-Object {
    $_.Substring(0, 1).ToUpper() + $_.Substring(1)
}) -join ''
if ($AgentPascal.Length -gt 0) {
    $AgentCamel = $AgentPascal.Substring(0, 1).ToLower() + $AgentPascal.Substring(1)
}
else {
    $AgentCamel = $AgentName
}

$OutDir = Join-Path $Root "deliverables"
$StagingDir = Join-Path ([System.IO.Path]::GetTempPath()) "elio-agent-$AgentName"
$ZipFile = Join-Path $OutDir "$AgentName-livrable.zip"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Package Agent: $AgentName" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  kebab  : $AgentKebab"
Write-Host "  Pascal : $AgentPascal"
Write-Host "  camel  : $AgentCamel"
Write-Host ""

# --- Cleanup staging -------------------------------------------------------
if (Test-Path $StagingDir) { Remove-Item $StagingDir -Recurse -Force }
if (Test-Path $StagingDir) { cmd /c "rmdir /s /q `"$StagingDir`"" }

# --- Checklist tracking ----------------------------------------------------
$checks = [ordered]@{}
$warnings = @()
$errors = @()

function Add-Check {
    param([string]$Key, [string]$Label, [bool]$Pass, [string]$Detail = "")
    $script:checks[$Key] = @{ Label = $Label; Pass = $Pass; Detail = $Detail }
    if ((-not $Pass) -and ($Detail -match "required")) {
        $script:errors += "$Key : $Label -- $Detail"
    }
    elseif ((-not $Pass) -and ($Detail -ne "")) {
        $script:warnings += "$Key : $Label -- $Detail"
    }
}

# --- 1. Backend agent folder -----------------------------------------------
$backPath = Join-Path $Root "back\agents\$AgentName"
$hasBack = Test-Path $backPath
if ($hasBack) {
    Add-Check "B0" "Backend folder exists" $true
}
else {
    Add-Check "B0" "Backend folder exists" $false "required -- back/agents/$AgentName not found"
}

if ($hasBack) {
    # Check @stream_safe
    $stepFiles = Get-ChildItem $backPath -Filter "step*.py" -Recurse
    $allStreamSafe = $true
    foreach ($f in $stepFiles) {
        $content = Get-Content $f.FullName -Raw
        if ($content -notmatch '@stream_safe') { $allStreamSafe = $false }
    }
    if ($allStreamSafe) {
        Add-Check "B2" "@stream_safe on all step functions" $true
    }
    else {
        Add-Check "B2" "@stream_safe on all step functions" $false "required"
    }

    # Check get_llm
    $allGetLlm = $true
    foreach ($f in $stepFiles) {
        $content = Get-Content $f.FullName -Raw
        if ($content -notmatch 'get_llm') { $allGetLlm = $false }
    }
    if ($allGetLlm) {
        Add-Check "B5" "get_llm used, no direct LLM" $true
    }
    else {
        Add-Check "B5" "get_llm used, no direct LLM" $false "required"
    }

    # Check tests
    $testPath = Join-Path $backPath "tests"
    $hasTests = (Test-Path $testPath) -and ((Get-ChildItem $testPath -Filter "test_*.py" -ErrorAction SilentlyContinue | Measure-Object).Count -gt 0)
    if ($hasTests) {
        Add-Check "B6" "Tests present" $true
    }
    else {
        Add-Check "B6" "Tests present" $false "recommended"
    }

    # Check models.py
    $hasModels = Test-Path (Join-Path $backPath "models.py")
    if ($hasModels) {
        Add-Check "B1" "models.py exists" $true
    }
    else {
        Add-Check "B1" "models.py exists" $false "recommended"
    }

    # Check __init__.py
    $hasInit = Test-Path (Join-Path $backPath "__init__.py")
    if ($hasInit) {
        Add-Check "B7" "__init__.py exports" $true
    }
    else {
        Add-Check "B7" "__init__.py exports" $false "required -- needed for AGENTS_MAP import"
    }
}

# --- 2. Extract AGENTS_MAP snippet from main.py ----------------------------
$snippetContent = $null
$mainPy = Join-Path $Root "back\main.py"
if (Test-Path $mainPy) {
    $mainContent = Get-Content $mainPy -Raw
    $importPattern = "from agents\.$AgentName"
    $importLines = ($mainContent -split "`n") | Where-Object { $_ -match $importPattern }
    $escapedKebab = [regex]::Escape("""$AgentKebab-step-")
    $mapLines = ($mainContent -split "`n") | Where-Object { $_ -match $escapedKebab }

    $snippet = "# --- Copy these into back/main.py ---`n`n"
    $snippet += "# Imports:`n"
    if ($importLines) { $snippet += ($importLines -join "`n") + "`n" }
    else { $snippet += "# (no imports found -- agent not yet registered)`n" }
    $snippet += "`n# AGENTS_MAP entries:`n"
    if ($mapLines) { $snippet += ($mapLines -join "`n") + "`n" }
    else { $snippet += "# (no AGENTS_MAP entries found -- agent not yet registered)`n" }

    $snippetContent = $snippet

    $registered = ($null -ne $importLines) -and ($null -ne $mapLines)
    if ($registered) {
        Add-Check "B4" "Agent registered in AGENTS_MAP" $true
    }
    else {
        Add-Check "B4" "Agent registered in AGENTS_MAP" $false "required -- add imports and entries in main.py"
    }
}

# --- 3. Frontend page -------------------------------------------------------
$pagePath = Join-Path $Root "front\src\pages\${AgentPascal}Page.tsx"
$hasPage = Test-Path $pagePath
if ($hasPage) {
    Add-Check "F0" "Frontend page exists" $true

    $pageContent = Get-Content $pagePath -Raw
    if ($pageContent -match 'dark:') {
        Add-Check "F3" "Dark mode pairs" $true
    }
    else {
        Add-Check "F3" "Dark mode pairs" $false "required -- every color class needs dark: pair"
    }
    if ($pageContent -match 'agent-apps') {
        Add-Check "F5" "Uses shared components" $true
    }
    else {
        Add-Check "F5" "Uses shared components" $false "required -- import from @/components/agent-apps"
    }
}
else {
    Add-Check "F0" "Frontend page exists" $false "required -- ${AgentPascal}Page.tsx not found"
}

# --- 4. Frontend store -----------------------------------------------------
$storePath = Join-Path $Root "front\src\stores\agent-apps\${AgentCamel}Store.ts"
$hasStore = Test-Path $storePath
if ($hasStore) {
    Add-Check "F1" "Zustand store exists" $true

    $storeContent = Get-Content $storePath -Raw
    if ($storeContent -match 'agentService|executeAgentStreaming') {
        Add-Check "F4" "Uses agentService" $true
    }
    else {
        Add-Check "F4" "Uses agentService" $false "recommended"
    }
}
else {
    Add-Check "F1" "Zustand store exists" $false "required -- ${AgentCamel}Store.ts not found"
}

# --- 5. i18n keys -----------------------------------------------------------
$frJson = Join-Path $Root "front\src\i18n\locales\fr.json"
$enJson = Join-Path $Root "front\src\i18n\locales\en.json"

function Extract-AgentI18nKeys {
    param([string]$FilePath)
    if (-not (Test-Path $FilePath)) { return $null }
    $json = Get-Content $FilePath -Raw | ConvertFrom-Json
    foreach ($key in @($AgentCamel, $AgentKebab, $AgentPascal, $AgentName)) {
        if ($json.PSObject.Properties.Name -contains $key) {
            return @{ $key = $json.$key } | ConvertTo-Json -Depth 10
        }
    }
    return $null
}

$frKeys = Extract-AgentI18nKeys $frJson
$enKeys = Extract-AgentI18nKeys $enJson
$hasI18n = ($null -ne $frKeys) -and ($null -ne $enKeys)
if ($hasI18n) {
    Add-Check "F2" "i18n keys exist (fr + en)" $true
}
else {
    Add-Check "F2" "i18n keys exist (fr + en)" $false "required -- add agent keys in fr.json and en.json"
}

if ($frKeys) {
    $frOut = Join-Path $StagingDir "front\i18n\fr.json"
    New-Item -ItemType Directory -Path (Split-Path $frOut -Parent) -Force | Out-Null
    Set-Content -Path $frOut -Value $frKeys -Encoding utf8
}
if ($enKeys) {
    $enOut = Join-Path $StagingDir "front\i18n\en.json"
    New-Item -ItemType Directory -Path (Split-Path $enOut -Parent) -Force | Out-Null
    Set-Content -Path $enOut -Value $enKeys -Encoding utf8
}

# --- 6. Project docs: PRODUCT.md, BACKLOG.md, SUBMISSION.md -----------------
foreach ($doc in @("PRODUCT.md", "BACKLOG.md", "SUBMISSION.md")) {
    $docPath = Join-Path $Root $doc
    $hasDoc = Test-Path $docPath
    if ($hasDoc) {
        $docContent = Get-Content $docPath -Raw
        $isTemplate = $docContent -match 'compléter'
        if (-not $isTemplate) {
            Add-Check "D_$doc" "$doc filled in" $true
        }
        else {
            Add-Check "D_$doc" "$doc filled in" $false "recommended -- still contains placeholder sections"
        }
    }
    else {
        Add-Check "D_$doc" "$doc present" $false "recommended -- not found at project root"
    }
}

# --- 7. Agent-specific README -----------------------------------------------
$agentReadme = Join-Path $Root "back\agents\$AgentName\README.md"
$hasAgentDoc = Test-Path $agentReadme
if ($hasAgentDoc) {
    Add-Check "D0" "Agent README.md" $true
}
else {
    Add-Check "D0" "Agent README.md" $false "recommended -- add back/agents/$AgentName/README.md"
}

# --- 8. Screenshots folder ---------------------------------------------------
$screenshotsDir = Join-Path $Root "screenshots\$AgentName"
if (-not (Test-Path $screenshotsDir)) {
    $screenshotsDir = Join-Path $Root "screenshots"
}
$screenshotCount = 0
if (Test-Path $screenshotsDir) {
    $screenshots = Get-ChildItem $screenshotsDir -Include *.png, *.jpg, *.jpeg, *.gif, *.webp -Recurse -ErrorAction SilentlyContinue
    $screenshotCount = ($screenshots | Measure-Object).Count
    # Screenshots will be included by robocopy
}
$hasScreenshots = $screenshotCount -ge 3
if ($hasScreenshots) {
    Add-Check "S6" "Screenshots (min 3)" $true "$screenshotCount found"
}
else {
    Add-Check "S6" "Screenshots (min 3)" $false "EXIGENCE #6 -- found $screenshotCount, need 3+"
}

# --- Write pre-flight report into SUBMISSION.md -----------------------------
$submissionPath = Join-Path $Root "SUBMISSION.md"
$preflightBlock = @()
$preflightBlock += "**Generated:** $(Get-Date -Format 'yyyy-MM-dd HH:mm')  "
$preflightBlock += "**Agent:** ``$AgentName`` (route: ``$AgentKebab``)  "
$preflightBlock += ""
$preflightBlock += "### Pre-flight checks"
$preflightBlock += ""
$preflightBlock += "| # | Check | Status | Detail |"
$preflightBlock += "|---|-------|--------|--------|"

foreach ($key in $checks.Keys) {
    $c = $checks[$key]
    $icon = if ($c.Pass) { "PASS" } else { "FAIL" }
    $detail = if ($c.Detail) { $c.Detail } else { "-" }
    $preflightBlock += "| $key | $($c.Label) | $icon | $detail |"
}

$passCount = ($checks.Values | Where-Object { $_.Pass }).Count
$totalCount = $checks.Count
$preflightBlock += ""
$preflightBlock += "**Result: $passCount / $totalCount passed**"

if ($errors.Count -gt 0) {
    $preflightBlock += ""
    $preflightBlock += "### Blocking issues"
    foreach ($e in $errors) { $preflightBlock += "- $e" }
}
if ($warnings.Count -gt 0) {
    $preflightBlock += ""
    $preflightBlock += "### Recommendations"
    foreach ($w in $warnings) { $preflightBlock += "- $w" }
}

$preflightBlock += ""
$preflightBlock += "### Package contents"
$preflightBlock += ""
$preflightBlock += "Full runnable workspace (back/ + front/ + scripts/ + docs)"
$preflightBlock += ""

# Replace the marker block in SUBMISSION.md
if (Test-Path $submissionPath) {
    $submContent = Get-Content $submissionPath -Raw
    $startMarker = "<!-- PACKAGE_PREFLIGHT_START -->"
    $endMarker = "<!-- PACKAGE_PREFLIGHT_END -->"
    $pattern = "(?s)$([regex]::Escape($startMarker)).*?$([regex]::Escape($endMarker))"
    $replacement = "$startMarker`n$($preflightBlock -join "`n")`n$endMarker"
    if ($submContent -match [regex]::Escape($startMarker)) {
        $submContent = [regex]::Replace($submContent, $pattern, $replacement)
        Set-Content -Path $submissionPath -Value $submContent -NoNewline -Encoding utf8
        Write-Host "  Updated SUBMISSION.md Section 7" -ForegroundColor Green
    }
    else {
        Write-Host "  WARNING: SUBMISSION.md missing PACKAGE_PREFLIGHT markers -- skipped update" -ForegroundColor Yellow
    }
}

# --- Create zip (SUBMISSION.md is now updated) ------------------------------
# Copy the FULL runnable workspace, excluding noise dirs + editor config
$excludeDirs = @(".venv", "__pycache__", "node_modules", ".git", ".github", ".vscode",
                 ".testlogs", "deliverables")
$excludeTop  = @("elio coding contract", "Input", "AZURE Credentials.txt",
                  "scaffold.files", ".cursorignore",
                  "elio-scaffold-*.zip", "elio-scaffold-patch-*.zip",
                  "google ai studio dev guide", "GSD", "AI-STUDIO-CONTEXT.md")

$xd = ($excludeDirs | ForEach-Object { "`"$_`"" }) -join " "
$robocopyArgs = "`"$Root`" `"$StagingDir`" /E /XD $xd /NFL /NDL /NJH /NJS /NC /NS /NP"
cmd /c "robocopy $robocopyArgs" | Out-Null

# Remove top-level items that don't belong in the deliverable
foreach ($item in $excludeTop) {
    Get-ChildItem $StagingDir -Filter $item -ErrorAction SilentlyContinue |
        ForEach-Object { Remove-Item $_.FullName -Recurse -Force -ErrorAction SilentlyContinue }
}

# Write agents_map_snippet.py helper into staging root
if ($snippetContent) {
    $snippetFile = Join-Path $StagingDir "agents_map_snippet.py"
    Set-Content -Path $snippetFile -Value $snippetContent -Encoding utf8
}

if (-not (Test-Path $OutDir)) { New-Item -ItemType Directory -Path $OutDir -Force | Out-Null }
if (Test-Path $ZipFile) { Remove-Item $ZipFile -Force }

Compress-Archive -Path "$StagingDir\*" -DestinationPath $ZipFile -Force

$entryCount = (Get-ChildItem $StagingDir -Recurse -File -ErrorAction SilentlyContinue | Measure-Object).Count
$sizeKB = [math]::Round((Get-Item $ZipFile).Length / 1024, 1)

# --- Cleanup staging --------------------------------------------------------
try { if (Test-Path $StagingDir) { Remove-Item $StagingDir -Recurse -Force } } catch { }

# --- Print report -----------------------------------------------------------
Write-Host ""
Write-Host "--- Compliance Report ---" -ForegroundColor Cyan
Write-Host ""
foreach ($key in $checks.Keys) {
    $c = $checks[$key]
    if ($c.Pass) {
        $icon = "[PASS]"
        $color = "Green"
    }
    else {
        $icon = "[FAIL]"
        $color = "Yellow"
    }
    $detail = ""
    if ($c.Detail) { $detail = " -- $($c.Detail)" }
    Write-Host "  $icon $($c.Label)$detail" -ForegroundColor $color
}

Write-Host ""
Write-Host "--- Result ---" -ForegroundColor Cyan
Write-Host "  $passCount / $totalCount checks passed"
Write-Host ""
Write-Host "  Package: $ZipFile" -ForegroundColor Green
Write-Host "  Size: $sizeKB KB, $entryCount files"
Write-Host ""

if ($errors.Count -gt 0) {
    Write-Host "  WARNING: $($errors.Count) blocking issue(s) -- zip created but review SUBMISSION.md Section 7" -ForegroundColor Yellow
}
else {
    Write-Host "  Ready for transfer" -ForegroundColor Green
}
Write-Host ""
