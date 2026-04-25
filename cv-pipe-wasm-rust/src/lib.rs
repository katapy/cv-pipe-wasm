use wasm_bindgen::prelude::*;

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

    // グレー化
    pub fn to_gray(&mut self) {
        for chunk in self.data.chunks_mut(4) {
            let r = chunk[0] as f32;
            let g = chunk[1] as f32;
            let b = chunk[2] as f32;
            
            // グレースケールの計算
            let gray = (0.299 * r + 0.587 * g + 0.114 * b) as u8;
            
            // R, G, B を同じ値にするとグレーに見える
            chunk[0] = gray;
            chunk[1] = gray;
            chunk[2] = gray;
            // chunk[3] は Alpha（透明度）なのでそのまま維持する
        }
    }

    pub fn get_data(&self) -> Vec<u8> {
        self.data.clone()
    }
}