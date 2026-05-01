use crate::core::CvProcessor;
use imageproc::contours::find_contours;

impl CvProcessor {
    #[must_use]
    #[allow(clippy::cast_precision_loss)]
    pub fn find_max_contour_points(&self) -> Vec<f32> {
        let gray = self.img.to_luma8();
        let contours = find_contours::<i32>(&gray);

        contours
            .iter()
            .max_by_key(|c| c.points.len())
            .map(|c| {
                c.points
                    .iter()
                    .flat_map(|p| vec![p.x as f32, p.y as f32])
                    .collect()
            })
            .unwrap_or_default()
    }
}
