use crate::core::CvProcessor;
use image::{DynamicImage, GenericImageView};
use imageproc::geometric_transformations::{Interpolation, Projection, warp};

impl CvProcessor {
    /// Describe this function.
    ///
    /// 射影変換を実行する
    ///
    /// # Arguments
    ///
    /// - `&mut self` (`undefined`) - Describe this parameter.
    /// - `src_points`: 元画像の4隅の座標 (x, y)
    /// - `dst_points`: 変換後の長方形の4隅の座標 (x, y)
    ///
    /// # Examples
    ///
    /// ```
    /// use cv_pipe_wasm::core::CvProcessor;
    ///
    /// // 実際は初期化したCvProcessorインスタンスを使用します
    /// // let mut processor = CvProcessor::from_bytes(data).unwrap();
    /// // processor.apply_perspective(...);
    /// ```
    ///
    /// # Panics
    ///
    /// 変換行列の計算に失敗した場合にパニックします。
    /// （例: 4点が同一線上に並んでいる場合など）
    pub fn to_perspective(&mut self, src_points: [(f32, f32); 4], dst_points: [(f32, f32); 4]) {
        // 射影行列の計算
        let projection = Projection::from_control_points(src_points, dst_points)
            .expect("射影行列の計算に失敗しました");

        let (_width, _height) = self.img.dimensions();

        // 射影変換の適用
        self.img = DynamicImage::ImageRgba8(warp(
            &self.img.to_rgba8(),
            &projection,
            Interpolation::Bilinear,
            image::Rgba([0, 0, 0, 0]),
        ));
    }
}
