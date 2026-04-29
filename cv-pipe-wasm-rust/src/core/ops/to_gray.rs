use crate::core::processor::CvProcessor;

impl CvProcessor {
    pub fn to_gray(&mut self) {
        console_log!("start to gray");
        self.img = self.img.grayscale();
    }
}
