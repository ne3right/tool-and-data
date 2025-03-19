function processPostingData(groupId, args) {
  let reply ="";  // 返信メッセージ

  // 日付、グループID、投稿グループ名、住所、枚数、備考のレコードをスプレッドシートに記録する
  const currentTime = getCurrentDateTime();
  const groupName = args[0].trim();
  const addressText = args[1].trim();
  const leafsCount = args[2].trim();
  const note = args.slice(3).map(line => line.trim()).join(" ");
  console.log(`📌 グループid: ${groupId} 📌 グループ: ${groupName} 📌 住所: ${addressText} 📌 枚数: ${leafsCount} 📌 備考: ${note}`);

  //数値チェック
  const num = Number(leafsCount);
  if (!Number.isFinite(num)) {
    return "❌ エラー: ポスティング枚数は半角数字で書いてください";
  }

  let result = "未判定"; 
  // 住所サーチしてデータを取得し、あったら合計を計算して同じ行に書く
  const record = searchKeywordAndGetRow(addressText)
  console.log("record:" + JSON.stringify(record, null, 2));
  if(record) {
    const updateRecord = updateGroupData(record, groupId, note, leafsCount);
    console.log("updaterecord:" + JSON.stringify(updateRecord, null, 2));
    if(updateRecord) {
      // シートの該当行にデータを更新
      const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(DATA_SHEET_NAME);
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
      reply = `住所 ${addressText} （${groupId}）のデータを更新しました。値: ${updateRecord.data[groupId]}, 備考: ${note}`;
      result = "成功"; 
    } else {
      reply = `住所 ${addressText} （${groupId}）のデータの更新に失敗しました。`;
      result = "更新失敗";
    }
  }else {
    reply = `❌ ${addressText}は登録されていません。塗りつぶしマップを見て登録されている町名を確認してください。丁目は半角数字で書いてください。(1丁目など)\nまれにマップの住所データが古い場所もあります。`;
    result = "住所登録なし";
  }
  // シートにログを追加
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(LOG_SHEET_NAME); // シートを取得
  const newRow = [currentTime, groupId, groupName, addressText, leafsCount, note, result, reply]; // 📌 追加するデータ
  sheet.appendRow(newRow); // 📌 最終行にデータを追加

  return reply;
}

function updateGroupData(record, groupid, note, num) {
  // groupid が record.data に存在するか確認
  if (!record.data.hasOwnProperty(groupid)) {
    console.log(`❌ ${groupid} が record.data に存在しません`);
    return null;
  }
  const groupValue = record.data[groupid] === "" ? 0 : record.data[groupid]; // 空文字は0に変換
  record.data[groupid] = groupValue + Number(num);

  // groupid_note を更新
  const groupNoteKey = groupid + "_note";
  record.data[groupNoteKey] = note;

  // totalを更新

  const totalValue = record.data["total_posting"] === "" ? 0 : record.data["total_posting"]; // 空文字は0に変換
  record.data["total_posting"] = totalValue + Number(num);

  return record;  // recordを返す
}


function searchKeywordAndGetRow(keyword) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(DATA_SHEET_NAME);
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

  const columnIndex = 3; // 📌 C列（1ベース = 3）
  const columnValues = sheet.getRange(2, columnIndex, lastRow-1, 1).getValues().flat(); // 📌 C列のみ取得

  const rowIndex = columnValues.findIndex(value => value === keyword);
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



// 🟢 コマンド一覧map processing
function mapDataHandring(args) {
  // 1行目 = グループ名,2行目 = 住所, 3行目=枚数 4行目以降=メモ、備考
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
    return processPostingData(matchedGroup, args);
  } else {
    return "❌ 該当するグループが見つかりません。";
  }
}

function getGroupPatterns() {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName("GroupPatterns"); // シートを取得
  const data = sheet.getDataRange().getValues(); // 全データを取得
  const groupPatterns = {}; // 結果を格納するオブジェクト

  data.forEach(row => {
    const groupName = row[0]; // A列（グループ名）
    const keywords = row.slice(1).filter(item => item !== ""); // B列以降（キーワード）

    if (groupName && keywords.length > 0) {
      groupPatterns[groupName] = keywords;
    }
  });
  return groupPatterns;
}

function getCurrentDateTime() {
  return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy/MM/dd HH:mm:ss");
}