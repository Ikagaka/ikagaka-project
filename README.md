# ikagaka-project

イカガカ関連コンポーネントをまとめて開発するLernaプロジェクト

## 必要

- node.js >= 8
- git

## インストール

最初にツールをインストール。
リポジトリのクローン（`npm run prepare`）も同時に行われます。

```bash
npm install
```

次に依存関係をインストールし初期ビルドを行います。（1GBくらいになる）

```bash
npm run bootstrap
```

## 開発

### ワークスペース

よく編集するであろうプロジェクトのワークスペースを `packages-common.code-workspace` にまとめてあるのでVisual Studio Codeでひらくと便利に編集できます。

### タスク

- npm run prepare: パッケージ群をgit clone
- npm run bootstrap: パッケージそれぞれの依存関係をインストールし、prepareスクリプトを走らせる
- npm run install:all: パッケージそれぞれの依存関係をインストール
- npm run prepare:all: パッケージそれぞれのprepareスクリプトを走らせる
- npm run pull:all: パッケージそれぞれでgit pullする

### 依存関係

依存関係を追加する際は [`lerna add`](https://github.com/lerna/lerna#add) を使って

```
lerna add shx --dev --scope shiorijk
```

などとしてください。

## License

This is released under [MIT License](https://narazaka.net/license/MIT?2018).
