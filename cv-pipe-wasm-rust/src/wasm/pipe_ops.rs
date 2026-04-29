use super::CvPipe;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
impl CvPipe {
    pub fn apply_grayscale(&mut self) {
        self.processor.to_gray();
    }

    pub fn apply_resize(&mut self, w: u32, h: u32) {
        self.processor.resize(w, h);
    }
}
