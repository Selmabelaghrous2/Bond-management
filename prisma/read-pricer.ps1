$ErrorActionPreference = 'Stop'
$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
$excel.DisplayAlerts = $false

function CellText($sheet, $row, $column) {
  return ([string]$sheet.Cells.Item($row, $column).Text).Trim()
}

try {
  $workbook = $excel.Workbooks.Open((Join-Path $PSScriptRoot '..\data\Pricer - 2026.xlsm'), 0, $true)
  $baseSheet = $workbook.Worksheets.Item('Base _ Valeur')
  $curveSheet = $workbook.Worksheets.Item('Courbe')
  $zeroCouponSheet = $workbook.Worksheets.Item('Courbe ZC')
  $scheduleSheet = $workbook.Worksheets.Item('Echeancier Emetteur')

  $base = for ($row = 2; $row -le $baseSheet.UsedRange.Rows.Count; $row++) {
    $code = CellText $baseSheet $row 1
    if ($code) {
      [pscustomobject]@{ code=$code; nominal=(CellText $baseSheet $row 2); rate=(CellText $baseSheet $row 3); issueDate=(CellText $baseSheet $row 4); valueDate=(CellText $baseSheet $row 5); maturityDate=(CellText $baseSheet $row 6); wg=(CellText $baseSheet $row 7); ct=(CellText $baseSheet $row 8); cfg=(CellText $baseSheet $row 9); floating=(CellText $baseSheet $row 16); amortizing=(CellText $baseSheet $row 17); deferral=(CellText $baseSheet $row 18); frequency=(CellText $baseSheet $row 19); schedule=(CellText $baseSheet $row 20); comments=(CellText $baseSheet $row 21) }
    }
  }
  $curve = for ($row = 3; $row -le 12; $row++) {
    $maturity = CellText $curveSheet $row 2
    if ($maturity) { [pscustomobject]@{ valuationDate=(CellText $curveSheet $row 5); maturityDate=$maturity; days=(CellText $curveSheet $row 6); weightedRate=(CellText $curveSheet $row 4); moneyRate=(CellText $curveSheet $row 8); actuarialRate=(CellText $curveSheet $row 9) } }
  }
  $schedule = for ($row = 2; $row -le $scheduleSheet.UsedRange.Rows.Count; $row++) {
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
