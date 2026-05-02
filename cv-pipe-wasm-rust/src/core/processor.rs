use image::DynamicImage;

pub struct CvProcessor {
    pub img: DynamicImage,
}

impl CvProcessor {
    /// バイト列から画像をデコードして `CvProcessor` インスタンスを生成します。
    ///
    /// # Arguments
    ///
    /// - `data` - 画像データを含むバイトスライス。サポートされているフォーマット（PNG, JPEG, GIFなど）である必要があります。
    ///
    /// # Returns
    ///
    /// - `Ok(CvProcessor)` - 正常にデコードされた画像を持つインスタンス。
    /// - `Err(image::ImageError)` - デコードに失敗した場合のエラー情報。
    ///
    /// # Errors
    ///
    /// 渡された `data` が空の場合、未サポートのフォーマットである場合、またはデータが破損している場合に `image::ImageError` を返します。
    ///
    /// # Examples
    ///
    /// ```
    /// // ignore: 画像ファイルの実データがないため、実行せずコンパイルのみチェックする
    /// use cv_pipe_wasm::core::CvProcessor;;
    ///
    /// let data = include_bytes!("../../sample.jpg");
    /// let processor = CvProcessor::from_bytes(&data[..]).expect("画像データの読み込みに失敗しました");
    /// ```
    pub fn from_bytes(data: &[u8]) -> Result<Self, image::ImageError> {
        let img = image::load_from_memory(data)?;
        Ok(Self { img })
    }
}
