# tool-and-data
## 概要
* [takahiroannno2024/postermap](https://github.com/takahiroanno2024/poster-map/)や[ne3right/postingmap](https://github.com/ne3right/postingmap/)を使うために必要なツールやデータです
* オープンデータが公開されている自治体のものは積極的にデータ化していきたいと考えております。

## ライセンスについて
* GPL-3.0 licenseを守ってご利用ください。

## ツール
* 
- [gas/getcsv](gas/getcsv): シート名を指定してスプレッドシートからcsvをダウンロードするツール
- [gas/geocoding](gas/geocoding): スプレッドシートに登録した住所から位置情報を算出するツール（掲示板のピンマップ作成に使う）（要Google Cloud契約）
- [gas/linebot](gas/linebot): postingmap,postermapで使う活動報告用Linebot(要公式アカウント)

## データ
* 各県ごとのデータをpublic/data以下にそのままフォルダごと貼り付けて使用。
```
dataset
 └kanagawa
  └public
   └data
 └saitama
  └public
   └data
```

## データ整備状況

| 都道府県名 | ポスティングマップ |選挙ポスター |不在者投票所 |
|------|------|------|------|
|東京都 | ソースコード参照 |安野チームデータ参照 |安野チームデータ参照 |
|神奈川県 | 運用中 |某陣営で作成予定|なし|
|熊本県 | テストサイトあり |なし|なし|
|香川県 | テストサイトあり |なし|なし|
|埼玉県 | 準備中 |なし|なし|
|大阪府 | 準備中 |なし|なし|

* ポスティングマップについてはツールで自動抽出した住所データをテストサイトにて公開しておりますが、ツールの出来がいまいちで抜けているエリアがしばしばあります。
