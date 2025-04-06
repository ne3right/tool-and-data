function doGet(e) {
  const sheetName = e.parameter.sheetName;
  const proc = e.parameter.proc;

  if (sheetName) {
    return exportSingleSheet(sheetName);
  } else if (proc) {
    return exportMergedProc(proc);
  } else {
    return ContentService.createTextOutput("パラメータ ?sheetName=シート名 または ?proc=処理名 を指定してください");
  }
}

/**
 * 指定のシート名をそのまま出力（現在のスプレッドシート内）
 */
function exportSingleSheet(sheetName) {
  const spreadSheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = spreadSheet.getSheetByName(sheetName);

  if (!sheet) {
    return ContentService.createTextOutput(`シート '${sheetName}' が見つかりません`);
  }

  const values = sheet.getDataRange().getValues();
  const csv = convertToCsv(values);

  return ContentService
    .createTextOutput(csv)
    .setMimeType(ContentService.MimeType.CSV);
}

/**
 * マスターシートから proc に基づいて複数スプレッドシートをマージして出力
 */
function exportMergedProc(proc) {
  const spreadSheet = SpreadsheetApp.getActiveSpreadsheet();
  const masterSheet = spreadSheet.getSheetByName("マスター");

  if (!masterSheet) {
    return ContentService.createTextOutput("マスターシートが存在しません");
  }

  const masterData = masterSheet.getDataRange().getValues();
  const header = masterData[0];
  const procColIndex = header.indexOf(proc);

  if (procColIndex === -1) {
    return ContentService.createTextOutput(`指定された proc '${proc}' はマスターに存在しません`);
  }

  const outputRows = [];
  let headerAppended = false;

  for (let i = 1; i < masterData.length; i++) {
    const row = masterData[i];
    const spreadsheetId = row[2];
    const targetSheetName = row[procColIndex];

    if (!spreadsheetId || !targetSheetName) continue;

    try {
      const targetSpreadsheet = SpreadsheetApp.openById(spreadsheetId);
      const targetSheet = targetSpreadsheet.getSheetByName(targetSheetName);
      if (!targetSheet) continue;

      const values = targetSheet.getDataRange().getValues();
      if (values.length === 0) continue;

      if (!headerAppended) {
        outputRows.push(values[0]);
        headerAppended = true;
      }

      outputRows.push(...values.slice(1));
    } catch (error) {
      console.log(`❌ スプレッドシートID ${spreadsheetId} の処理中にエラー: ${error}`);
    }
  }

  const csv = convertToCsv(outputRows);
  return ContentService
    .createTextOutput(csv)
    .setMimeType(ContentService.MimeType.CSV);
}

/**
 * 汎用 CSV コンバーター
 */
function convertToCsv(data) {
  return data.map(row =>
    row.map(cell => {
      if (typeof cell === "string") {
        cell = cell.replace(/"/g, '""');
        if (cell.includes(",") || cell.includes("\n")) {
          cell = `"${cell}"`;
        }
      }
      return cell;
    }).join(",")
  ).join("\r\n");
}
