use cv_pipe_wasm::CvPipe;
use image::{GenericImageView, RgbaImage};
use std::env;

fn main() {
    // コマンドライン引数を取得
    let args: Vec<String> = env::args().collect();
    if args.len() < 3 {
        eprintln!("使い方: {} <入力画像パス> <出力画像パス>", args[0]);
        std::process::exit(1);
    }

    let input_path = &args[1];
    let output_path = &args[2];

    println!("画像を読み込んでいます: {}", input_path);

    // 1. 画像ファイルを読み込み
    let img = image::open(input_path).expect("画像の読み込みに失敗しました");
    let (width, height) = img.dimensions();

    // 2. 画像を RGBA の一次元配列 (Vec<u8>) に変換
    let rgba_data = img.to_rgba8().into_raw();

    // 3. CvPipe にデータを渡して処理
    let mut pipe = CvPipe::new(rgba_data, width, height);
    pipe.to_gray();

    // 4. 処理結果を取得
    let processed_data = pipe.get_data();

    // 5. バイト配列を再び画像フォーマットに戻して保存
    let out_img = RgbaImage::from_raw(width, height, processed_data)
        .expect("出力用画像バッファの作成に失敗しました");
    
    out_img.save(output_path).expect("画像の保存に失敗しました");

    println!("処理が完了し、{} に保存しました。", output_path);
}