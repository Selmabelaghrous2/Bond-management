$ErrorActionPreference = 'Stop'
$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
$excel.DisplayAlerts = $false
$excel.AskToUpdateLinks = $false
$excel.AutomationSecurity = 3
try { $excel.Calculation = -4135 } catch { }

function CellText($sheet, $row, $column) {
  return ([string]$sheet.Cells.Item($row, $column).Text).Trim()
}

function LastPopulatedRow($sheet, $column) {
  return [int]$sheet.Cells.Item($sheet.Rows.Count, $column).End(-4162).Row
}

try {
  $pricerPath = Join-Path $PSScriptRoot '..\data\Pricer - 2026.xlsm'
  $password = [string]$env:PRICER_PASSWORD
  try {
    # Passing the password explicitly prevents Excel from displaying a hidden
    # password dialog when this script runs from the web server.
    $workbook = $excel.Workbooks.Open($pricerPath, 0, $true, 5, $password)
  }
  catch {
    throw "Impossible d'ouvrir le fichier Pricer. Il est protégé par mot de passe : configurez PRICER_PASSWORD sur le serveur. Détail Excel : $($_.Exception.Message)"
  }
  $baseSheet = $workbook.Worksheets.Item('Base _ Valeur')
  $curveSheet = $workbook.Worksheets.Item('Courbe')
  $zeroCouponSheet = $workbook.Worksheets.Item('Courbe ZC')
  $scheduleSheet = $workbook.Worksheets.Item('Echeancier Emetteur')

  $base = for ($row = 2; $row -le (LastPopulatedRow $baseSheet 1); $row++) {
    $code = CellText $baseSheet $row 1
    if ($code) {
      [pscustomobject]@{ code=$code; nominal=(CellText $baseSheet $row 2); rate=(CellText $baseSheet $row 3); issueDate=(CellText $baseSheet $row 4); valueDate=(CellText $baseSheet $row 5); maturityDate=(CellText $baseSheet $row 6); wg=(CellText $baseSheet $row 7); ct=(CellText $baseSheet $row 8); cfg=(CellText $baseSheet $row 9); floating=(CellText $baseSheet $row 16); amortizing=(CellText $baseSheet $row 17); deferral=(CellText $baseSheet $row 18); frequency=(CellText $baseSheet $row 19); schedule=(CellText $baseSheet $row 20); comments=(CellText $baseSheet $row 21) }
    }
  }
  $curve = for ($row = 3; $row -le 12; $row++) {
    $maturity = CellText $curveSheet $row 2
    if ($maturity) { [pscustomobject]@{ valuationDate=(CellText $curveSheet $row 5); maturityDate=$maturity; days=(CellText $curveSheet $row 6); weightedRate=(CellText $curveSheet $row 4); moneyRate=(CellText $curveSheet $row 8); actuarialRate=(CellText $curveSheet $row 9) } }
  }
  $schedule = for ($row = 2; $row -le (LastPopulatedRow $scheduleSheet 1); $row++) {
    $code = CellText $scheduleSheet $row 1
    $date = CellText $scheduleSheet $row 2
    if ($code -and $date) { [pscustomobject]@{ code=$code; date=$date; principal=(CellText $scheduleSheet $row 3); outstanding=(CellText $scheduleSheet $row 4); interest=(CellText $scheduleSheet $row 5) } }
  }
  $zeroCoupon = for ($row = 2; $row -le $zeroCouponSheet.UsedRange.Rows.Count; $row++) {
    $mode = CellText $zeroCouponSheet $row 2
    $maturity = CellText $zeroCouponSheet $row 3
    $rate = CellText $zeroCouponSheet $row 4
    if ($mode -and $maturity -and $rate) { [pscustomobject]@{ valuationDate=(CellText $zeroCouponSheet 1 2); mode=$mode; maturity=$maturity; rate=$rate } }
  }
  [pscustomobject]@{ base=@($base); curve=@($curve); zeroCoupon=@($zeroCoupon); schedule=@($schedule) } | ConvertTo-Json -Depth 4 -Compress
}
finally {
  if ($workbook) { $workbook.Close($false) }
  $excel.Quit()
  [void][Runtime.InteropServices.Marshal]::ReleaseComObject($excel)
}
