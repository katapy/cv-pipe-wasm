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

  const handleProcess = () => {
    const srcCanvas = sourceCanvasRef.current;
    const resCanvas = resultCanvasRef.current;
    if (!srcCanvas || !resCanvas) return;

    const ctx = srcCanvas.getContext('2d');
    if (!ctx) return;

    const width = srcCanvas.width;
    const height = srcCanvas.height;
    
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = new Uint8Array(imageData.data.buffer);

    try {
      console.time("WASM Processing");

      // CvPipe インスタンスを作成して処理
      const pipe = new CvPipe(data, width, height);
      pipe.to_gray();
      const result = pipe.get_data();
      
      // 【重要】メモリリークを防ぐため、WASM側のRust構造体を破棄する
      pipe.free();

      console.timeEnd("WASM Processing");

      resCanvas.width = width;
      resCanvas.height = height;
      const resCtx = resCanvas.getContext('2d');
      
      // 【重要】 result.buffer ではなく result を直接渡す
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

  return (
    <Container>
      <Typography variant="h4" sx={{ my: 4 }}>CV-Pipe WASM Dashboard</Typography>
      
      <Stack direction="row" spacing={2} sx={{ mb: 4 }}>
        <Button variant="outlined" component="label" disabled={!isWasmLoaded}>
          画像を読み込む
          <input type="file" accept="image/*" hidden onChange={handleImageUpload} />
        </Button>

        <Button 
          variant="contained" 
          disabled={!isWasmLoaded} 
          onClick={handleProcess}
        >
          グレースケール変換実行
        </Button>
      </Stack>

      <Stack direction="row" spacing={4}>
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
            style={{ maxWidth: '100%', border: '1px dashed #ccc' }} 
          />
        </Box>
      </Stack>
    </Container>
  );
};

export default App;