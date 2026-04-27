import React, { useEffect, useState, useRef } from 'react';
import { Button, Container, Stack, Typography, Box } from '@mui/material';
import init, { CvPipe } from './pkg/cv_pipe_wasm';
import wasmUrl from './pkg/cv_pipe_wasm_bg.wasm?url';

const App = () => {
  const [isWasmLoaded, setIsWasmLoaded] = useState(false);
  
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

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = sourceCanvasRef.current;
      if (!canvas) return;
      
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0);
    };
  };

  // ------------------------------------
  // 1. グレースケール変換処理 (既存)
  // ------------------------------------
  const handleGrayScale = () => {
    const srcCanvas = sourceCanvasRef.current;
    const resCanvas = resultCanvasRef.current;
    if (!srcCanvas || !resCanvas) return;

    const ctx = srcCanvas.getContext('2d');
    if (!ctx) return;

    const width = srcCanvas.width;
    const height = srcCanvas.height;
    
    // 画像が読み込まれていない場合はスキップ
    if (width === 0 || height === 0) return;

    const imageData = ctx.getImageData(0, 0, width, height);
    const data = new Uint8Array(imageData.data.buffer);

    try {
      console.time("WASM Grayscale Processing");

      const pipe = new CvPipe(data, width, height);
      pipe.to_gray();
      const result = pipe.get_data();
      pipe.free();

      console.timeEnd("WASM Grayscale Processing");

      resCanvas.width = width;
      resCanvas.height = height;
      const resCtx = resCanvas.getContext('2d');
      
      const resultImageData = new ImageData(
        new Uint8ClampedArray(result), 
        width, 
        height
      );
      resCtx?.putImageData(resultImageData, 0, 0);
      
    } catch (e) {
      console.error("Rust execution failed:", e);
    }
  };

  // ------------------------------------
  // 2. リサイズ処理 (新規追加)
  // ------------------------------------
  const handleResize = () => {
    const srcCanvas = sourceCanvasRef.current;
    const resCanvas = resultCanvasRef.current;
    if (!srcCanvas || !resCanvas) return;

    const ctx = srcCanvas.getContext('2d');
    if (!ctx) return;

    const width = srcCanvas.width;
    const height = srcCanvas.height;
    
    if (width === 0 || height === 0) return;

    const imageData = ctx.getImageData(0, 0, width, height);
    const data = new Uint8Array(imageData.data.buffer);

    // 新しいサイズを計算（例として縦横50%に圧縮）
    // ※ 1未満にならないよう Math.max を使用
    const targetWidth = Math.max(1, Math.floor(width * 0.5));
    const targetHeight = Math.max(1, Math.floor(height * 0.5));

    try {
      console.time("WASM Resize Processing");

      const pipe = new CvPipe(data, width, height);
      
      // WASM側でリサイズ実行
      pipe.resize(targetWidth, targetHeight);
      
      // リサイズされたデータと、新しい縦横サイズを取得
      const result = pipe.get_data();
      const newWidth = pipe.get_width();
      const newHeight = pipe.get_height();
      
      pipe.free();

      console.timeEnd("WASM Resize Processing");

      // 【重要】Result側のCanvasサイズを、WASMから取得した「新しいサイズ」に合わせる
      resCanvas.width = newWidth;
      resCanvas.height = newHeight;
      const resCtx = resCanvas.getContext('2d');
      
      const resultImageData = new ImageData(
        new Uint8ClampedArray(result), 
        newWidth, 
        newHeight
      );
      resCtx?.putImageData(resultImageData, 0, 0);
      
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

        {/* リサイズ用ボタン (新規追加) */}
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
          {/* Result Canvas はリサイズ時に小さくなることが目で見てわかるように */}
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