use crate::core::CvProcessor;
use imageproc::contours::find_contours;

impl CvProcessor {
    #[must_use]
    #[allow(clippy::cast_precision_loss)]
    pub fn find_max_contour_points(&self) -> Vec<f32> {
        let gray = self.img.to_luma8();
        // 輪郭を抽出
        let contours = find_contours::<i32>(&gray);

        // 要素数（ピクセル数）が最大の輪郭を見つける
        let max_contour: Option<&imageproc::contours::Contour<i32>> =
            contours.iter().max_by_key(|c| c.points.len());

        if let Some(contour) = max_contour {
            let points = &contour.points;
            if points.is_empty() {
                return vec![];
            }

            // 【対策】数千のピクセルから、四角形の「4つの頂点」だけを見つけ出す
            // 1. Top-Left (左上):     x + y が最小
            // 2. Bottom-Right (右下): x + y が最大
            // 3. Top-Right (右上):    x - y が最大
            // 4. Bottom-Left (左下):  x - y が最小

            let mut tl: &imageproc::point::Point<i32> = &points[0];
            let mut br: &imageproc::point::Point<i32> = &points[0];
            let mut tr: &imageproc::point::Point<i32> = &points[0];
            let mut bl: &imageproc::point::Point<i32> = &points[0];

            for p in points {
                if (p.x + p.y) < (tl.x + tl.y) {
                    tl = p;
                }
                if (p.x + p.y) > (br.x + br.y) {
                    br = p;
                }
                if (p.x - p.y) > (tr.x - tr.y) {
                    tr = p;
                }
                if (p.x - p.y) < (bl.x - bl.y) {
                    bl = p;
                }
            }

            // React側の applyPerspective が期待する順番で返す
            // [左上x, 左上y, 右上x, 右上y, 右下x, 右下y, 左下x, 左下y]
            vec![
                tl.x as f32,
                tl.y as f32,
                tr.x as f32,
                tr.y as f32,
                br.x as f32,
                br.y as f32,
                bl.x as f32,
                bl.y as f32,
            ]
        } else {
            vec![] // 輪郭が見つからなかった場合
        }
    }
}
