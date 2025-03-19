// wget url??sheetName=hoge

function doGet(e) {
  if (e.parameter == null)
    return;
 
  var sheetName = e.parameter.sheetName;
 
  var spreadSheet = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = spreadSheet.getSheetByName(sheetName);
  if (sheet == null)
    return;
 
  var csv = "";
  var range = sheet.getDataRange();
  var values = range.getValues();
  for (var i = 0; i < values.length; i++) {
    var rows = [];
    for (var j = 0; j < values[i].length; j++) {
      var cell = values[i][j];
      if (typeof cell === "string") {
        cell = cell.replace(/"/g, '""');  // `"` を `""` にエスケープ
        if (cell.includes(",") || cell.includes("\n")) {
          cell = `"${cell}"`;  // カンマや改行がある場合は `"` で囲む
        }
      }      
      rows.push(cell);
    }
 
    csv += rows.join(",");
    if (i < values.length - 1) {
       csv += "\r\n";
    }
  }
 
  var output = ContentService.createTextOutput();
  output.setMimeType(ContentService.MimeType.CSV);
  output.setContent(csv);
  return output;
}