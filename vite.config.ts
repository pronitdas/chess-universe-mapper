import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';
import { IncomingMessage, ServerResponse } from 'http';

// Chess tile generation plugin
function chessTileServer(): Plugin {
  return {
    name: 'chess-tile-server',
    configureServer(server) {
      server.middlewares.use('/api/tiles', (req: IncomingMessage, res: ServerResponse) => {
        const url = req.url || '';
        const match = url.match(/\/(\d+)\/(\d+)\/(\d+)/);
        
        if (!match) {
          res.writeHead(404);
          res.end('Not Found');
          return;
        }
        
        const [, z, x, y] = match;
        const zoom = parseInt(z);
        const tileX = parseInt(x);
        const tileY = parseInt(y);
        
        // Generate chess position from coordinates
        const seed = tileX + tileY * 1000 + zoom * 1000000;
        const avgElo = 1800 + (zoom * 50) + (seed % 400);
        const winRate = 35 + (seed % 30);
        const games = Math.max(1, (10 - zoom) * 100) + (seed % 1000);
        
        // Generate HSL color
        const hue = Math.abs((avgElo - 1500) / 6) % 60;
        const saturation = 60 + (winRate % 40);
        const lightness = 30 + (games % 500) / 15;
        
        // Create a simple colored PNG tile (64x64 pixels for simplicity)
        const size = 64;
        const r = Math.floor(lightness * 2.55);
        const g = Math.floor(lightness * 2.55 * saturation / 100);
        const b = Math.floor(lightness * 2.55 * (60 - hue) / 60);
        
        // Generate PNG bytes
        const pngBytes = createSimplePNG(size, r, g, b);
        
        res.writeHead(200, {
          'Content-Type': 'image/png',
          'Cache-Control': 'public, max-age=31536000, immutable'
        });
        res.end(Buffer.from(pngBytes));
      });
    }
  };
}

// Create a simple colored PNG - returns Uint8Array
function createSimplePNG(size: number, r: number, g: number, b: number): Uint8Array {
  const pixels: number[] = [];
  for (let y = 0; y < size; y++) {
    pixels.push(0);  // Filter byte
    for (let x = 0; x < size; x++) {
      const distFromCenter = Math.sqrt(Math.pow(x - size/2, 2) + Math.pow(y - size/2, 2));
      const isCenter = distFromCenter < 8;
      pixels.push(
        isCenter ? 255 : r,
        isCenter ? 255 : g,
        isCenter ? 255 : b,
        255
      );
    }
  }
  
  const raw = new Uint8Array(pixels);
  
  // Create PNG signature
  const sig = new Uint8Array([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  
  // IHDR chunk
  const ihdr = new Uint8Array(13);
  const ihdrView = new DataView(ihdr.buffer);
  ihdrView.setUint32(0, size, false);
  ihdrView.setUint32(4, size, false);
  ihdr[8] = 8;
  ihdr[9] = 6;
  
  const ihdrChunk = createChunk('IHDR', ihdr);
  
  // IDAT chunk
  const idatData = zlibCompress(raw);
  const idatChunk = createChunk('IDAT', idatData);
  
  // IEND chunk
  const iendChunk = createChunk('IEND', new Uint8Array(0));
  
  // Combine all chunks
  const totalLength = sig.length + ihdrChunk.length + idatChunk.length + iendChunk.length;
  const result = new Uint8Array(totalLength);
  let pos = 0;
  result.set(sig, pos); pos += sig.length;
  result.set(ihdrChunk, pos); pos += ihdrChunk.length;
  result.set(idatChunk, pos); pos += idatChunk.length;
  result.set(iendChunk, pos);
  
  return result;
}

function createChunk(type: string, data: Uint8Array): Uint8Array {
  const typeBytes = new TextEncoder().encode(type);
  const len = 4 + typeBytes.length + data.length + 4;
  const chunk = new Uint8Array(len);
  const view = new DataView(chunk.buffer);
  
  // Length
  view.setUint32(0, typeBytes.length + data.length, false);
  
  // Type
  chunk.set(typeBytes, 4);
  
  // Data
  chunk.set(data, 4 + typeBytes.length);
  
  // CRC
  const crc = crc32(typeBytes, data);
  view.setUint32(4 + typeBytes.length + data.length, crc, false);
  
  return chunk;
}

function crc32(type: Uint8Array, data: Uint8Array): number {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < type.length; i++) {
    crc = updateCRC(crc, type[i]);
  }
  for (let i = 0; i < data.length; i++) {
    crc = updateCRC(crc, data[i]);
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function updateCRC(crc: number, byte: number): number {
  const table = [
    0x00000000,0x77073096,0xee0e612c,0x9909a8ba,0x076dc419,0x706af48f,0xe9636035,0x9e6456a3,0x0edb8832,0x79dcb8a4,0xe0d5101e,0x97d22088,0x09b6762b,0x7eb146bd,0xe7b8ee07,0x90bf9e91,0x1db71064,0x6ac040f2,0xf3d9e868,0x84ded8fe,0x1a8a8e5d,0x6d8d9ecb,0xf4843631,0x836306a7,0x13dc9a36,0x64dbaaa0,0xfdda021a,0x8add328c,0x12b9642f,0x65be54b9,0xfcb7fc03,0x8bb0cc95
  ];
  return table[(crc ^ byte) & 0xff] ^ (crc >>> 8);
}

function zlibCompress(data: Uint8Array): Uint8Array {
  const adler = adler32(data);
  const blocks: Uint8Array[] = [];
  const blockSize = 32768;
  
  for (let i = 0; i < data.length; i += blockSize) {
    const chunk = data.slice(i, Math.min(i + blockSize, data.length));
    const isLast = i + blockSize >= data.length;
    const header = isLast ? 0x01 : 0x00;
    const size = chunk.length;
    const nsize = ~size + 1;
    const headerBytes = new Uint8Array([
      header,
      size & 0xFF,
      (size >> 8) & 0xFF,
      nsize & 0xFF,
      (nsize >> 8) & 0xFF
    ]);
    blocks.push(headerBytes);
    blocks.push(chunk);
  }
  
  // Combine blocks
  let totalLen = 0;
  for (const block of blocks) totalLen += block.length;
  const combined = new Uint8Array(totalLen);
  let pos = 0;
  for (const block of blocks) {
    combined.set(block, pos);
    pos += block.length;
  }
  
  const output = new Uint8Array(10 + combined.length + 4);
  const view = new DataView(output.buffer);
  
  output[0] = 0x78;
  output[1] = 0x01;
  view.setUint16(2, 65535 - ((adler % 65531) || 65535), false);
  output.set(combined, 6);
  view.setUint32(6 + combined.length, adler, false);
  
  return output;
}

function adler32(data: Uint8Array): number {
  let a = 1, b = 0;
  for (let i = 0; i < data.length; i++) {
    a = (a + data[i]) % 65521;
    b = (b + a) % 65521;
  }
  return (b << 16) | a;
}

// https://vitejs.dev/config/
export default defineConfig(() => ({
  base: '/chess-universe-mapper/',
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    chessTileServer()
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    include: ['maplibre-gl'],
  },
}));
