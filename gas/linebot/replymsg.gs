// ぴょん活スタート：コマンド一覧を表示
// 使い方：マニュアル表示
// 地図：マップURLを表示
// ぴょん活報告：ぴょん活報告を行うコマンド

// 命令の定義（1行目）
const COMMANDS = {
  "ぴょん活スタート": handleStart,
  "使い方": handleManual,
  "地図": handleMap,
  "ぴょん活報告": handlePosting,
  "掲示板報告": handleBoard,
  "掲示板メンテ": handleBoardMente,
  "ポスター報告": handlePoster
};

// ポスティングマップ塗りつぶしコマンド
function handlePosting(args) {
  if (args.length === 0 || args[0].trim() === "") {
    return "⚠️ 空のメッセージです。\nぴょん活報告\nグループ名(必須)\n住所(必須)\n枚数(必須)\n備考（任意）\nを改行で区切ってメッセージを送ってください";
  }
  const messages = mapDataHandring(args);
  console.log("📌 messages:"+ messages);
  return messages;
}

// 掲示板報告
function handleBoard(args) {
  if (args.length === 0 || args[0].trim() === "") {
    return "⚠️ 空のメッセージです。\n掲示板報告\nグループ名(必須)\n掲示板ID\nステータス\nコメント（任意）\nを改行で区切ってメッセージを送ってください";
  }
  const messages = boardDataHandring(args);
  console.log("📌 messages:"+ messages);
  return messages;
}

// 掲示板報告
function handleBoardMente(args) {
  if (args.length === 0 || args[0].trim() === "") {
    return "⚠️ 空のメッセージです。\n掲示板報告\nグループ名(必須)\n掲示板ID\nステータス\nコメント（任意）\nを改行で区切ってメッセージを送ってください";
  }
  const messages = boardDataHandring(args);
  console.log("📌 messages:"+ messages);
  return messages;
}

// 掲示板報告
function handlePoster(args) {
  if (args.length === 0 || args[0].trim() === "") {
    return "⚠️ 空のメッセージです。\n掲示板報告\nグループ名(必須)\n掲示板ID\nステータス\nコメント（任意）\nを改行で区切ってメッセージを送ってください";
  }
  const messages = boardDataHandring(args);
  console.log("📌 messages:"+ messages);
  return messages;
}


// 🟢 コマンド一覧
function handleStart(args) {
  return "✨利用できるコマンド一覧✨\n"
       + "ぴょん活報告\n"
       + "使い方\n"
       + "ポスターマップ (まだうごいてません)\n"
       + "地図\n\n"
       + "メッセージの1行目にコマンドを書いておくってください\n\n"
       + "詳しくはマニュアルページをご覧ください\n"
       + "https://---/";
}

function handleManual(args) {
  return "📌 使い方マニュアル:\n"
       + "ぴょん活報告\n"
       + "このコマンドでポスティングの報告ができます。\n"
       + "LINEのメッセージに次のように書いて送ってね\n"
       + "------------------------------------\n"
       + "ぴょん活報告\n"
       + "ぴょん活\n"
       + "横浜市西区みなとみらい1丁目\n"
       + "500\n"
       + "マンション○△に投函済み\n"
       + "------------------------------------\n"
       + "詳しくはマニュアルページをご覧ください\n"
       + "https://---/";
}

function handleMap(args) {
  return "🐰ぴょん活報告map🐰\n"
       + "https://---/";
}

