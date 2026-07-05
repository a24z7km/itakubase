# ITAKU BASE

委託先セキュリティ管理チェックシートシステムのデモプロトタイプです。

## 公開 URL

以下の URL から、他の人もブラウザで ITAKU BASE を開けます。

```text
https://a24z7km.github.io/itakubase/
```

共有するときは、上記 URL をそのまま送ってください。

## URL で共有して見られるようにする方法（GitHub Pages）

このリポジトリは GitHub Pages に自動デプロイされる設定になっています。
`main` ブランチに変更を push すると、GitHub Actions がアプリをビルドして公開 URL を更新します。

### 公開・更新手順

1. 変更を GitHub の `main` ブランチに push します。

   ```bash
   git push origin main
   ```

2. GitHub の **Actions** タブで、`Deploy to GitHub Pages` ワークフローが成功するまで待ちます。

3. 成功後、次の公開 URL を開いて表示を確認します。

   ```text
   https://a24z7km.github.io/itakubase/
   ```

### 初回だけ必要な GitHub Pages 設定

まだ GitHub Pages を有効化していない場合は、リポジトリ画面で以下を設定してください。

1. **Settings** を開く
2. 左メニューの **Pages** を開く
3. **Build and deployment** の **Source** で **GitHub Actions** を選択する

設定後に `main` ブランチへ push すると、自動デプロイが実行されます。
この設定が未完了の場合、Actions の **Configure Pages** ステップで
`Get Pages site failed` / `Not Found` エラーになります。

## ローカルで動かす方法

**Prerequisites:** Node.js

1. 依存関係をインストールします。

   ```bash
   npm install
   ```

2. 必要に応じて `.env.local` を作成し、Gemini API キーを設定します。

   ```bash
   cp .env.example .env.local
   ```

3. 開発サーバーを起動します。

   ```bash
   npm run dev
   ```

4. ブラウザで次の URL を開きます。

   ```text
   http://localhost:3000
   ```

## ビルド確認

本番配信用のファイルを生成するには、次を実行します。

```bash
npm run build
```

生成物は `dist/` に出力されます。
