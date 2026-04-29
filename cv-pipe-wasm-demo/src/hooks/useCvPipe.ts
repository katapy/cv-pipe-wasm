import { useCallback,useEffect, useRef, useState } from 'react';

import init, { CvPipe } from '../pkg/cv_pipe_wasm';
import wasmUrl from '../pkg/cv_pipe_wasm_bg.wasm?url';

export type ImageResult = {
  width: number;
  height: number;
  rgba: Uint8Array;
};

export const useCvPipe = () => {
  const [isReady, setIsReady] = useState(false);

  // WASMのインスタンスとオリジナル画像を保持（再レンダリングを防ぐためuseRefを使用）
  const pipeRef = useRef<CvPipe | null>(null);
  const originalBytesRef = useRef<Uint8Array | null>(null);

  // 1. WASMの初期化
  useEffect(() => {
    let isMounted = true;
    init(wasmUrl)
      .then(() => {
        console.log('WASM Initialized');
        if (isMounted) setIsReady(true);
      })
      .catch((err) => console.error('WASM init failed:', err));

    // アンマウント時にWASM側のメモリを解放 (重要)
    return () => {
      isMounted = false;
      if (pipeRef.current) {
        pipeRef.current.free();
        pipeRef.current = null;
      }
    };
  }, []);

  // 現在の画像状態を取得するヘルパー
  const getResult = useCallback((): ImageResult | null => {
    if (!pipeRef.current) return null;
    return {
      width: pipeRef.current.get_width(),
      height: pipeRef.current.get_height(),
      rgba: pipeRef.current.get_rgba_data(),
    };
  }, []);

  // 2. 画像の読み込み（インスタンスの生成）
  const initImage = useCallback(
    (bytes: Uint8Array): ImageResult | null => {
      // 既存のメモリを解放
      if (pipeRef.current) pipeRef.current.free();

      originalBytesRef.current = bytes;
      pipeRef.current = new CvPipe(bytes);

      return getResult();
    },
    [getResult]
  );

  // 3. 画像のリセット（最初の状態に戻す）
  const resetImage = useCallback((): ImageResult | null => {
    if (!originalBytesRef.current) return null;
    return initImage(originalBytesRef.current);
  }, [initImage]);

  // 4. 各種画像処理（インスタンスを使い回すため、連続適用が可能）
  const applyGrayscale = useCallback((): ImageResult | null => {
    if (!pipeRef.current) return null;
    pipeRef.current.apply_grayscale();
    return getResult();
  }, [getResult]);

  const applyResize = useCallback(
    (scale: number): ImageResult | null => {
      if (!pipeRef.current) return null;
      const currentWidth = pipeRef.current.get_width();
      const currentHeight = pipeRef.current.get_height();
      const targetWidth = Math.max(1, Math.floor(currentWidth * scale));
      const targetHeight = Math.max(1, Math.floor(currentHeight * scale));

      pipeRef.current.apply_resize(targetWidth, targetHeight);
      return getResult();
    },
    [getResult]
  );

  return {
    isReady,
    initImage,
    resetImage,
    applyGrayscale,
    applyResize,
  };
};
