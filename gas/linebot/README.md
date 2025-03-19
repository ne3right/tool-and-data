## 概要
* データを更新してくれるLINE Bot用のソース（Google Apps Script）
* 導入難易度がかなり高いため、ある程度のIT知識を必要とします
* 多重処理に耐えられるかどうかはわかりません

# 準備するもの
* Google スプレッドシート（の拡張機能）
* LINE Developersアカウント
* （あれば）Google Cloud Project（デバッグログを出力するために必要）
* line-bot-sdk-gas のライブラリ ( https://github.com/kobanyan/line-bot-sdk-gas )

# LINE BOTをどうにかして動かす
* LINE Botの作り方はネット上に沢山あるので参考にしてください。
* 公式アカウントに対してメッセージを送り、任意の返信を貰えるところまで頑張って自力でやってください。
* 私は下記ブログのスプレッドシートをそのままコピーして使わせてもらいました
https://qiita.com/cog1t0/items/cc7779345a01192d8f01

# スクリプト
* gas/linebot/内のスクリプトを上で動かしたLINEBOTに入れてください。
* config.gs のCHANNEL_ACCESS_TOKENにLINE BOTを動かすためのチャネルトークン値を入れてください。
* SPREADSHEET_IDはデータが登録されているスプレッドシートのIDを入れてください。
* シート名は任意のものを使用可能ですがフォーマットは固定です。

- const DATA_SHEET_NAME = "postingmapdata";  // ポスティングマップの下記データフォーマットを使用
https://github.com/ne3right/postingmap/blob/main/public/data/conquerlist.csv

- const BOARDDATA_SHEET_NAME = "signboard";  // 常設ポスターマップの下記データフォーマットを使用
https://github.com/ne3right/postingmap/blob/main/public/data/signboard.csv

- replymsg.gs は、１行目に書いたコマンドを読み取って判断を分岐させる部分です。
- 文面やコマンドをカスタマイズしてご自由にご利用ください。（2025/3/19時点未実装のものあり）