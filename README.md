# ITAKU BASE

委託先セキュリティ管理チェックシートシステムのデモプロトタイプです。

このリポジトリは Vite + React で作られており、GitHub Pages にデプロイすると、他の人が URL からすぐに開いて確認できます。

## URL で共有して見られるようにする方法（GitHub Pages）

このリポジトリは GitHub Pages（`https://a24z7km.github.io/itakubase/`）へ `gh-pages` ブランチで公開できるように設定しています。

> 404 が表示される場合は、まだ `gh-pages` ブランチへの公開が完了していないか、GitHub 側の Pages 設定が終わっていない状態です。以下の手順を実行してください。

### 前提

- Node.js がインストールされていること
- このリポジトリへの push 権限があること（`gh-pages` ブランチへ公開するため）

### 手順

1. 最新のコードを取得します。

   ```bash
   git clone https://github.com/a24z7km/itakubase.git
   cd itakubase
   # すでに clone 済みの場合は
   git pull origin main
   ```

2. 依存パッケージをインストールします。

   ```bash
   npm install
   ```

3. ビルドして GitHub Pages 用ブランチへ公開します。

   ```bash
   npm run deploy
   ```

   `predeploy` が自動で `npm run build` を実行し、生成された `dist/` を `gh-pages` ブランチへ push します。コマンドが最後まで成功すれば公開準備は完了です。

4. 初回のみ、GitHub 側で Pages の公開元を設定します。

   1. GitHub のリポジトリ画面で **Settings** を開く
   2. 左メニューの **Pages** を開く
   3. **Build and deployment** の **Source** を **Deploy from a branch** にする
   4. **Branch** を `gh-pages` / `(root)` にして保存する

5. 数分後、以下の URL でアプリを開けます。

   ```text
   https://a24z7km.github.io/itakubase/
   ```

この URL を共有すると、他の人もブラウザですぐに開けます。

## 設定の仕組み

- `package.json`
  - `homepage`: 公開先 URL
  - `predeploy`: `npm run deploy` の前に本番ビルドを実行
  - `deploy`: `scripts/deploy-gh-pages.mjs` で `dist/` を `gh-pages` ブランチへ公開
- `scripts/deploy-gh-pages.mjs`
  - `dist/` の内容を `gh-pages` ブランチへ push する公開用スクリプト
- `vite.config.ts`
  - `base: './'`: `/itakubase/` のようなサブディレクトリ配下でも CSS/JS を相対パスで正しく読み込むための設定

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
