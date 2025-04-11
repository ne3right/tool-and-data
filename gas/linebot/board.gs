// メイン処理
function boardDataHandring(args) {
  const groupName = args[0].trim();

  // マスターシートの情報を取得
  const masterSheet = SpreadsheetApp.openById(MASTER_SPREADSHEET_ID).getSheetByName(MASTER_SHEET_NAME);
  const masterData = masterSheet.getDataRange().getValues();

  // ヘッダーを取得
  const groupIdCol = 0;
  const groupNameCol = 1;
  const spreadsheetIdCol = 2;
  const signboardCol = 3;
  const boardlogCol = 4;

  // グループ名でマッチする行を探す
  const matchedRow = masterData.find((row, index) => index > 0 && row[groupNameCol] === groupName);
  if (!matchedRow) {
    return `❌ 該当するグループ「${groupName}」がマスターに見つかりません。`;
  }

  const groupId = matchedRow[groupIdCol];
  const spreadsheetId = matchedRow[spreadsheetIdCol];
  const boardDataSheetName = matchedRow[signboardCol]; // signboardシート名
  const boardLogSheetName = matchedRow[boardlogCol];   // boardlogシート名

  return processBoardData(groupId, groupName, spreadsheetId, boardDataSheetName, boardLogSheetName, args);
}

// 掲示板データ処理
function processBoardData(groupId, groupName, spreadsheetId, boardDataSheetName, boardLogSheetName, args) {
  let reply = "";
  const currentTime = getCurrentDateTime();
  const boardId = args[1].trim();
  const statusNo = args[2].trim();
  const comment = args.slice(3).map(line => line.trim()).join(" ");

  const num = Number(statusNo);
  if (!Number.isFinite(num)) {
    return "❌ エラー: ステータスは半角数字で書いてください。数値はマップの凡例参照";
  }

  let result = "未判定";

  const record = searchBoardAndGetRow(spreadsheetId, boardDataSheetName, groupName, boardId);
  if (record) {
    const updated = updateBoardData(record, statusNo, comment, currentTime);
    const sheet = SpreadsheetApp.openById(spreadsheetId).getSheetByName(boardDataSheetName);
    const row = updated.rowNumber;
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

    for (const key in updated.data) {
      const colIndex = headers.indexOf(key) + 1;
      if (colIndex > 0) {
        sheet.getRange(row, colIndex).setValue(updated.data[key]);
      }
    }

    reply = `掲示板ID ${boardId} （${groupName}）のステータスを更新しました。値: ${statusNo}, コメント: ${comment}`;
    result = "成功";
  } else {
    reply = `❌ ${boardId}は登録されていません。マップを見て登録されている掲示板IDを確認してください。`;
    result = "登録なし";
  }

  // ログ記録
  const logSheet = SpreadsheetApp.openById(spreadsheetId).getSheetByName(boardLogSheetName);
  const newRow = [currentTime, groupId, groupName, boardId, statusNo, comment, result, reply];
  logSheet.appendRow(newRow);

  return reply;
}

function updateBoardData(record, statusNo, comment, currentTime) {

  record.data.status = statusNo
  record.data.lastupdate = currentTime

  // comment に追記
  record.data.comment = record.data.comment ? `${record.data.comment}, ${comment}` : comment;

  return record;  // recordを返す
}


function searchBoardAndGetRow(spreadsheetId, sheetName, name, keyword) {
  const sheet = SpreadsheetApp.openById(spreadsheetId).getSheetByName(sheetName);
  if (!sheet) {
    console.log("❌ 指定されたシートが見つかりません！");
    return null;
  }

  const lastRow = sheet.getLastRow();
  const lastColumn = sheet.getLastColumn();
  if (lastRow <= 1) {
    console.log("❌ シートが空です。");
    return null;
  }
  const headers = sheet.getRange(1, 1, 1, lastColumn).getValues()[0];

  const nameColumnIndex = 3; // 📌 C列（1ベース = 3）
  const keywordColumnIndex = 4; // 📌 D列（1ベース = 4）

  const nameValues = sheet.getRange(2, nameColumnIndex, lastRow - 1, 1).getValues().flat();
  const keywordValues = sheet.getRange(2, keywordColumnIndex, lastRow - 1, 1).getValues().flat();

  // nameとkeywordの両方が一致する行を探す
  const rowIndex = nameValues.findIndex((v, i) => v === name && keywordValues[i] === keyword);

  if (rowIndex === -1) {
    console.log(`❌ "${keyword}" は見つかりませんでした`);
    return null;
  }

  // 該当行の全データを取得
  const dataRow = sheet.getRange(rowIndex + 2, 1, 1, lastColumn).getValues()[0]; // 1行目ヘッダーなので +2

  // データ本体をオブジェクトに格納
  const data = {};
  headers.forEach((header, index) => {
    data[header] = dataRow[index];
  });

  // 結果オブジェクトの構築
  const result = {
    rowNumber: rowIndex + 2, // 見つけた行番号
    data: data // データ本体
  };

  console.log(`✅ 検索結果: ${JSON.stringify(result, null, 2)}`);
  return result;
}
