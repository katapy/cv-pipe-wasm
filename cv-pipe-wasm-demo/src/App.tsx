import React, { useEffect, useState, useRef } from 'react';
import { Button, Container, Stack, Typography, Box } from '@mui/material';
import init, { CvPipe } from './pkg/cv_pipe_wasm';
import wasmUrl from './pkg/cv_pipe_wasm_bg.wasm?url';

const App = () => {
  const [isWasmLoaded, setIsWasmLoaded] = useState(false);
  const [imageBytes, setImageBytes] = useState<Uint8Array | null>(null);
  
  const sourceCanvasRef = useRef<HTMLCanvasElement>(null);
  const resultCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    init(wasmUrl)
      .then(() => {
        console.log("WASM Initialized");
        setIsWasmLoaded(true);
      })
      .catch((err) => console.error("WASM init failed:", err));
  }, []);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    setImageBytes(bytes);

    try {
      const pipe = new CvPipe(bytes);
      const width = pipe.get_width();
      const height = pipe.get_height();
      const rgba = pipe.get_rgba_data();
      pipe.free();

      const canvas = sourceCanvasRef.current;
      if (canvas) {
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        const imageData = new ImageData(new Uint8ClampedArray(rgba), width, height);
        ctx?.putImageData(imageData, 0, 0);
      }
    } catch (e) {
      console.error("Failed to decode image:", e);
    }
  };

  // ------------------------------------
  // 1. グレースケール変換処理
  // ------------------------------------
  const handleGrayScale = () => {
    if (!imageBytes) return; // 画像バイナリがない場合はスキップ

    try {
      console.time("WASM Grayscale Processing");
      const pipe = new CvPipe(imageBytes);
      
      pipe.apply_grayscale();
      const result = pipe.get_rgba_data();
      const width = pipe.get_width();
      const height = pipe.get_height();
      pipe.free();
      console.timeEnd("WASM Grayscale Processing");

      // 結果をCanvasに描画
      const resCanvas = resultCanvasRef.current;
      if (resCanvas) {
        resCanvas.width = width;
        resCanvas.height = height;
        const resCtx = resCanvas.getContext('2d');
        const resultImageData = new ImageData(new Uint8ClampedArray(result), width, height);
        resCtx?.putImageData(resultImageData, 0, 0);
      }
    } catch (e) {
      console.error("Rust execution failed:", e);
    }
  };

  // ------------------------------------
  // 2. リサイズ処理
  // ------------------------------------
  const handleResize = () => {
    if (!imageBytes) return;

    try {
      console.time("WASM Resize Processing");
      const pipe = new CvPipe(imageBytes);
      
      // WASM側からデコード済みのサイズを取得してターゲットサイズを計算
      const originalWidth = pipe.get_width();
      const originalHeight = pipe.get_height();
      const targetWidth = Math.max(1, Math.floor(originalWidth * 0.5));
      const targetHeight = Math.max(1, Math.floor(originalHeight * 0.5));

      pipe.apply_resize(targetWidth, targetHeight);
      
      const result = pipe.get_rgba_data();
      const newWidth = pipe.get_width();
      const newHeight = pipe.get_height();
      pipe.free();
      console.timeEnd("WASM Resize Processing");
      
      const resCanvas = resultCanvasRef.current;
      if (resCanvas) {
        resCanvas.width = newWidth;
        resCanvas.height = newHeight;
        const resCtx = resCanvas.getContext('2d');
        const resultImageData = new ImageData(new Uint8ClampedArray(result), newWidth, newHeight);
        resCtx?.putImageData(resultImageData, 0, 0);
      }
    } catch (e) {
      console.error("Rust execution failed:", e);
    }
  };

  return (
    <Container>
      <Typography variant="h4" sx={{ my: 4 }}>CV-Pipe WASM Dashboard</Typography>
      
      <Stack direction="row" spacing={2} sx={{ mb: 4 }}>
        <Button variant="outlined" component="label" disabled={!isWasmLoaded}>
          画像を読み込む
          <input type="file" accept="image/*" hidden onChange={handleImageUpload} />
        </Button>

        {/* グレースケール用ボタン */}
        <Button 
          variant="contained" 
          disabled={!isWasmLoaded} 
          onClick={handleGrayScale}
        >
          グレースケール変換
        </Button>

        {/* リサイズ用ボタン */}
        <Button 
          variant="contained" 
          color="secondary"
          disabled={!isWasmLoaded} 
          onClick={handleResize}
        >
          50%にリサイズ
        </Button>
      </Stack>

      <Stack direction="row" spacing={4} sx={{ alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="h6">Source (Before)</Typography>
          <canvas 
            ref={sourceCanvasRef} 
            style={{ maxWidth: '100%', border: '1px dashed #ccc' }} 
          />
        </Box>
        <Box>
          <Typography variant="h6">Result (After)</Typography>
          <canvas 
            ref={resultCanvasRef} 
            style={{ border: '1px solid #1976d2' }} 
          />
        </Box>
      </Stack>
    </Container>
  );
};

export default App;