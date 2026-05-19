Add-Type -AssemblyName System.Drawing

function Save-Icon {
  param([int]$Size, [string]$Path)
  $bmp = New-Object System.Drawing.Bitmap $Size, $Size
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.Clear([System.Drawing.Color]::FromArgb(15, 20, 25))
  $blue = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(61, 156, 245))
  $g.FillRectangle($blue, [int]($Size * 0.18), [int]($Size * 0.38), [int]($Size * 0.64), [int]($Size * 0.35))
  $g.Dispose()
  $bmp.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)
  $bmp.Dispose()
}

$iconDir = (Join-Path $PSScriptRoot "..\icons" | Resolve-Path).Path
Save-Icon -Size 192 -Path (Join-Path $iconDir "icon-192.png")
Save-Icon -Size 512 -Path (Join-Path $iconDir "icon-512.png")
Write-Host "Icons created in $iconDir"
