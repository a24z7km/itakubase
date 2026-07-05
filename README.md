# ITAKU BASE

委託先セキュリティ管理チェックシートシステムのデモプロトタイプです。

このリポジトリは Vite + React で作られており、GitHub Pages にデプロイすると、他の人が URL からすぐに開いて確認できます。

## URL で共有して見られるようにする方法（GitHub Pages）

このリポジトリには、GitHub Pages へ自動デプロイするための GitHub Actions ワークフローを追加しています。

### 1. GitHub に push する

変更を GitHub の `main` ブランチに push します。

```bash
git push origin main
```

### 2. GitHub Pages の公開元を設定する

GitHub リポジトリ画面で以下を設定します。

1. **Settings** を開く
2. 左メニューの **Pages** を開く
3. **Build and deployment** の **Source** で **GitHub Actions** を選択する

### 3. デプロイ完了を待つ

`main` ブランチへ push すると、`.github/workflows/deploy-pages.yml` が実行されます。

進捗は GitHub の **Actions** タブから確認できます。成功すると、Pages の公開 URL が表示されます。

公開 URL は通常、次の形式になります。

```text
https://<GitHubユーザー名>.github.io/<リポジトリ名>/
```

例：

```text
https://a24z7km.github.io/itakubase/
```

この URL を共有すると、他の人もブラウザですぐに開けます。

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

## GitHub Pages が 404 のときの手動公開

GitHub Pages の画面で 404 が出る場合は、まだ公開用の `gh-pages` ブランチが作成されていない可能性があります。その場合は、以下を実行して `dist/` を `gh-pages` ブランチへ公開してください。

```bash
npm install
npm run deploy
```

その後、GitHub の **Settings** → **Pages** で **Source** を **Deploy from a branch**、**Branch** を `gh-pages` / `(root)` に設定します。数分後に `https://a24z7km.github.io/itakubase/` で開けます。
