このプロジェクトは `image` クレートをベースにした画像処理ライブラリです。WASM環境（ブラウザ）およびRustネイティブ環境の両方で利用可能です。

## プロジェクト構成

```text
src/
├── core/            # コアロジック（WASMに依存しない画像処理本体）
│   └── ops/         # 各種画像処理（カテゴリごとに分割）
├── wasm/            # WASM用バインディング（JS/TSからの呼び出し口）
└── ...
```

## 新しい画像処理を追加する方法

新しい画像処理（例: セピア変換、ぼかしなど）を追加するには、以下の2ステップの手順に従ってください。

### 1. コアロジックの実装 (`src/core/ops/`)
まず、Rust側で `CvProcessor` 構造体に対して処理を実装します。

1. **カテゴリの選択**:
    * 色に関する処理なら `src/core/ops/color.rs`
    * 変形・空間に関する処理なら `src/core/ops/spatial.rs`
    * 全く新しいカテゴリなら `src/core/ops/` 配下に新しいファイルを作成し、`mod.rs` に追加してください。

2. **関数の実装**:
    `CvProcessor` の `impl` ブロックにメソッドを追加します。

    ```rust
    // src/core/ops/color.rs など
    impl CvProcessor {
        pub fn to_sepia(&mut self) {
            console_log!("apply sepia filter");
            // imageクレート等を使った処理
            self.img = self.img.grayscale(); // 仮の処理
        }
    }
    ```

### 2. WASMインターフェースの追加 (`src/wasm/pipe_ops.rs`)
JS/TSから呼び出せるように、バインディング層にメソッドを追加します。

1. `src/wasm/pipe_ops.rs` を開き、以下の形式で関数を追加します。

    ```rust
    #[wasm_bindgen]
    impl CvPipe {
        pub fn apply_sepia(&mut self) {
            self.processor.to_sepia();
        }
    }
    ```

---

## 開発ガイドライン

* **関心の分離**:
    * `core` モジュールには `wasm_bindgen` や `JsValue` を直接持ち込まないでください。純粋なRustの処理として完結させます。
    * WASM用の型変換などは `wasm` モジュール内でのみ行います。

* **ログ出力**:
    * デバッグログを出力したい場合は、`macros.rs` で定義されている `console_log!` マクロを使用してください。

* **エラーハンドリング**:
    * 処理が失敗する可能性がある場合は、`Result` 型を使用して呼び出し元へエラーを伝播させてください。

## ビルド・テスト
```bash
# WebAssembly用ビルド
wasm-pack build --target web --out-dir ../cv-pipe-wasm-demo/src/pkg

# CLIでの動作確認
cargo run -- sample.jpg output.png

# Rustコアロジックのテスト
cargo test

# clippy 確認
cargo clippy -- -D warnings

# フォーマット確認
cargo fmt --check

# フォーマット設定
cargo fmt
```
