function boardDataHandring(args) {
  // 1行目 = グループ名,2行目 = 掲示板ID, 3行目=ステータス 4行目以降=コメント
  const groupName = args[0].trim();

  const GROUPPATTERNS = getGroupPatterns(); // スプレッドシートからデータを取得
  // グループがリストに存在するかチェック
  let matchedGroup = null;
  for (const key in GROUPPATTERNS) {
    if (GROUPPATTERNS[key].includes(groupName)) {
      matchedGroup = key;
      break;
    }
  }
  // マッチしたグループの処理
  if (matchedGroup) {
    return processBoardData(matchedGroup, args);
  } else {
    return "❌ 該当するグループが見つかりません。";
  }
}

function processBoardData(groupId, args) {
  let reply ="";  // 返信メッセージ

  // 日付、グループID、投稿グループ名、掲示板ID、ステータス、コメントのレコードをスプレッドシートに記録する
  const currentTime = getCurrentDateTime();
  const groupName = args[0].trim();
  const boardId = args[1].trim();
  const statusNo = args[2].trim();
  const comment = args.slice(3).map(line => line.trim()).join(" ");

  //数値チェック
  const num = Number(statusNo);
  if (!Number.isFinite(num)) {
    return "❌ エラー: ステータスは半角数字で書いてください。数値はマップの凡例参照";
  }

  let result = "未判定"; 
  // 掲示板IDをサーチしてデータを取得し、存在したらステータスを更新。コメントを追記
  const record = searchBoardAndGetRow(groupName, boardId)
  console.log("record:" + JSON.stringify(record, null, 2));
  if(record) {
    const updateRecord = updateBoardData(record, statusNo, comment, currentTime);
    console.log("updaterecord:" + JSON.stringify(updateRecord, null, 2));
    if(updateRecord) {
      // シートの該当行にデータを更新
      const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(BOARDDATA_SHEET_NAME);
      const row = updateRecord.rowNumber; // 行番号を取得
      const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

      // 各カラムにデータをセット
      for (const key in updateRecord.data) {
        const colIndex = headers.indexOf(key) + 1;  // ヘッダーと一致する列を取得
        if (colIndex > 0) {
          sheet.getRange(row, colIndex).setValue(updateRecord.data[key]);  // データを設定
        }
      }
      // データベース登録処理
      reply = `掲示板ID ${boardId} （${groupName}）のステータスを更新しました。値: ${statusNo}, コメント: ${comment}`;
      result = "成功"; 
    } else {
      reply = `掲示板ID ${boardId} （${groupName}）のデータの更新に失敗しました。`;
      result = "更新失敗";
    }
  }else {
    reply = `❌ ${boardId}は登録されていません。塗りつぶしマップを見て登録されている掲示板IDを確認してください。`;
    result = "登録なし";
  }
  // シートにログを追加
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(BOARDLOG_SHEET_NAME); // シートを取得
  const newRow = [currentTime, groupId, groupName, boardId, statusNo, comment, result, reply]; // 📌 追加するデータ
  sheet.appendRow(newRow); // 📌 最終行にデータを追加

  return reply;
}

function updateBoardData(record, statusNo, comment, currentTime) {

  record.data.status = statusNo
  record.data.lastupdate = currentTime

  // comment に追記
  record.data.comment = record.data.comment ? `${record.data.comment}, ${comment}` : comment;

  return record;  // recordを返す
}


function searchBoardAndGetRow(name, keyword) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(BOARDDATA_SHEET_NAME);
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
  const rowIndex = nameValues.findIndex((value, index) => value === name && keywordValues[index] === keyword);

  if (rowIndex === -1) {
    console.logconsole.log(`❌ "${name}" と "${keyword}" の組み合わせは見つかりませんでした`);
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
