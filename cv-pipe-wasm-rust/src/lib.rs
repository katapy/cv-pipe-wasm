use wasm_bindgen::prelude::*;
use image::{ImageBuffer, Rgba, DynamicImage};

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

    pub fn get_data(&self) -> Vec<u8> {
        self.data.clone()
    }
}