use cv_pipe_wasm::CvProcessor;
use std::env;
use std::fs;

fn main() {
    let args: Vec<String> = env::args().collect();
    if args.len() < 3 {
        eprintln!("使い方: {} <入力パス> <出力パス>", args[0]);
        std::process::exit(1);
    }

    let input_path = &args[1];
    let output_path = &args[2];

    // 1. 画像ファイルを「生のバイナリデータ(Vec<u8>)」として読み込む
    // （image::open ではなく標準ライブラリの fs::read を使用します）
    let data = fs::read(input_path).expect("ファイルの読み込みに失敗しました");

    // 2. 処理ロジックの初期化（WASM側と全く同じ from_bytes を使用）
    let mut processor = CvProcessor::from_bytes(&data).expect("画像のデコードに失敗しました");
    
    // 現在の画像の幅と高さを取得する
    let width = processor.img.width();
    let height = processor.img.height();

    // 3. 画像処理ロジックの適用
    processor.to_gray();
    processor.resize(width / 2, height / 2);

    // 4. 保存
    processor.img.save(output_path).expect("画像の保存に失敗しました");
    
    println!("完了: {}", output_path);
}