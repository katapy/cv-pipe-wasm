use crate::core::CvProcessor;
use wasm_bindgen::prelude::*;

pub mod pipe_ops; // 処理の呼び出し部分を分割

#[wasm_bindgen]
pub struct CvPipe {
    pub(crate) processor: CvProcessor, // crate内からアクセスできるようにする
}

#[wasm_bindgen]
impl CvPipe {
    #[wasm_bindgen(constructor)]
    pub fn new(data: &[u8]) -> Result<CvPipe, JsValue> {
        match CvProcessor::from_bytes(data) {
            Ok(processor) => Ok(Self { processor }),
            Err(e) => Err(JsValue::from_str(&format!("Image decode error: {}", e))),
        }
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
