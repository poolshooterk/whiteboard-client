'use client';

import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface DrawData {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  color: string;
  size: number;
}

export default function Whiteboard() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentColor, setCurrentColor] = useState('#000000');
  const [currentSize, setCurrentSize] = useState(2);
  const [roomId, setRoomId] = useState('default-room');

  useEffect(() => {
    const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'https://whiteboard-server-j6aw.onrender.com';
    console.log('Connecting to server:', serverUrl);
    const newSocket = io(serverUrl);
    setSocket(newSocket);

    newSocket.emit('join-room', roomId);

    newSocket.on('canvas-state', (canvasData: DrawData[]) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      canvasData.forEach((data) => {
        drawLine(ctx, data);
      });
    });

    newSocket.on('drawing', (data: DrawData) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      drawLine(ctx, data);
    });

    newSocket.on('clear-canvas', () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
    });

    return () => {
      newSocket.close();
    };
  }, [roomId]);

  const drawLine = (ctx: CanvasRenderingContext2D, data: DrawData) => {
    ctx.beginPath();
    ctx.moveTo(data.x0, data.y0);
    ctx.lineTo(data.x1, data.y1);
    ctx.strokeStyle = data.color;
    ctx.lineWidth = data.size;
    ctx.lineCap = 'round';
    ctx.stroke();
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setLastPoint({ x, y });
  };

  const [lastPoint, setLastPoint] = useState<{ x: number; y: number } | null>(null);

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !lastPoint) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const drawData: DrawData = {
      x0: lastPoint.x,
      y0: lastPoint.y,
      x1: x,
      y1: y,
      color: currentColor,
      size: currentSize
    };

    drawLine(ctx, drawData);
    setLastPoint({ x, y });

    if (socket) {
      socket.emit('drawing', { roomId, drawData });
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    setLastPoint(null);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (socket) {
      socket.emit('clear-canvas', roomId);
    }
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-100 p-4">
      <div className="mb-4 flex gap-4 items-center bg-white p-4 rounded-lg shadow">
        <div className="flex items-center gap-2">
          <label htmlFor="color" className="text-sm font-medium">色:</label>
          <input
            id="color"
            type="color"
            value={currentColor}
            onChange={(e) => setCurrentColor(e.target.value)}
            className="w-8 h-8 rounded cursor-pointer"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <label htmlFor="size" className="text-sm font-medium">サイズ:</label>
          <input
            id="size"
            type="range"
            min="1"
            max="20"
            value={currentSize}
            onChange={(e) => setCurrentSize(Number(e.target.value))}
            className="w-20"
          />
          <span className="text-xs w-8">{currentSize}px</span>
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="room" className="text-sm font-medium">ルーム:</label>
          <input
            id="room"
            type="text"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            className="px-2 py-1 border rounded text-sm"
            placeholder="ルームID"
          />
        </div>

        <button
          onClick={clearCanvas}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
        >
          クリア
        </button>
      </div>

      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        className="border-2 border-gray-300 bg-white rounded-lg shadow-lg cursor-crosshair"
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
      />
    </div>
  );
}