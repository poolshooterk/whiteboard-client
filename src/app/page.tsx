import Whiteboard from '@/components/Whiteboard';

export default function Home() {
  return (
    <div>
      <div className="bg-blue-600 text-white p-4 text-center">
        <h1 className="text-2xl font-bold">オンラインホワイトボード</h1>
        <p className="mt-2">リアルタイムで共同作業できるホワイトボードです</p>
      </div>
      <Whiteboard />
    </div>
  );
}
