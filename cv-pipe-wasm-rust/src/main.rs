use cv_pipe_wasm::CvProcessor; // lib.rsから共通ロジックをインポート
use image::GenericImageView;
use std::env;

fn main() {
    let args: Vec<String> = env::args().collect();
    if args.len() < 3 {
        eprintln!("使い方: {} <入力パス> <出力パス>", args[0]);
        std::process::exit(1);
    }

    // 1. 画像読み込み
    let img = image::open(&args[1]).expect("読み込み失敗");
    let (width, height) = img.dimensions();
    let rgba_data = img.to_rgba8().into_raw();

    // 2. 処理ロジックの利用
    let mut processor = CvProcessor::new(rgba_data, width, height);
    
    // 自由にロジックを呼べる
    processor.to_gray();
    processor.resize(width / 2, height / 2);

    // 3. 保存
    processor.img.save(&args[2]).expect("保存失敗");
    println!("完了: {}", args[2]);
}