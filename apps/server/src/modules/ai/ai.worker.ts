import { parentPort, workerData } from 'worker_threads';
import { CustomChessAI } from './chessAi.service';

async function run() {
  try {
    const ai = new CustomChessAI();
    const move = await ai.chooseMoveDirect(workerData.fen, workerData.difficulty);
    parentPort?.postMessage({ success: true, move });
  } catch (err: any) {
    parentPort?.postMessage({ success: false, error: err?.message || 'AI Worker Error' });
  }
}

run();
