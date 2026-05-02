use cv_pipe_wasm::core::CvProcessor;
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
    let data = fs::read(input_path).expect("ファイルの読み込みに失敗しました");

    // 2. プロセッサーの初期化
    // - processor: 最後に射影変換を行って保存するための綺麗なオリジナル画像
    // - analysis_processor: 輪郭を正確に見つけるための解析用画像
    let mut processor = CvProcessor::from_bytes(&data).expect("画像のデコードに失敗しました");
    let mut analysis_processor = CvProcessor::from_bytes(&data).expect("画像のデコードに失敗しました");

    // ----------------------------------------------------
    // [Step 1] 解析用画像で輪郭を抽出する
    // ----------------------------------------------------
    println!("画像を解析中...");
    
    // ノイズ除去（ぼかし） -> グレースケール -> Cannyエッジ検出
    analysis_processor.to_blur(1.5);
    analysis_processor.to_gray();
    analysis_processor.to_canny(50.0, 150.0);

    // 最大輪郭から4つの角の座標を取得 (前回修正したメソッド)
    let src_points_flat = analysis_processor.find_max_contour_points();

    if src_points_flat.len() != 8 {
        eprintln!("エラー: 対象の書類の輪郭が見つかりませんでした。");
        std::process::exit(1);
    }

    // ----------------------------------------------------
    // [Step 2] 抽出した座標の計算
    // ----------------------------------------------------
    // Reactの [tl_x, tl_y, tr_x, tr_y, br_x, br_y, bl_x, bl_y] と同じ順序
    let tl = (src_points_flat[0], src_points_flat[1]); // 左上 (Top-Left)
    let tr = (src_points_flat[2], src_points_flat[3]); // 右上 (Top-Right)
    let br = (src_points_flat[4], src_points_flat[5]); // 右下 (Bottom-Right)
    let bl = (src_points_flat[6], src_points_flat[7]); // 左下 (Bottom-Left)

    let src = [tl, tr, br, bl];

    // Reactアプリと同じく、切り出し後の「出力画像の幅と高さ」をピタゴラスの定理で計算
    let width_a = ((br.0 - bl.0).powi(2) + (br.1 - bl.1).powi(2)).sqrt();
    let width_b = ((tr.0 - tl.0).powi(2) + (tr.1 - tl.1).powi(2)).sqrt();
    let max_width = width_a.max(width_b);

    let height_a = ((tr.0 - br.0).powi(2) + (tr.1 - br.1).powi(2)).sqrt();
    let height_b = ((tl.0 - bl.0).powi(2) + (tl.1 - bl.1).powi(2)).sqrt();
    let max_height = height_a.max(height_b);

    // 変換先の長方形の座標 (左上, 右上, 右下, 左下)
    let dst = [
        (0.0, 0.0),                     // 左上
        (max_width, 0.0),               // 右上
        (max_width, max_height),        // 右下
        (0.0, max_height),              // 左下
    ];

    println!("切り出しサイズ: 幅 {} x 高さ {}", max_width as u32, max_height as u32);

    // ----------------------------------------------------
    // [Step 3] オリジナル画像に対して射影変換（パースペクティブ補正）を実行
    // ----------------------------------------------------
    processor.to_perspective(src, dst);

    // 4. 保存
    processor
        .img
        .save(output_path)
        .expect("画像の保存に失敗しました");

    println!("スキャン完了: {output_path}");
}