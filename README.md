# 勤務収入トラッカー (GitHub Pages + Firebase)

スマホ表示をメインにした、勤務入力と月一覧の2画面アプリです。
Googleログインでユーザごとにデータを分離して保存します。

## 画面

- `index.html`: 日次入力画面
  - 開始/終了（hh:mm）、休憩、時給を入力
  - 実働時間と日収を自動計算して表示
- `monthly.html`: 月一覧画面
  - 対象月を選択
  - その月の勤務一覧、実働合計、月収を自動計算して表示

## 構成

- UI: `index.html`, `monthly.html`, `style.css`
- ロジック: `app.js`, `monthly.js`, `firebase-client.js`
- 認証: Firebase Authentication (Google)
- データ保存: Cloud Firestore
- 公開: GitHub Pages

## 1. Firebaseプロジェクト作成

1. [Firebase Console](https://console.firebase.google.com/) で新規プロジェクトを作成
2. Authentication -> Sign-in method -> `Google` を有効化
3. Firestore Database を作成
4. Project settings -> Your apps で Webアプリを追加し、設定値を取得

## 2. 設定ファイル作成

1. `firebase-config.example.js` をコピーして `firebase-config.js` を作成
2. `firebase-config.js` の `YOUR_...` を設定値に置き換え

## 3. Firestore ルール設定

```txt
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;

      match /entries/{entryId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}
```

## 4. Auth の許可ドメイン

Authentication -> Settings -> Authorized domains に以下を追加:

- `localhost`
- `YOUR_NAME.github.io`

## 5. ローカル確認

```powershell
npx serve .
```

- 入力画面: `http://localhost:3000/index.html`
- 月一覧: `http://localhost:3000/monthly.html`

または、同梱のバッチで自動起動できます。

```bat
run-local-check.bat
```

- `npx serve . -l 3000` を起動
- `index.html` と `monthly.html` を自動でブラウザ表示

## 6. GitHub Pages 公開

1. リポジトリへ push
2. GitHub `Settings -> Pages`
3. Source: `Deploy from a branch`
4. Branch: `main` / folder: `/ (root)`
5. `https://YOUR_NAME.github.io/REPO_NAME/` にアクセス

## 補足

- Web用 Firebase 設定値は公開前提の情報です。
- 月一覧画面は月単位でクエリして読み取り量を抑えています。
