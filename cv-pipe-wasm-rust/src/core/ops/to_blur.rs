use crate::core::processor::CvProcessor;

impl CvProcessor {
    pub fn to_blur(&mut self, sigma: f32) {
        console_log!("start to blur");
        // imageクレートの DynamicImage には組み込みで blur メソッドが存在します
        self.img = self.img.blur(sigma);
    }
}
