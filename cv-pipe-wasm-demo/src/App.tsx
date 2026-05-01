import { Box, Button, Container, Divider, Grid, Paper, Stack, Typography } from '@mui/material';
import React, { useRef } from 'react';

import { type ImageResult, useCvPipe } from './hooks/useCvPipe';

const App = () => {
  const {
    isReady,
    initImage,
    resetImage,
    applyGrayscale,
    applyThreshold,
    applyBlur,
    applyCanny,
    findMaxContourPoints,
    applyPerspective,
  } = useCvPipe();

  const sourceCanvasRef = useRef<HTMLCanvasElement>(null);
  const resultCanvasRef = useRef<HTMLCanvasElement>(null);

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

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const buffer = await file.arrayBuffer();
    const result = initImage(new Uint8Array(buffer));
    drawToCanvas(sourceCanvasRef.current, result);
    drawToCanvas(resultCanvasRef.current, result);
  };

  const executeProcess = (name: string, processFn: () => ImageResult | null) => {
    console.time(name);
    const result = processFn();
    drawToCanvas(resultCanvasRef.current, result);
    console.timeEnd(name);
  };

  const handleDrawContour = () => {
    console.time('Find Contour');
    const points = findMaxContourPoints();
    console.timeEnd('Find Contour');

    if (!points || points.length !== 8) {
      alert('輪郭が見つかりませんでした。');
      return;
    }

    const canvas = resultCanvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    ctx.beginPath();
    ctx.moveTo(points[0], points[1]);
    ctx.lineTo(points[2], points[3]);
    ctx.lineTo(points[4], points[5]);
    ctx.lineTo(points[6], points[7]);
    ctx.closePath();
    ctx.lineWidth = 4;
    ctx.strokeStyle = 'red';
    ctx.stroke();
  };

  // 従来の Threshold（2値化）を使ったスキャン
  const handlePerspectiveScan = () => {
    console.time('Document Scan (Threshold)');
    const srcPoints = findMaxContourPoints();

    if (!srcPoints || srcPoints.length !== 8) {
      alert('対象の輪郭が見つかりません。');
      console.timeEnd('Document Scan (Threshold)');
      return;
    }

    const [tl_x, tl_y, tr_x, tr_y, br_x, br_y, bl_x, bl_y] = srcPoints;
    const maxWidth = Math.max(
      Math.sqrt((br_x - bl_x) ** 2 + (br_y - bl_y) ** 2),
      Math.sqrt((tr_x - tl_x) ** 2 + (tr_y - tl_y) ** 2)
    );
    const maxHeight = Math.max(
      Math.sqrt((tr_x - br_x) ** 2 + (tr_y - br_y) ** 2),
      Math.sqrt((tl_x - bl_x) ** 2 + (tl_y - bl_y) ** 2)
    );

    const dstPoints = new Float32Array([0, 0, maxWidth, 0, maxWidth, maxHeight, 0, maxHeight]);
    const result = applyPerspective(srcPoints, dstPoints);
    drawToCanvas(resultCanvasRef.current, result);
    console.timeEnd('Document Scan (Threshold)');
  };

  // 高精度スキャン
  const handleHighAccuracyScan = () => {
    console.time('High Accuracy Scan (Canny)');
    
    // 1. ノイズ除去（ぼかし）
    applyBlur(1.5); // sigma値は調整が必要な場合があります
    // 2. グレースケール化（Cannyアルゴリズムは通常グレースケールで動作するため）
    applyGrayscale();
    // 3. エッジ検出（白黒のベタ塗りではなく、線の輪郭だけを抽出）
    applyCanny(50, 150); // 閾値は画像によって調整が必要な場合があります

    // 4. エッジ画像から最大輪郭を取得
    const srcPoints = findMaxContourPoints();

    if (!srcPoints || srcPoints.length !== 8) {
      alert('対象の輪郭が見つかりません。Cannyのパラメータを調整してください。');
      console.timeEnd('High Accuracy Scan (Canny)');
      return;
    }

    // 5. 輪郭が取れたら、元の画像をリセットして元の綺麗な画像に対して射影変換を行う
    resetImage();

    const [tl_x, tl_y, tr_x, tr_y, br_x, br_y, bl_x, bl_y] = srcPoints;
    const maxWidth = Math.max(
      Math.sqrt((br_x - bl_x) ** 2 + (br_y - bl_y) ** 2),
      Math.sqrt((tr_x - tl_x) ** 2 + (tr_y - tl_y) ** 2)
    );
    const maxHeight = Math.max(
      Math.sqrt((tr_x - br_x) ** 2 + (tr_y - br_y) ** 2),
      Math.sqrt((tl_x - bl_x) ** 2 + (tl_y - bl_y) ** 2)
    );

    const dstPoints = new Float32Array([0, 0, maxWidth, 0, maxWidth, maxHeight, 0, maxHeight]);
    
    // 元の画像に対してパースペクティブを適用
    const result = applyPerspective(srcPoints, dstPoints);
    drawToCanvas(resultCanvasRef.current, result);
    
    console.timeEnd('High Accuracy Scan (Canny)');
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ mb: 4, fontWeight: 'bold' }}>
        CV-Pipe WASM Dashboard
      </Typography>

      <Grid container spacing={4}>
        {/* ==========================================
            左側：操作パネル（サイドバー）
        ========================================== */}
        <Grid size={{ xs: 12, md: 4, lg: 3 }}>
          <Paper elevation={3} sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
            
            <Box>
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
                ファイル操作
              </Typography>
              <Stack spacing={2}>
                <Button variant="contained" component="label" disabled={!isReady} fullWidth>
                  画像を読み込む
                  <input type="file" accept="image/*" hidden onChange={handleImageUpload} />
                </Button>
                <Button variant="outlined" color="error" disabled={!isReady} onClick={() => {
                    const result = resetImage();
                    drawToCanvas(resultCanvasRef.current, result);
                  }} fullWidth>
                  画像をリセット
                </Button>
              </Stack>
            </Box>

            <Divider />

            <Box>
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
                フィルタ・補正 (Filter & Color)
              </Typography>
              <Stack spacing={1}>
                <Button variant="outlined" disabled={!isReady} onClick={() => executeProcess('Grayscale', applyGrayscale)}>
                  グレースケール
                </Button>
                <Button variant="outlined" disabled={!isReady} onClick={() => executeProcess('Threshold', () => applyThreshold(128))}>
                  2値化 (Threshold: 128)
                </Button>
                <Button variant="outlined" disabled={!isReady} onClick={() => executeProcess('Blur', () => applyBlur(2.0))}>
                  ぼかし (Blur: 2.0)
                </Button>
                <Button variant="outlined" disabled={!isReady} onClick={() => executeProcess('Canny', () => applyCanny(50, 150))}>
                  Cannyエッジ検出 (50, 150)
                </Button>
              </Stack>
            </Box>

            <Divider />

            <Box>
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
                解析 (Analysis)
              </Typography>
              <Stack spacing={1}>
                <Button variant="outlined" disabled={!isReady} onClick={handleDrawContour}>
                  最大輪郭を描画 (現在の画像から)
                </Button>
              </Stack>
            </Box>

            <Divider />

            <Box>
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
                連携処理 (Pipeline)
              </Typography>
              <Stack spacing={1}>
                <Button variant="contained" color="secondary" disabled={!isReady} onClick={handlePerspectiveScan}>
                  標準書類切り出し (現在の状態から)
                </Button>
                <Button variant="contained" color="success" disabled={!isReady} onClick={handleHighAccuracyScan}>
                  ✨ 高精度書類切り出し (Canny自動化)
                </Button>
              </Stack>
            </Box>

          </Paper>
        </Grid>

        {/* ==========================================
            右側：画像プレビューエリア
        ========================================== */}
        <Grid size={{ xs: 12, md: 8, lg: 9 }}>
          <Paper elevation={0} variant="outlined" sx={{ p: 3, height: '100%', bgcolor: '#f8f9fa' }}>
            <Stack direction={{ xs: 'column', lg: 'row' }} spacing={4} sx={{ alignItems: 'flex-start' }}>
              
              <Box sx={{ width: { xs: '100%', lg: '50%' } }}>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Source (Original)
                </Typography>
                <Box sx={{ border: '2px dashed #ccc', borderRadius: 2, overflow: 'hidden', minHeight: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#fff' }}>
                  <canvas ref={sourceCanvasRef} style={{ width: '100%', height: 'auto', display: 'block' }} />
                </Box>
              </Box>

              <Box sx={{ width: { xs: '100%', lg: '50%' } }}>
                <Typography variant="h6" color="primary" gutterBottom>
                  Result (Processed)
                </Typography>
                <Box sx={{ border: '2px solid #1976d2', borderRadius: 2, overflow: 'hidden', minHeight: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#fff' }}>
                  <canvas ref={resultCanvasRef} style={{ width: '100%', height: 'auto', display: 'block' }} />
                </Box>
              </Box>
              
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default App;