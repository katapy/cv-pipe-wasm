use super::CvPipe;
use js_sys::Float32Array;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
impl CvPipe {
    pub fn apply_grayscale(&mut self) {
        self.processor.to_gray();
    }

    pub fn apply_threshold(&mut self, threshold_value: u8) {
        self.processor.to_threshold(threshold_value)
    }

    pub fn apply_resize(&mut self, w: u32, h: u32) {
        self.processor.resize(w, h);
    }

    pub fn find_max_contour_points(&self) -> Vec<f32> {
        self.processor.find_max_contour_points()
    }

    pub fn apply_perspective(&mut self, src_flat: Float32Array, dst_flat: Float32Array) {
        let src = to_points(src_flat);
        let dst = to_points(dst_flat);

        self.processor.to_perspective(src, dst);
    }
}

fn to_points(arr: Float32Array) -> [(f32, f32); 4] {
    let v = arr.to_vec();
    [(v[0], v[1]), (v[2], v[3]), (v[4], v[5]), (v[6], v[7])]
}
