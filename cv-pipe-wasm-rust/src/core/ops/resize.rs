use crate::core::processor::CvProcessor;
use image::imageops::FilterType;

impl CvProcessor {
    pub fn resize(&mut self, w: u32, h: u32) {
        console_log!("start to resize");
        self.img = self.img.resize_exact(w, h, FilterType::Triangle);
    }
}
