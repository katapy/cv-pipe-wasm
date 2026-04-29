use image::DynamicImage;

pub struct CvProcessor {
    pub img: DynamicImage,
}

impl CvProcessor {
    pub fn from_bytes(data: &[u8]) -> Result<Self, image::ImageError> {
        let img = image::load_from_memory(data)?;
        Ok(Self { img })
    }
}
