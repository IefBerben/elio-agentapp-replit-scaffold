Add-Type -Assembly System.IO.Compression.FileSystem
$z = [System.IO.Compression.ZipFile]::OpenRead("c:\dev\AI4Consulting - Elio scaffold\elio-scaffold-v7.zip")
$z.Entries | Sort-Object Length -Descending | Select-Object -First 30 | ForEach-Object {
    Write-Host ("{0,8} KB  {1}" -f [math]::Round($_.Length/1KB,1), $_.FullName)
}
Write-Host "---"
Write-Host ("Total entries: " + $z.Entries.Count)
$z.Dispose()
