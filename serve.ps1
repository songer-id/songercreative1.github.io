param(
    [int]$Port = 8080
)

$root = $PSScriptRoot
if (-not $root) { $root = (Get-Location).Path }

$ip = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.InterfaceAlias -notmatch 'Loopback' -and $_.IPAddress -notlike '169.254*' } | Select-Object -First 1).IPAddress
if (-not $ip) { $ip = '127.0.0.1' }

$mimeTypes = @{
    '.html' = 'text/html; charset=utf-8'
    '.htm'  = 'text/html; charset=utf-8'
    '.css'  = 'text/css; charset=utf-8'
    '.js'   = 'application/javascript; charset=utf-8'
    '.json' = 'application/json; charset=utf-8'
    '.png'  = 'image/png'
    '.jpg'  = 'image/jpeg'
    '.jpeg' = 'image/jpeg'
    '.webp' = 'image/webp'
    '.svg'  = 'image/svg+xml'
    '.ico'  = 'image/x-icon'
    '.woff' = 'font/woff'
    '.woff2'= 'font/woff2'
    '.ttf'  = 'font/ttf'
}

$listener = $null
$portsToTry = @($Port, 8081, 5500, 3000, 8888)
foreach ($p in $portsToTry) {
    try {
        $listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Any, $p)
        $listener.Start()
        $Port = $p
        break
    } catch {
        $listener = $null
    }
}

if (-not $listener) {
    Write-Host "Gagal membuka port jaringan. Pastikan firewall mengizinkan PowerShell." -ForegroundColor Red
    exit 1
}

Write-Host "==========================================================" -ForegroundColor Green
Write-Host "   SERVER PREVIEW POS SONGER CREATIVE AKTIF!" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
Write-Host ""
Write-Host " Buka URL ini di HP / Tablet Anda (Pastikan Satu Wi-Fi):" -ForegroundColor Cyan
Write-Host "  -> http://$($ip):$($Port)/" -ForegroundColor Yellow
Write-Host "  -> http://$($ip):$($Port)/index.html (Toko Pembeli)" -ForegroundColor White
Write-Host "  -> http://$($ip):$($Port)/admin.html (Admin Panel)" -ForegroundColor White
Write-Host ""
Write-Host " Akses di PC ini:" -ForegroundColor Gray
Write-Host "  -> http://localhost:$($Port)/" -ForegroundColor Gray
Write-Host ""
Write-Host " Tekan Ctrl+C untuk menutup server." -ForegroundColor Red
Write-Host "==========================================================" -ForegroundColor Green

while ($true) {
    try {
        $client = $listener.AcceptTcpClient()
        $stream = $client.GetStream()
        $reader = [System.IO.StreamReader]::new($stream, [System.Text.Encoding]::UTF8)

        $requestLine = $reader.ReadLine()
        if (-not $requestLine) {
            $client.Close()
            continue
        }

        $parts = $requestLine.Split(' ')
        $rawUrl = if ($parts.Length -gt 1) { $parts[1] } else { '/' }

        while ($line = $reader.ReadLine()) {
            if ($line.Trim() -eq '') { break }
        }

        $cleanPath = $rawUrl.Split('?')[0].TrimStart('/')
        if ($cleanPath -eq '' -or $cleanPath -eq '/') {
            $cleanPath = 'index.html'
        }

        $cleanPath = [System.Uri]::UnescapeDataString($cleanPath).Replace('/', '\')
        $filePath = Join-Path $root $cleanPath

        if (Test-Path -Path $filePath -PathType Leaf) {
            $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
            $mime = if ($mimeTypes.ContainsKey($ext)) { $mimeTypes[$ext] } else { 'application/octet-stream' }
            $bytes = [System.IO.File]::ReadAllBytes($filePath)

            $header = "HTTP/1.1 200 OK`r`nContent-Type: $mime`r`nContent-Length: $($bytes.Length)`r`nAccess-Control-Allow-Origin: *`r`nConnection: close`r`n`r`n"
            $headerBytes = [System.Text.Encoding]::ASCII.GetBytes($header)

            $stream.Write($headerBytes, 0, $headerBytes.Length)
            $stream.Write($bytes, 0, $bytes.Length)
            $stream.Flush()
        } else {
            $notFound = "<html><body><h1>404 Not Found</h1><p>File tidak ditemukan: $cleanPath</p></body></html>"
            $nfBytes = [System.Text.Encoding]::UTF8.GetBytes($notFound)
            $header = "HTTP/1.1 404 Not Found`r`nContent-Type: text/html; charset=utf-8`r`nContent-Length: $($nfBytes.Length)`r`nConnection: close`r`n`r`n"
            $headerBytes = [System.Text.Encoding]::ASCII.GetBytes($header)

            $stream.Write($headerBytes, 0, $headerBytes.Length)
            $stream.Write($nfBytes, 0, $nfBytes.Length)
            $stream.Flush()
        }

        $client.Close()
    } catch {
        # Abaikan error client disconnect
    }
}
