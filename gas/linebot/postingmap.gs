function processPostingData(groupId, groupName, spreadsheetId, postingDataSheetName, postingLogSheetName, args) {
  let reply ="";  // 返信メッセージ

  // 日付、グループID、投稿グループ名、住所、枚数、備考のレコードをスプレッドシートに記録する
  const currentTime = getCurrentDateTime();
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
    const area_name = record.data["area_name"]
    const subarea_name = record.data["subarea_name"]
    const addRow = [groupId, groupName, area_name, subarea_name, leafsCount, note]; // 実績値を追加
    // 個別ログシートにログを追加
    const dataSheet = SpreadsheetApp.openById(spreadsheetId).getSheetByName(postingDataSheetName);
    dataSheet.appendRow(addRow);

    // totalを更新
    const totalValue = record.data["total_posting"] === "" ? 0 : record.data["total_posting"]; // 空文字は0に変換
    record.data["total_posting"] = totalValue + Number(num);

    // シートの該当行にデータを更新
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(DATA_SHEET_NAME);
    const row = record.rowNumber; // 行番号を取得
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

    // 各カラムにデータをセット
    for (const key in record.data) {
      const colIndex = headers.indexOf(key) + 1;  // ヘッダーと一致する列を取得
      if (colIndex > 0) {
        sheet.getRange(row, colIndex).setValue(record.data[key]);  // データを設定
      }
    }
    // データベース登録処理
    reply = `住所 ${addressText} （${groupName}）のデータを更新しました。枚数: ${leafsCount},トータル枚数:${totalValue}→${record.data["total_posting"]} 備考: ${note}`;
    result = "成功"; 
  }else {
    reply = `❌ ${addressText}は登録されていません。塗りつぶしマップを見て登録されている町名を確認してください。丁目は半角数字で書いてください。(1丁目など)\nまれにマップの住所データが古い場所もあります。`;
    result = "住所登録なし";
  }

  const newRow = [currentTime, groupId, groupName, addressText, leafsCount, note, result, reply]; // 📌 追加するデータ
  // 統合ログシートにログを追加
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(LOG_SHEET_NAME); // シートを取得
  sheet.appendRow(newRow); // 📌 最終行にデータを追加

  // 個別ログシートにログを追加
  const logSheet = SpreadsheetApp.openById(spreadsheetId).getSheetByName(postingLogSheetName);
  logSheet.appendRow(newRow);

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
  const groupName = args[0].trim();

  // マスターシートの情報を取得
  const masterSheet = SpreadsheetApp.openById(MASTER_SPREADSHEET_ID).getSheetByName(MASTER_SHEET_NAME);
  const masterData = masterSheet.getDataRange().getValues();

  // ヘッダーを取得
  const groupIdCol = 0;
  const groupNameCol = 1;
  const spreadsheetIdCol = 2;
  const postingdataCol = 6;
  const postinglogCol = 7;

  // グループ名でマッチする行を探す
  const matchedRow = masterData.find((row, index) => index > 0 && row[groupNameCol] === groupName);
  if (!matchedRow) {
    return `❌ 該当するグループ「${groupName}」がマスターに見つかりません。`;
  }

  const groupId = matchedRow[groupIdCol];
  const spreadsheetId = matchedRow[spreadsheetIdCol];
  const postingDataSheetName = matchedRow[postingdataCol]; // signboardシート名
  const postingLogSheetName = matchedRow[postinglogCol];   // boardlogシート名

  return processPostingData(groupId, groupName, spreadsheetId, postingDataSheetName, postingLogSheetName, args);
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

function addressSearchHandring(args) {
  const addressText = args[0].trim();

  // 住所サーチしてデータを取得し、あったら合計を計算して同じ行に書く
  const list = searchKeywordByPrefix(addressText)
  console.log("list" + JSON.stringify(list, null, 2));
  if(list) {
    return `地名「${addressText}」を含む地名を検索しました。\n${list}\n20件以上は表示されません`;
  } else {
    return `❌ 該当する地名「${addressText}」がマスターに見つかりません。`;
  }
}

function searchKeywordByPrefix(keyword) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(DATA_SHEET_NAME);
  if (!sheet) {
    console.log("❌ 指定されたシートが見つかりません！");
    return null;
  }

  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) {
    console.log("❌ シートが空です。");
    return null;
  }

  const columnIndex = 3; // 📌 C列（1ベース = 3）
  const columnValues = sheet.getRange(2, columnIndex, lastRow - 1, 1).getValues().flat();

  // 部分一致する値だけ抽出（最大20件）
  const matchedValues = columnValues
    .filter(value => typeof value === 'string' && value.includes(keyword))
    .slice(0, 20);

  if (matchedValues.length === 0) {
    console.log(`❌ "${keyword}" に前方一致するデータが見つかりませんでした`);
    return null;
  }

  const resultText = matchedValues.join("\n");
  console.log(`✅ 検索結果:\n${resultText}`);
  return resultText;
}