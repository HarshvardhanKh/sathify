/// <reference types="vite/client" />

interface Window {
  electron?: {
    avatar: {
      open: () => void;
      close: () => void;
      setAlwaysOnTop: (b: boolean) => void;
      setSize: (w: number, h: number) => void;
      setOpacity: (n: number) => void;
    };
    app: {
      getVersion: () => string;
      onPipelineEvent: (cb: (event: any) => void) => () => void;
    };
  };
}
