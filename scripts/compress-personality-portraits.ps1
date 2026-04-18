# 缩小道性十六型肖像体积：最长边 maxEdge，JPEG 质量 quality（保留观感、显著减小主包）
param(
  [string]$Dir = "$PSScriptRoot\..\images\personality-portraits",
  [int]$MaxEdge = 768,
  [int]$Quality = 82
)

Add-Type -AssemblyName System.Drawing

$codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
if (-not $codec) { throw 'JPEG encoder not found' }

Get-ChildItem -Path $Dir -Filter '*.png' -File | ForEach-Object {
  $inPath = $_.FullName
  $base = $_.BaseName
  if ($base -notmatch '^\d+$') { return }
  $outPath = Join-Path $Dir ($base + '.jpg')

  $src = $null
  $bmp = $null
  $g = $null
  try {
    $src = [System.Drawing.Image]::FromFile($inPath)
    $w = $src.Width
    $h = $src.Height
    if ($w -le 0 -or $h -le 0) { return }

    $scale = 1.0
    if ($w -ge $h -and $w -gt $MaxEdge) { $scale = $MaxEdge / $w }
    elseif ($h -gt $w -and $h -gt $MaxEdge) { $scale = $MaxEdge / $h }

    $nw = [Math]::Max(1, [int][Math]::Round($w * $scale))
    $nh = [Math]::Max(1, [int][Math]::Round($h * $scale))

    $bmp = New-Object System.Drawing.Bitmap $nw, $nh
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.DrawImage($src, 0, 0, $nw, $nh)

    $enc = New-Object System.Drawing.Imaging.EncoderParameters(1)
    $enc.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter ([System.Drawing.Imaging.Encoder]::Quality, [long]$Quality)
    $bmp.Save($outPath, $codec, $enc)
    $enc.Dispose()

    try {
      Remove-Item -LiteralPath $inPath -Force -ErrorAction Stop
    } catch {
      Write-Warning "Could not delete $inPath (close apps using it), JPG saved as $outPath"
    }
    Write-Host "OK $base -> $nw x $nh"
  }
  finally {
    if ($g) { $g.Dispose() }
    if ($bmp) { $bmp.Dispose() }
    if ($src) { $src.Dispose() }
  }
}

Write-Host 'Done.'
