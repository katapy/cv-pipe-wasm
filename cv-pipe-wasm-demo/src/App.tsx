import { Box, Button, Container, Divider, Grid, Paper, Stack, Typography } from '@mui/material';
import React, { useRef } from 'react';

import { type ImageResult, useCvPipe } from './hooks/useCvPipe';

const App = () => {
  const {
    isReady,
    initImage,
    resetImage,
    applyGrayscale,
    applyResize,
    applyThreshold,
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

  // 輪郭を描画する
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

  // 射影変換（ドキュメントスキャン）
  const handlePerspectiveScan = () => {
    console.time('Document Scan');
    const srcPoints = findMaxContourPoints();

    if (!srcPoints || srcPoints.length !== 8) {
      alert('対象の輪郭が見つかりません。');
      console.timeEnd('Document Scan');
      return;
    }

    const [tl_x, tl_y, tr_x, tr_y, br_x, br_y, bl_x, bl_y] = srcPoints;

    const widthA = Math.sqrt((br_x - bl_x) ** 2 + (br_y - bl_y) ** 2);
    const widthB = Math.sqrt((tr_x - tl_x) ** 2 + (tr_y - tl_y) ** 2);
    const maxWidth = Math.max(widthA, widthB);

    const heightA = Math.sqrt((tr_x - br_x) ** 2 + (tr_y - br_y) ** 2);
    const heightB = Math.sqrt((tl_x - bl_x) ** 2 + (tl_y - bl_y) ** 2);
    const maxHeight = Math.max(heightA, heightB);

    const dstPoints = new Float32Array([
      0, 0,
      maxWidth, 0,
      maxWidth, maxHeight,
      0, maxHeight,
    ]);

    const result = applyPerspective(srcPoints, dstPoints);
    drawToCanvas(resultCanvasRef.current, result);
    console.timeEnd('Document Scan');
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* 修正2: Typography の fontWeight は sx 内に移動 */}
      <Typography variant="h4" sx={{ mb: 4, fontWeight: 'bold' }}>
        CV-Pipe WASM Dashboard
      </Typography>

      <Grid container spacing={4}>
        {/* ==========================================
            左側：操作パネル（サイドバー）
        ========================================== */}
        {/* 修正1: <Grid item xs={12}> から item を削除し、MUI v6仕様 (size) に変更 */}
        <Grid size={{ xs: 12, md: 4, lg: 3 }}>
          <Paper elevation={3} sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
            
            <Box>
              {/* 修正2: fontWeight="bold" を sx={{ fontWeight: 'bold' }} に修正 */}
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
                色調補正 (Color)
              </Typography>
              <Stack spacing={1}>
                <Button variant="outlined" disabled={!isReady} onClick={() => executeProcess('Grayscale', applyGrayscale)}>
                  グレースケール
                </Button>
                <Button variant="outlined" disabled={!isReady} onClick={() => executeProcess('Threshold', () => applyThreshold(128))}>
                  2値化 (Threshold: 128)
                </Button>
              </Stack>
            </Box>

            <Divider />

            <Box>
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
                変形 (Transform)
              </Typography>
              <Stack spacing={1}>
                <Button variant="outlined" disabled={!isReady} onClick={() => executeProcess('Resize', () => applyResize(0.5))}>
                  50%リサイズ
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
                  最大輪郭を描画 (赤枠)
                </Button>
              </Stack>
            </Box>

            <Divider />

            <Box>
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
                連携処理 (Pipeline)
              </Typography>
              <Stack spacing={1}>
                <Button variant="contained" color="secondary" disabled={!isReady} onClick={() => {
                    executeProcess('Pipeline (Gray -> Resize)', () => {
                      applyGrayscale();
                      return applyResize(0.5);
                    });
                  }}>
                  Gray ＆ Resize
                </Button>
                <Button variant="contained" color="success" disabled={!isReady} onClick={handlePerspectiveScan}>
                  書類切り出し (Document Scan)
                </Button>
              </Stack>
            </Box>

          </Paper>
        </Grid>

        {/* ==========================================
            右側：画像プレビューエリア
        ========================================== */}
        {/* 修正1: <Grid item xs={12}> から item を削除し、MUI v6仕様 (size) に変更 */}
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