use wasm_bindgen::prelude::*;
use image::{DynamicImage, ImageBuffer, Rgba, RgbaImage};
use image::imageops::FilterType;
#[cfg(target_arch = "wasm32")]
use wasm_bindgen::prelude::*;

macro_rules! console_log {
    ($($t:tt)*) => {
        #[cfg(target_arch = "wasm32")]
        {
            web_sys::console::log_1(&format!($($t)*).into());
        }
        #[cfg(not(target_arch = "wasm32"))]
        {
            println!($($t)*); // CLIでは標準出力を使う
        }
    }
}

pub struct CvProcessor {
    pub img: DynamicImage,
}

impl CvProcessor {
    pub fn new(data: Vec<u8>, width: u32, height: u32) -> Self {
        let buffer = RgbaImage::from_raw(width, height, data).expect("Buffer creation failed");
        Self { img: DynamicImage::ImageRgba8(buffer) }
    }

    // 共通の処理ロジック
    pub fn to_gray(&mut self) {
        console_log!("start to gray");
        self.img = self.img.grayscale();
    }

    pub fn resize(&mut self, w: u32, h: u32) {
        console_log!("start to resize");
        self.img = self.img.resize_exact(w, h, FilterType::Triangle);
    }
}

#[cfg(target_arch = "wasm32")]
#[wasm_bindgen]
pub struct CvPipe {
    processor: CvProcessor,
}

#[cfg(target_arch = "wasm32")]
#[wasm_bindgen]
impl CvPipe {
    #[wasm_bindgen(constructor)]
    pub fn new(data: Vec<u8>, width: u32, height: u32) -> Self {
        let img = image::load_from_memory_with_format(
            &data, image::ImageFormat::Png // もしくは適宜フォーマット指定
        ).unwrap_or_else(|_| {
            let buffer = ImageBuffer::<Rgba<u8>, Vec<u8>>::from_raw(width, height, data).unwrap();
            DynamicImage::ImageRgba8(buffer)
        });
        Self { processor: CvProcessor { img } }
    }

    pub fn apply_grayscale(&mut self) { self.processor.to_gray(); }
    pub fn apply_resize(&mut self, w: u32, h: u32) { self.processor.resize(w, h); }

    // データ取得を単純化: JS側でImageData作成の手間を減らすために
    pub fn get_rgba_data(&self) -> Vec<u8> {
        self.processor.img.to_rgba8().into_raw()
    }

    pub fn get_width(&self) -> u32 { self.processor.img.width() }
    pub fn get_height(&self) -> u32 { self.processor.img.height() }
}