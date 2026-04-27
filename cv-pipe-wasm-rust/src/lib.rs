use wasm_bindgen::prelude::*;
use image::{ImageBuffer, Rgba, DynamicImage};
use image::imageops::FilterType;

#[wasm_bindgen]
pub struct CvPipe {
    data: Vec<u8>,
    width: u32,
    height: u32,
}

#[wasm_bindgen]
impl CvPipe {
    #[wasm_bindgen(constructor)]
    pub fn new(data: Vec<u8>, width: u32, height: u32) -> Self {
        Self { data, width, height }
    }

    // image クレートを使ったグレー化
    pub fn to_gray(&mut self) {
        // 1. self.data の所有権を一時的に奪う (メモリコピーを避けるための高速化テクニック)
        let raw_data = std::mem::take(&mut self.data);

        // 2. 1次元配列(Vec<u8>) から RgbaImage (ImageBuffer) を構築
        let img_buffer: ImageBuffer<Rgba<u8>, Vec<u8>> = 
            ImageBuffer::from_raw(self.width, self.height, raw_data)
                .expect("Failed to create ImageBuffer from raw data");

        // 3. DynamicImage に変換 (各種画像処理メソッドを呼び出しやすくするため)
        let dyn_img = DynamicImage::ImageRgba8(img_buffer);

        // 4. グレースケール化を実行し、RGBA形式に戻す
        // grayscale() は Luma（1チャンネル）を返すため、JSのCanvasで描画できるように
        // into_rgba8() で R, G, B が同じ値で A が保持された4チャンネル画像に変換します。
        let gray_rgba = dyn_img.grayscale().into_rgba8();

        // 5. 処理済みの Vec<u8> を self.data に書き戻す
        self.data = gray_rgba.into_raw();
    }

    pub fn resize(&mut self, new_width: u32, new_height: u32) {
        let raw_data = std::mem::take(&mut self.data);

        let img_buffer: ImageBuffer<Rgba<u8>, Vec<u8>> = 
            ImageBuffer::from_raw(self.width, self.height, raw_data)
                .expect("Failed to create ImageBuffer from raw data");

        let dyn_img = DynamicImage::ImageRgba8(img_buffer);

        // resize_exact: アスペクト比を無視して、強制的に指定サイズに変換します。
        // ※アスペクト比を維持したい場合は、dyn_img.resize(...) を使用しますが、
        // 戻り値のサイズが指定値と変わる可能性があるため、Canvasとの連携を考慮して
        // ここでは resize_exact を使用しています。
        // FilterType::Triangle は速度と品質のバランスが良い一般的なアルゴリズム(バイリニア相当)です。
        let resized_img = dyn_img.resize_exact(new_width, new_height, FilterType::Triangle);

        // RGBAの ImageBuffer に変換
        let resized_rgba = resized_img.into_rgba8();

        // 構造体の状態（データ、幅、高さ）を新しいものに更新する
        self.data = resized_rgba.into_raw();
        self.width = new_width;
        self.height = new_height;
    }

    pub fn get_data(&self) -> Vec<u8> {
        self.data.clone()
    }

    pub fn get_width(&self) -> u32 {
        self.width
    }

    pub fn get_height(&self) -> u32 {
        self.height
    }
}