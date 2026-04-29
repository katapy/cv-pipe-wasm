import { Box,Button, Container, Stack, Typography } from '@mui/material';
import React, { useRef } from 'react';

import { type ImageResult,useCvPipe } from './hooks/useCvPipe';

const App = () => {
  const { isReady, initImage, resetImage, applyGrayscale, applyResize } = useCvPipe();

  const sourceCanvasRef = useRef<HTMLCanvasElement>(null);
  const resultCanvasRef = useRef<HTMLCanvasElement>(null);

  // Canvasに結果を描画する共通関数
  const drawToCanvas = (canvas: HTMLCanvasElement | null, result: ImageResult | null) => {
    if (!canvas || !result) return;
    canvas.width = result.width;
    canvas.height = result.height;
    const ctx = canvas.getContext('2d');
    const imageData = new ImageData(
      new Uint8ClampedArray(result.rgba),
      result.width,
      result.height
    );
    ctx?.putImageData(imageData, 0, 0);
  };

  // 画像アップロード処理
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);

    const result = initImage(bytes);

    // アップロード時はSourceとResultの両方に描画
    drawToCanvas(sourceCanvasRef.current, result);
    drawToCanvas(resultCanvasRef.current, result);
  };

  // 個別処理のハンドラー
  const handleGrayScale = () => {
    console.time('Grayscale');
    const result = applyGrayscale();
    drawToCanvas(resultCanvasRef.current, result);
    console.timeEnd('Grayscale');
  };

  const handleResize = () => {
    console.time('Resize');
    const result = applyResize(0.5); // 50%縮小
    drawToCanvas(resultCanvasRef.current, result);
    console.timeEnd('Resize');
  };

  // 連携処理（チェーン）のハンドラー
  const handlePipeline = () => {
    console.time('Pipeline (Gray -> Resize)');
    applyGrayscale(); // まずグレースケール
    const result = applyResize(0.5); // 続けてリサイズ（ここで結果を受け取る）
    drawToCanvas(resultCanvasRef.current, result);
    console.timeEnd('Pipeline (Gray -> Resize)');
  };

  const handleReset = () => {
    const result = resetImage();
    drawToCanvas(resultCanvasRef.current, result);
  };

  return (
    <Container>
      <Typography variant="h4" sx={{ my: 4 }}>
        CV-Pipe WASM Dashboard
      </Typography>

      <Stack direction="row" spacing={2} sx={{ mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <Button variant="outlined" component="label" disabled={!isReady}>
          画像を読み込む
          <input type="file" accept="image/*" hidden onChange={handleImageUpload} />
        </Button>

        <Button variant="contained" disabled={!isReady} onClick={handleGrayScale}>
          グレースケール
        </Button>

        <Button variant="contained" color="secondary" disabled={!isReady} onClick={handleResize}>
          50%リサイズ
        </Button>

        {/* 連携処理ボタン */}
        <Button variant="contained" color="success" disabled={!isReady} onClick={handlePipeline}>
          グレースケール ＆ リサイズ
        </Button>

        {/* 元に戻すボタン */}
        <Button variant="text" color="error" disabled={!isReady} onClick={handleReset}>
          画像をリセット
        </Button>
      </Stack>

      <Stack direction="row" spacing={4} sx={{ alignItems: 'flex-start' }}>
        <Box sx={{ width: '50%' }}>
          <Typography variant="h6">Source (Original)</Typography>
          <canvas ref={sourceCanvasRef} style={{ maxWidth: '100%', border: '1px dashed #ccc' }} />
        </Box>
        <Box sx={{ width: '50%' }}>
          <Typography variant="h6">Result (Processed)</Typography>
          <canvas ref={resultCanvasRef} style={{ maxWidth: '100%', border: '1px solid #1976d2' }} />
        </Box>
      </Stack>
    </Container>
  );
};

export default App;
