$port = 5500
Set-Location -LiteralPath $PSScriptRoot
Start-Process "http://127.0.0.1:$port/index.html"
python -m http.server $port
