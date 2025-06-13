/* ====================================================================
MIT License

Canvas2APNG
Encoder for animated APNG file from a series of Html5 canvas drawings.
Copyright (c) aug 2017, Arthur Kalverboer

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
========================================================================     */


// ===============================================================================
// *(Support functions are expoted first as they are referenced by other classes.)

/**
 * Convert byte array to string of hexa-decimals.
 * @param {number[]} bytes
 * @returns {string}
 */
export function bytesToStrHex(bytes) {
  let str = "";
  for (let i = 0; i < bytes.length; i++) {
    str += decimalToHex(bytes[i], 2) + " ";
  }
  return str;
}

/**
 * Convert byte array to string of decimals.
 * @param {number[]} bytes
 * @returns {string}
 */
export function bytesToStrDec(bytes) {
  let str = "";
  for (let i = 0; i < bytes.length; i++) {
    str += ('000' + bytes[i]).slice(-3); // padding 3 char
    str += " ";
  }
  return str;
}

/**
 * Conversion byte array of Unicode (UTF-8) values into characters.
 * @param {number[]} bytes
 * @returns {string}
 */
export function bytesToStrAscii(bytes) {
  let str = "";
  for (let i = 0; i < bytes.length; i++) {
    if (bytes[i] > 32 && bytes[i] < 127) { // printable
      str += String.fromCharCode(bytes[i]);
    } else {
      str += ".";
    }
  }
  return str;
}

/**
 * Split long string into lines with fixed width
 * @param {string} str
 * @param {number} lineWidth
 * @returns {string}
 */
export function multiLine(str, lineWidth) {
  const patt = new RegExp("(.{" + lineWidth + "})", "g"); // e.g. regex /(.{75})/
  return str.split(patt).join("\n").replace(/\n+/g, "\n").trim();
}

/**
 * This converts a number to a string hex AND pads leading zeros
 * @param {number} decimal
 * @param {number} chars
 * @returns {string}
 */
export function decimalToHex(decimal, chars) {
  return (decimal + Math.pow(16, chars)).toString(16).slice(-chars).toUpperCase();
}

/**
 * Convert byte array to base64 string.
 * @param {number[]} bytes
 * @returns {string}
 */
export function bytesToBase64(bytes) {
  let str = "";
  for (let i = 0; i < bytes.length; i++) {
    str += String.fromCharCode(bytes[i]);
  }
  return btoa(str);
}

/**
 * Convert base64 string to byte array.
 * @param {string} str
 * @returns {number[]}
 */
export function base64ToBytes(str) {
  const decoded = atob(str);
  const len = decoded.length;
  const arr = new Array(len);

  for (let i = 0; i < len; ++i) {
    arr[i] = decoded.charCodeAt(i);
  }
  return arr;
}

/**
 * Convert 4-character string to 4-byte array.
 * @param {string} iString
 * @returns {number[]}
 */
export function str4ToBytes4(iString) {
  return [iString.charCodeAt(0), iString.charCodeAt(1), iString.charCodeAt(2), iString.charCodeAt(3)];
}

/**
 * Convert 4-byte array to 4-character string.
 * @param {number[]} iBytes
 * @returns {string}
 */
export function bytes4ToStr4(iBytes) {
  return String.fromCharCode(iBytes[0]) +
         String.fromCharCode(iBytes[1]) +
         String.fromCharCode(iBytes[2]) +
         String.fromCharCode(iBytes[3]);
}

/**
 * Convert 32-bit integer to 4-byte array (big-endian).
 * @param {number} iNum
 * @returns {number[]}
 */
export function int32ToBytes4(iNum) {
  const arr = [0, 0, 0, 0];
  for (let idx = 0; idx < arr.length; idx++) {
    const byte = iNum & 0xff;
    arr[idx] = byte;
    iNum = (iNum - byte) / 256;
  }
  return arr.reverse();
}

/**
 * Convert 4-byte array (big-endian) to 32-bit integer.
 * @param {number[]} iBytes
 * @returns {number}
 */
export function bytes4ToInt32(iBytes) {
  return (iBytes[0] << 24) + (iBytes[1] << 16) + (iBytes[2] << 8) + iBytes[3];
}

/**
 * Convert 16-bit integer to 2-byte array (big-endian).
 * @param {number} iNum
 * @returns {number[]}
 */
export function int16ToBytes2(iNum) {
  const arr = [0, 0];
  for (let idx = 0; idx < arr.length; idx++) {
    const byte = iNum & 0xff;
    arr[idx] = byte;
    iNum = (iNum - byte) / 256;
  }
  return arr.reverse();
}

// XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
/*
Implementation of CRC32b calculation.
Calculation function: var res = crc32b(iVar)
- iVar is string or array of unsigned integer
- res is unsigned integer (4 bytes)
Format function for output CRC32 calculation: formatCRC32(iVal, iType)

Testcases:
IN: [0x49,0x48,0x44,0x52,0x00,0x00,0x00,0x01,0x00,0x00,0x00,0x01,0x08,0x02,0x00,0x00,0x00];
OUT:  "907753DE"   or [144,119,83,222]   (IHDR chunk)
IN: [0x49,0x45,0x4E,0x44] or [73,69,78,68]
OUT: "AE426082"  or  [174,66,96,130]  (IEND chunk)
IN: "SheetJS"
OUT: "9DD03922" or  [157,208,57,34]
*/
// ===============================================================================

const a_table = "00000000 77073096 EE0E612C 990951BA 076DC419 706AF48F E963A535 9E6495A3 0EDB8832 79DCB8A4 E0D5E91E 97D2D988 09B64C2B 7EB17CBD E7B82D07 90BF1D91 1DB71064 6AB020F2 F3B97148 84BE41DE 1ADAD47D 6DDDE4EB F4D4B551 83D385C7 136C9856 646BA8C0 FD62F97A 8A65C9EC 14015C4F 63066CD9 FA0F3D63 8D080DF5 3B6E20C8 4C69105E D56041E4 A2677172 3C03E4D1 4B04D447 D20D85FD A50AB56B 35B5A8FA 42B2986C DBBBC9D6 ACBCF940 32D86CE3 45DF5C75 DCD60DCF ABD13D59 26D930AC 51DE003A C8D75180 BFD06116 21B4F4B5 56B3C423 CFBA9599 B8BDA50F 2802B89E 5F058808 C60CD9B2 B10BE924 2F6F7C87 58684C11 C1611DAB B6662D3D 76DC4190 01DB7106 98D220BC EFD5102A 71B18589 06B6B51F 9FBFE4A5 E8B8D433 7807C9A2 0F00F934 9609A88E E10E9818 7F6A0DBB 086D3D2D 91646C97 E6635C01 6B6B51F4 1C6C6162 856530D8 F262004E 6C0695ED 1B01A57B 8208F4C1 F50FC457 65B0D9C6 12B7E950 8BBEB8EA FCB9887C 62DD1DDF 15DA2D49 8CD37CF3 FBD44C65 4DB26158 3AB551CE A3BC0074 D4BB30E2 4ADFA541 3DD895D7 A4D1C46D D3D6F4FB 4369E96A 346ED9FC AD678846 DA60B8D0 44042D73 33031DE5 AA0A4C5F DD0D7CC9 5005713C 270241AA BE0B1010 C90C2086 5768B525 206F85B3 B966D409 CE61E49F 5EDEF90E 29D9C998 B0D09822 C7D7A8B4 59B33D17 2EB40D81 B7BD5C3B C0BA6CAD EDB88320 9ABFB3B6 03B6E20C 74B1D29A EAD54739 9DD277AF 04DB2615 73DC1683 E3630B12 94643B84 0D6D6A3E 7A6A5AA8 E40ECF0B 9309FF9D 0A00AE27 7D079EB1 F00F9344 8708A3D2 1E01F268 6906C2FE F762575D 806567CB 196C3671 6E6B06E7 FED41B76 89D32BE0 10DA7A5A 67DD4ACC F9B9DF6F 8EBEEFF9 17B7BE43 60B08ED5 D6D6A3E8 A1D1937E 38D8C2C4 4FDFF252 D1BB67F1 A6BC5767 3FB506DD 48B2364B D80D2BDA AF0A1B4C 36034AF6 41047A60 DF60EFC3 A867DF55 316E8EEF 4669BE79 CB61B38C BC66831A 256FD2A0 5268E236 CC0C7795 BB0B4703 220216B9 5505262F C5BA3BBE B2BD0B28 2BB45A92 5CB36A04 C2D7FFA7 B5D0CF31 2CD99E8B 5BDEAE1D 9B64C2B0 EC63F226 756AA39C 026D930A 9C0906A9 EB0E363F 72076785 05005713 95BF4A82 E2B87A14 7BB12BAE 0CB61B38 92D28E9B E5D5BE0D 7CDCEFB7 0BDBDF21 86D3D2D4 F1D4E242 68DDB3F8 1FDA836E 81BE16CD F6B9265B 6FB077E1 18B74777 88085AE6 FF0F6A70 66063BCA 11010B5C 8F659EFF F862AE69 616BFFD3 166CCF45 A00AE278 D70DD2EE 4E048354 3903B3C2 A7672661 D06016F7 4969474D 3E6E77DB AED16A4A D9D65ADC 40DF0B66 37D83BF0 A9BCAE53 DEBB9EC5 47B2CF7F 30B5FFE9 BDBDF21C CABAC28A 53B39330 24B4A3A6 BAD03605 CDD70693 54DE5729 23D967BF B3667A2E C4614AB8 5D681B02 2A6F2B94 B40BBE37 C30C8EA1 5A05DF1B 2D02EF8D";

const b_table = a_table.split(' ').map(s => parseInt(s, 16));

/**
 * Calculate CRC32b value of iVar (string or array of integers (bytes))
 * @param {string | number[]} iVar
 * @returns {number}
 */
export function crc32b(iVar) {
  let arr;
  if (typeof iVar === "string" || iVar instanceof String) {
    arr = new Array(iVar.length);
    for (let i = 0; i < iVar.length; i++) {
      arr[i] = iVar.charCodeAt(i);
    }
  } else if (Array.isArray(iVar)) {
    arr = iVar;
  } else {
    console.error("Bad input for CRC32 calculation: ", iVar);
    return 0;
  }

  let crc = -1;
  for (let i = 0, iTop = arr.length; i < iTop; i++) {
    crc = (crc >>> 8) ^ b_table[(crc ^ arr[i]) & 0xFF];
  }
  return (crc ^ (-1)) >>> 0;
}

/**
 * Format CRC32 calculation result.
 * @param {number} iVal - Result of CRC32.str or CRC32.buf (from crc32.js)
 * @param {'uint' | 'hexs' | 'hexb'} iType - Format types: uint, hexs, hexb
 * @returns {number | string | number[]}
 */
export function formatCRC32(iVal, iType) {
  /**
   * Left-pad a string with a specified character.
   * @param {string} s - The string to pad.
   * @param {number} len - The desired length of the string.
   * @param {string} chr - The character to pad with.
   * @returns {string}
   */
  function lpad(s, len, chr) {
    const L = len - s.length;
    const C = chr || " ";
    if (L <= 0) return s;
    return new Array(L + 1).join(C) + s;
  }

  let res;
  switch (iType) {
    case "uint": // unsigned integer
      res = iVal;
      break;
    case "hexs": // hexadec string
      res = lpad(iVal.toString(16),8,'0').toUpperCase();
      break;
    case "hexb": // byte array (first index is high)
      res = new Array(4);
      const hexs = lpad(iVal.toString(16),8,'0');
      res[0] = parseInt(hexs.substring(0, 2), 16);
      res[1] = parseInt(hexs.substring(2, 4), 16);
      res[2] = parseInt(hexs.substring(4, 6), 16);
      res[3] = parseInt(hexs.substring(6, 8), 16);
      break;
    default:
      res = iVal;
  }
  return res;
}  // formatCRC32

// ===============================================================================

// XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
/**
 * A chunk in a PNG file consists of four parts:
 * - Length of data (4 bytes)
 * - Chunk type (4 bytes)
 * - Chunk data (length bytes)
 * - CRC (Cyclic Redundancy Code / Checksum, 4 bytes)
 * There are about 20 different chunk types, but for a minimal PNG, only 3 are required:
 * - the IHDR (image header) chunk
 * - one or more IDAT (image data) chunks
 * - the IEND (image end) chunk
 */
class Chunk {
  /**
   * @param {number} idx - Starting index of chunk in context of byte array.
   * @param {number} len - Length of data: total length of chunk is (4 + 4 + len + 4).
   * @param {string} type - IHDR, IEND, IDAT, acTL, fcTL, fdAT, etc.
   */
  constructor(idx, len, type) {
    this.idx = idx;
    this.len = len;
    this.type = type;
  }
}

/**
 * Object special designed to store a PNG image.
 * Used to generate an animated PNG image and process chunks.
 */
export class ByteArray {
  /**
   * @param {number} len - Initial length of the byte array.
   */
  constructor(len) {
    this.bin = new Array(len);
  }

  /**
   * Find first chunk matching iType; null if not found.
   * @param {string} iType - The type of chunk to find (e.g., "IHDR").
   * @returns {Chunk | null}
   */
  findChunk(iType) {
    let offset = 8; // start search after PNG signature
    let chunk = null;
    while (offset < this.bin.length) {
      const chunkLength = bytes4ToInt32(this.bin.slice(offset, offset + 4));
      const chunkType = bytes4ToStr4(this.bin.slice(offset + 4, offset + 8));

      if (chunkType === iType) {
        chunk = new Chunk(offset, chunkLength, chunkType);
        return chunk;
      }
      offset += 4 + 4 + chunkLength + 4; // Move to the next chunk
    }
    return chunk;
  }

  /**
   * Find all chunks matching iType. Output array of chunk objects.
   * @param {string} iType - The type of chunk to find (e.g., "IDAT").
   * @returns {Chunk[]}
   */
  findChunkAll(iType) {
    let offset = 8; // start search after PNG signature
    const chunkArray = [];
    while (offset < this.bin.length) {
      const chunk1 = this.bin.slice(offset, offset + 4);     // length chunk data
      const chunk2 = this.bin.slice(offset + 4, offset + 8); // type of chunk

      const chunkLength = bytes4ToInt32(chunk1);
      const chunkType = bytes4ToStr4(chunk2);
      if (chunkType === iType) {
        const chunk = new Chunk(offset, chunkLength, chunkType);
        chunkArray.push(chunk);  // array of chunk objects
        // chunk_arr = this.bin.slice(offset, offset + 4 + 4 + chunkLength + 4);
      }

      offset += 4 + 4 + chunkLength + 4; // Move to the next chunk
    }

    return chunkArray;
  }  // findChunkAll

  /**
   * Convert byte array to string of hexa-decimals.
   * @returns {string}
   */
  toStrHex() {
    return bytesToStrHex(this.bin);
  }

  /**
   * Convert byte array to base64 string.
   * @returns {string}
   */
  toStrBase64() {
    return bytesToBase64(this.bin);
  }

  /**
   * Conversion byte array of Unicode (UTF-8) values into characters.
   * @returns {string}
   */
  toStrAscii() {
    return bytesToStrAscii(this.bin);
  }

  /**
   * Convert byte array to string of decimals.
   * @returns {string}
   */
  toStrDec() {
    return bytesToStrDec(this.bin);
  }

}  // ByteArray

// ===============================================================================

// XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
/**
 * Generate APNG byte array from a series of canvas images.
 * See: https://en.wikipedia.org/wiki/APNG
 */
export class APNGencoder {
  /**
   * @param {HTMLCanvasElement} iCanvas - Canvas element.
   */
  constructor(iCanvas) {
    this.whoami = "apng png animation encoder canvas";  // keywords to identify
    this.canvas = iCanvas;  // Canvas element
    this.repeat = 0;      // number of repeats; 0 indefinitely
    this.frame = -1;      // frame number (0 is first frame)
    this.seqNumber = -1;  // Sequence number for fcTL and fdAT chunks
    this.delay_num = 1;   // Frame delay fraction numerator   (int16, 2 bytes)
    this.delay_den = 1;   // Frame delay fraction denominator (int16, 2 bytes) 0 == 1/100 sec
    this.dispose = 0;     // Type of frame area disposal; values 0, 1, 2
    this.blend = 1;       // Type of frame area rendering: values 0, 1

    this.apngBytes;       // APNG output stream (ByteArray)
    this.frameBytes;      // Byte stream of current frame image (ByteArray)

    // Flags
    this.started = false;     // ready to output frames
    this.closeStream = false; // close stream when finished
  }

  /**
   * Creates APNG output stream on which images are written.
   * @returns {number} 0 for success.
   */
  start() {
    this.started = true;
    this.closeStream = false;
    this.apngBytes = new ByteArray(0);
    this.frameBytes = new ByteArray(0);
    this.frame = -1;
    this.seqNumber = -1;
    return 0;
  }

  /**
   * Sets the delay time between each frame.
   * Applies to the last frame added and for subsequent frames.
   * @param {number} d100 - Delay time in 1/100 sec.
   * @returns {number} 0 for success.
   */
  setDelay(d100) {
    this.delay_num = parseInt(d100);
    this.delay_den = 100;
    return 0;
  }

  /**
   * Sets the number of times the set of APNG frames should be played.
   * Default is 1; 0 means play indefinitely.
   * Must be invoked before the first image is added.
   * @param {number} iter - Number of iterations.
   * @returns {number} 0 for success.
   */
  setRepeat(iter) {
    if (iter >= 0) this.repeat = parseInt(iter);
    return 0;
  }

  /**
   * Sets the disposal method for the current frame.
   * 0: APNG_DISPOSE_OP_NONE: no disposal is done on this frame before rendering the next;
   *    the contents of the output buffer are left as is.
   * 1: APNG_DISPOSE_OP_BACKGROUND: the frame's region of the output buffer is to be cleared
   *    to fully transparent black before rendering the next frame.
   * 2: APNG_DISPOSE_OP_PREVIOUS: the frame's region of the output buffer is to be reverted
   *    to the previous contents before rendering the next frame.
   * @param {number} d - Disposal mode (0, 1, or 2).
   * @returns {number} 0 for success, or 0 if invalid input (original behavior).
   */
  setDispose(d) {
    if (d < 0 || d > 2) return 0; // not valid
    this.dispose = parseInt(d);
    return 0;
  }

  /**
   * Sets the blending method for the current frame.
   * 0: APNG_BLEND_OP_SOURCE all color components of the frame, including alpha, overwrite
   *    the current contents of the frame's output buffer region.
   * 1: APNG_BLEND_OP_OVER the frame should be composited onto the output buffer based
   *    on its alpha, using a simple OVER operation.
   * @param {number} b - Blend mode (0 or 1).
   * @returns {number} 0 for success, or 0 if invalid input (original behavior).
   */
  setBlend(b) {
    if (b < 0 || b > 1) return 0; // not valid
    this.blend = parseInt(b);
    return 0;
  }

  /**
   * The addFrame method takes a canvas element to create each frame.
   * @returns {number} 0 for success.
   * @throws {Error} If `start()` method was not called.
   */
  addFrame() {
    if ((this.canvas === null) || !this.started || this.apngBytes === null) {
      throw new Error("Please call start method before calling addFrame");
    }

    this.frame += 1; // frame number: used to derive seq number fcTL/fdAT chunks

    const dataURL = this.canvas.toDataURL('image/png');
    const base64_png = dataURL.replace(/^data:image\/png;base64,/, "");

    this.frameBytes.bin = base64ToBytes(base64_png); // current byteArray of canvas

    if (this.frame === 0) {
      // Add signature (first eight bytes of a PNG datastream)
      const signature = [0x89,0x50,0x4E,0x47,0x0D,0x0A,0x1A,0x0A];
      this.apngBytes.bin = this.apngBytes.bin.concat(signature);

      // Copy Image Header Chunk (IHDR)
      const chunkIHDR = this.frameBytes.findChunk("IHDR");
      const chunkSliceIHDR = this.frameBytes.bin.slice(chunkIHDR.idx, chunkIHDR.idx + 12 + chunkIHDR.len);
      this.apngBytes.bin = this.apngBytes.bin.concat(chunkSliceIHDR);

      // acTL chunk   (animation control)
      let acTL = new Array(0);
      acTL = acTL.concat([0,0,0,8]);  // fixed length (8 data bytes)
      acTL = acTL.concat( str4ToBytes4("acTL") );  // chunk type;
      acTL = acTL.concat([0,0,0,1]);    // number of frames: must be updated at end
      acTL = acTL.concat( int32ToBytes4(this.repeat) );      // push nr of times to loop
      const crcAcTL = crc32b(acTL.slice(4, 4+4+8));
      acTL = acTL.concat(int32ToBytes4(crcAcTL) );           // push CRC 4 bytes
      this.apngBytes.bin = this.apngBytes.bin.concat(acTL);  // push to main stream

      // Add (copy) Data Chunks (fcTL and IDAT) (first frame)
      const chunkArrayIDAT = this.frameBytes.findChunkAll("IDAT");
      for (let i = 0; i < chunkArrayIDAT.length; i++) {
        if (i == 0) {
          // fcTL chunk (frame control)
          this.seqNumber +=1;  // Sequence number for fcTL and fdAT chunks
          let fcTL = new Array(0);
          fcTL = fcTL.concat( int32ToBytes4(26) );  // fixed length data 26 bytes
          fcTL = fcTL.concat( str4ToBytes4("fcTL") );  // chunk type;
          fcTL = fcTL.concat( int32ToBytes4(this.seqNumber) );     // sequence number 0
          fcTL = fcTL.concat( int32ToBytes4(this.canvas.width) );  // width
          fcTL = fcTL.concat( int32ToBytes4(this.canvas.height) ); // height
          fcTL = fcTL.concat( int32ToBytes4(0) );                  // x-offset
          fcTL = fcTL.concat( int32ToBytes4(0) );                  // y-offset
          fcTL = fcTL.concat( int16ToBytes2(this.delay_num) );     // Delay num
          fcTL = fcTL.concat( int16ToBytes2(this.delay_den) );     // Delay den
          fcTL = fcTL.concat( [this.dispose] );  // dispose mode; values [0,1,2] (1 byte)
          fcTL = fcTL.concat( [this.blend] );    // blend mode values [0,1] (1 byte)

          const crcFcTL = crc32b(fcTL.slice(4, 4+4+26));
          fcTL = fcTL.concat(int32ToBytes4(crcFcTL));            // push CRC 4 bytes
          this.apngBytes.bin = this.apngBytes.bin.concat(fcTL);  // push to main stream
        }

        const chunk = chunkArrayIDAT[i];  // copy complete IDAT chunk
        const chunkSlice = this.frameBytes.bin.slice(chunk.idx, chunk.idx + 12 + chunk.len);
        this.apngBytes.bin = this.apngBytes.bin.concat(chunkSlice);  // push to main stream
      }  // for

    }  // first frame

    if (this.frame > 0) {
      // Not first frame
      // Add Data Chunks fcTL/fdAT
      const chunkArrayIDAT = this.frameBytes.findChunkAll("IDAT");
      for (let i = 0; i < chunkArrayIDAT.length; i++) {
        if (i == 0) {
          // fcTL chunk (frame control)
          this.seqNumber +=1;  // Sequence number for fcTL and fdAT chunks
          let fcTL = new Array(0);
          fcTL = fcTL.concat( int32ToBytes4(26) );          // fixed length data 26 bytes
          fcTL = fcTL.concat( str4ToBytes4("fcTL") );       // chunk type;
          fcTL = fcTL.concat( int32ToBytes4(this.seqNumber) );      // sequence number
          fcTL = fcTL.concat( int32ToBytes4(this.canvas.width) );   // width
          fcTL = fcTL.concat( int32ToBytes4(this.canvas.height) );  // height
          fcTL = fcTL.concat( int32ToBytes4(0) );                   // x-offset
          fcTL = fcTL.concat( int32ToBytes4(0) );                   // y-offset
          fcTL = fcTL.concat( int16ToBytes2(this.delay_num));       // Delay num
          fcTL = fcTL.concat( int16ToBytes2(this.delay_den));       // Delay den
          fcTL = fcTL.concat( [this.dispose] );  // dispose mode; values [0,1,2] (1 byte)
          fcTL = fcTL.concat( [this.blend] );    // blend mode values [0,1] (1 byte)

          const crcFcTL = crc32b(fcTL.slice(4, 4+4+26));
          fcTL = fcTL.concat(int32ToBytes4(crcFcTL));  // push CRC 4 bytes
          this.apngBytes.bin = this.apngBytes.bin.concat(fcTL);  // push to main stream
        }

        // ============================================================================
        // fdAT chunk (frame data)
        const chunk = chunkArrayIDAT[i];  // get IDAT chunk object
        const chunk_IDAT_data = this.frameBytes.bin.slice(chunk.idx + 8, chunk.idx + 8 + chunk.len);
        const len_fdAT = chunk.len + 4;                  // increase data with seq number

        this.seqNumber +=1;  // Sequence number for fcTL and fdAT chunks
        let fdAT = new Array(0);
        fdAT = fdAT.concat( int32ToBytes4(len_fdAT) );    // append length bytes
        fdAT = fdAT.concat( str4ToBytes4("fdAT") );       // chunk type bytes
        fdAT = fdAT.concat( int32ToBytes4(this.seqNumber) ); // add sequence number bytes
        fdAT = fdAT.concat( chunk_IDAT_data );            // append original IDAT data
        const crcFdAT = crc32b(fdAT.slice(4, 4 + 4 + len_fdAT));
        fdAT = fdAT.concat(int32ToBytes4(crcFdAT));       // push CRC 4 bytes

        this.apngBytes.bin = this.apngBytes.bin.concat(fdAT); // push to main stream
      } // for
    
    }  // not first frame

    return 0;
  }   // addFrame

  /**
   * Adds final chunk to the APNG stream.
   * If you don't call the finish method the APNG stream will not be valid.
   * @returns {boolean} True if successful, false otherwise.
   */
  finish() {
    if (!this.started) return false;

    // Add Image End Chunk (IEND)
    const chunkArrayIEND = [0x00,0x00,0x00,0x00, 0x49,0x45,0x4E,0x44, 0xAE,0x42,0x60,0x82];  // fixed
    this.apngBytes.bin = this.apngBytes.bin.concat(chunkArrayIEND);

    // Update acTL chunk with number of frames
    const chunkAcTL = this.apngBytes.findChunk("acTL");
    const nFrames = int32ToBytes4(this.frame + 1);
    this.apngBytes.bin[chunkAcTL.idx+8] = nFrames[0];
    this.apngBytes.bin[chunkAcTL.idx+8+1] = nFrames[1];
    this.apngBytes.bin[chunkAcTL.idx+8+2] = nFrames[2];
    this.apngBytes.bin[chunkAcTL.idx+8+3] = nFrames[3];

    // Update CRC of acTL
    const acTLslice = this.apngBytes.bin.slice(chunkAcTL.idx+4, chunkAcTL.idx+4+4+8);
    const crcValUpdatedAcTL = crc32b(acTLslice);
    const crcBytes = int32ToBytes4(crcValUpdatedAcTL);
    this.apngBytes.bin[chunkAcTL.idx+4+4+8] = crcBytes[0];
    this.apngBytes.bin[chunkAcTL.idx+4+4+8+1] = crcBytes[1];
    this.apngBytes.bin[chunkAcTL.idx+4+4+8+2] = crcBytes[2];
    this.apngBytes.bin[chunkAcTL.idx+4+4+8+3] = crcBytes[3];

    this.started = false;
    this.closeStream = true;

    return true;
  }   // finish

  /**
   * Retrieves the APNG stream.
   * @returns {ByteArray} The APNG byte stream.
   */
  stream() {
    return this.apngBytes;
  }
}  // APNGencoder
// ===============================================================================
