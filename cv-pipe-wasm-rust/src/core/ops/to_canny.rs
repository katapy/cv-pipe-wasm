use crate::core::processor::CvProcessor;
use imageproc::edges::canny;

impl CvProcessor {
    pub fn to_canny(&mut self, low_threshold: f32, high_threshold: f32) {
        console_log!("start to canny");
        let gray = self.img.to_luma8();

        let edges = canny(&gray, low_threshold, high_threshold);

        // 結果の画像（線画）を元の変数に書き戻す
        self.img = image::DynamicImage::ImageLuma8(edges);
    }
}
