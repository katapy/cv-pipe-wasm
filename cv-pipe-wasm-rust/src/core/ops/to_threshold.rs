use crate::core::processor::CvProcessor;
use imageproc::contrast::threshold;

impl CvProcessor {
    pub fn to_threshold(&mut self, threshold_value: u8) {
        console_log!("start to threshold");
        let gray = self.img.to_luma8();
        // 簡易二値化
        self.img = image::DynamicImage::ImageLuma8(threshold(&gray, threshold_value));
    }
}
