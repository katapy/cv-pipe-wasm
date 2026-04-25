import React, { useEffect, useState, useRef } from 'react';
import { Button, Container, Stack, Typography, Box } from '@mui/material';
import init, { CvPipe } from './pkg/cv_pipe_wasm';

const App = () => {
  const [isWasmLoaded, setIsWasmLoaded] = useState(false);
  
  // Canvasへの参照を保持する
  const sourceCanvasRef = useRef<HTMLCanvasElement>(null);
  const resultCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // WASMの初期化
    init().then(() => setIsWasmLoaded(true));
  }, []);

  // 1. 画像アップロードとCanvasへの描画
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = sourceCanvasRef.current;
      if (!canvas) return;
      
      // 元画像のサイズに合わせてCanvasをリサイズ
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      // 画像を描画
      ctx?.drawImage(img, 0, 0);
    };
  };

  // 2. WASMによる画像処理
  const handleProcess = () => {
    const srcCanvas = sourceCanvasRef.current;
    const resCanvas = resultCanvasRef.current;
    if (!srcCanvas || !resCanvas) return;

    const ctx = srcCanvas.getContext('2d');
    if (!ctx) return;

    const width = srcCanvas.width;
    const height = srcCanvas.height;
    
    // Canvasからピクセルデータ(RGBA)を取得
    const imageData = ctx.getImageData(0, 0, width, height);
    // Uint8ClampedArray を Uint8Array に変換
    const data = new Uint8Array(imageData.data.buffer);
    console.log(data.length, width * height * 4)

    try {
      console.time("WASM Processing"); // 処理速度計測用

      // CvPipe インスタンスを作成して処理
      const pipe = new CvPipe(data, width, height);
      pipe.to_gray();
      const result = pipe.get_data();

      console.timeEnd("WASM Processing");

      // 結果描画用Canvasをリサイズ
      resCanvas.width = width;
      resCanvas.height = height;
      const resCtx = resCanvas.getContext('2d');
      
      // WASMから返ってきた Uint8Array を ImageData に戻して描画
      const resultImageData = new ImageData(
        new Uint8ClampedArray(result.buffer as ArrayBuffer), 
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
        {/* ファイルアップロードボタン */}
        <Button variant="outlined" component="label" disabled={!isWasmLoaded}>
          画像を読み込む
          <input type="file" accept="image/*" hidden onChange={handleImageUpload} />
        </Button>

        {/* 処理実行ボタン */}
        <Button 
          variant="contained" 
          disabled={!isWasmLoaded} 
          onClick={handleProcess}
        >
          グレースケール変換実行
        </Button>
      </Stack>

      {/* Before / After 画像表示エリア */}
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