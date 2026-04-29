use image::DynamicImage;
use image::imageops::FilterType;
#[cfg(target_arch = "wasm32")]
use wasm_bindgen::prelude::*;

#[cfg(target_arch = "wasm32")]
macro_rules! console_log {
    ($($t:tt)*) => {
        web_sys::console::log_1(&format!($($t)*).into());
    }
}
#[cfg(not(target_arch = "wasm32"))]
macro_rules! console_log {
    ($($t:tt)*) => {
        println!($($t)*);
    }
}

pub struct CvProcessor {
    pub img: DynamicImage,
}

impl CvProcessor {
    /// バイト列から画像を生成します。
    ///
    /// # Errors
    ///
    /// 渡された `data` がサポートされていない画像フォーマットの場合や、
    /// データが破損している場合に `image::ImageError` を返します。
    pub fn from_bytes(data: &[u8]) -> Result<Self, image::ImageError> {
        let img = image::load_from_memory(data)?;
        Ok(Self { img })
    }

    pub fn to_gray(&mut self) {
        console_log!("start to gray");
        self.img = self.img.grayscale();
    }

    pub fn resize(&mut self, w: u32, h: u32) {
        console_log!("start to resize");
        self.img = self.img.resize_exact(w, h, FilterType::Triangle);
    }
}

// ---------------------------
// WASM用ラッパー
// ---------------------------
#[cfg(target_arch = "wasm32")]
#[wasm_bindgen]
pub struct CvPipe {
    processor: CvProcessor,
}

#[cfg(target_arch = "wasm32")]
#[wasm_bindgen]
impl CvPipe {
    #[wasm_bindgen(constructor)]
    pub fn new(data: &[u8]) -> Result<CvPipe, JsValue> {
        match CvProcessor::from_bytes(data) {
            Ok(processor) => Ok(Self { processor }),
            Err(e) => Err(JsValue::from_str(&format!("Image decode error: {}", e))),
        }
    }

    pub fn apply_grayscale(&mut self) {
        self.processor.to_gray();
    }
    pub fn apply_resize(&mut self, w: u32, h: u32) {
        self.processor.resize(w, h);
    }

    pub fn get_rgba_data(&self) -> Vec<u8> {
        self.processor.img.to_rgba8().into_raw()
    }

    pub fn get_width(&self) -> u32 {
        self.processor.img.width()
    }
    pub fn get_height(&self) -> u32 {
        self.processor.img.height()
    }
}
