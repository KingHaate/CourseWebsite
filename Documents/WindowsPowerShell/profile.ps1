function prompt {
    $currentPath = $PWD.Path
    Write-Host $currentPath -NoNewline -ForegroundColor Green
    Write-Host "`n> " -NoNewline
    return " "
}