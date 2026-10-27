/* ============================================================
   WEA — Minimal QR code generator (SVG output, no dependencies)

   Byte-mode QR encoder supporting versions 1–10 at error
   correction level M — more than enough for a verify URL.

   Usage:
     WEA_QR.svg("https://example.com/verify.html?id=WEA-2026-000001",
                { size: 128, margin: 2, dark: "#111a2b", light: "#fff" })
   Returns an SVG string, or "" if the payload is too long.

   Implementation follows the reference algorithm published by
   Kazuhiko Arase (qrcode-generator, MIT), adapted to produce SVG.
   ============================================================ */

(function (global) {
  "use strict";

  /* ---------------- Galois field GF(256), primitive poly 0x11d ---------------- */

  var EXP = [];
  var LOG = [];
  (function () {
    for (var i = 0; i < 8; i++) EXP[i] = 1 << i;
    for (var j = 8; j < 256; j++) EXP[j] = EXP[j - 4] ^ EXP[j - 5] ^ EXP[j - 6] ^ EXP[j - 8];
    for (var k = 0; k < 255; k++) LOG[EXP[k]] = k;
  })();

  function gexp(n) {
    while (n < 0) n += 255;
    while (n >= 256) n -= 255;
    return EXP[n];
  }

  function glog(n) {
    if (n < 1) throw new Error("glog(" + n + ")");
    return LOG[n];
  }

  /* ---------------- Reed–Solomon ---------------- */

  function Polynomial(num, shift) {
    var offset = 0;
    while (offset < num.length && num[offset] === 0) offset++;
    this.num = new Array(num.length - offset + shift);
    for (var i = 0; i < num.length - offset; i++) this.num[i] = num[i + offset];
    for (var j = 0; j < shift; j++) this.num[i + j] = 0;
  }

  Polynomial.prototype.multiply = function (e) {
    var num = new Array(this.num.length + e.num.length - 1);
    for (var i = 0; i < num.length; i++) num[i] = 0;
    for (var i2 = 0; i2 < this.num.length; i2++) {
      for (var j = 0; j < e.num.length; j++) {
        num[i2 + j] ^= gexp(glog(this.num[i2]) + glog(e.num[j]));
      }
    }
    return new Polynomial(num, 0);
  };

  Polynomial.prototype.mod = function (e) {
    if (this.num.length - e.num.length < 0) return this;
    var num = this.num.slice(0);
    while (num.length - e.num.length >= 0) {
      var ratio = glog(num[0]) - glog(e.num[0]);
      for (var i = 0; i < e.num.length; i++) {
        num[i] ^= gexp(glog(e.num[i]) + ratio);
      }
      var offset = 0;
      while (offset < num.length && num[offset] === 0) offset++;
      num = num.slice(offset);
    }
    return new Polynomial(num, 0);
  };

  function errorCorrectPolynomial(ecLength) {
    var a = new Polynomial([1], 0);
    for (var i = 0; i < ecLength; i++) {
      a = a.multiply(new Polynomial([1, gexp(i)], 0));
    }
    return a;
  }

  /* ---------------- version / block tables (EC level M) ----------------
     Format per version: [totalDataCodewords, ecPerBlock, [ [blockCount, dataPerBlock], ... ] ] */

  var RS_BLOCK_TABLE = [
    /* v1  M */ [16, 10, [[1, 16]]],
    /* v2  M */ [28, 16, [[1, 28]]],
    /* v3  M */ [44, 26, [[1, 44]]],
    /* v4  M */ [64, 18, [[2, 32]]],
    /* v5  M */ [86, 24, [[2, 43]]],
    /* v6  M */ [108, 16, [[4, 27]]],
    /* v7  M */ [124, 18, [[4, 31]]],
    /* v8  M */ [154, 22, [[2, 38], [2, 39]]],
    /* v9  M */ [182, 22, [[3, 36], [2, 37]]],
    /* v10 M */ [216, 26, [[4, 43], [1, 44]]]
  ];

  var ALIGN_PATTERN = [
    [],
    [],
    [6, 18],
    [6, 22],
    [6, 26],
    [6, 30],
    [6, 34],
    [6, 22, 38],
    [6, 24, 42],
    [6, 26, 46],
    [6, 28, 50]
  ];

  function dataCodewords(version) {
    return RS_BLOCK_TABLE[version - 1][0];
  }

  function ecPerBlock(version) {
    return RS_BLOCK_TABLE[version - 1][1];
  }

  function rsBlocks(version) {
    var out = [];
    var groups = RS_BLOCK_TABLE[version - 1][2];
    for (var g = 0; g < groups.length; g++) {
      for (var b = 0; b < groups[g][0]; b++) {
        out.push({ totalCount: groups[g][1] + ecPerBlock(version), dataCount: groups[g][1] });
      }
    }
    return out;
  }

  /* ---------------- bit buffer ---------------- */

  function BitBuffer() {
    this.length = 0;
    this.buffer = [];
  }

  BitBuffer.prototype.get = function (index) {
    var bufIndex = Math.floor(index / 8);
    return ((this.buffer[bufIndex] >>> (7 - (index % 8))) & 1) === 1;
  };

  BitBuffer.prototype.put = function (num, length) {
    for (var i = 0; i < length; i++) {
      this.putBit(((num >>> (length - i - 1)) & 1) === 1);
    }
  };

  BitBuffer.prototype.putBit = function (bit) {
    var bufIndex = Math.floor(this.length / 8);
    if (this.buffer.length <= bufIndex) this.buffer.push(0);
    if (bit) this.buffer[bufIndex] |= 0x80 >>> this.length % 8;
    this.length++;
  };

  /* ---------------- utils ---------------- */

  function utf8Bytes(str) {
    var out = [];
    for (var i = 0; i < str.length; i++) {
      var c = str.charCodeAt(i);
      if (c < 0x80) out.push(c);
      else if (c < 0x800) out.push(0xc0 | (c >> 6), 0x80 | (c & 63));
      else out.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
    }
    return out;
  }

  function lengthInBits(version) {
    return version < 10 ? 8 : 16;
  }

  var PAD0 = 0xec;
  var PAD1 = 0x11;

  function createData(version, data) {
    var buffer = new BitBuffer();
    buffer.put(4, 4); // byte mode
    buffer.put(data.length, lengthInBits(version));
    for (var i = 0; i < data.length; i++) buffer.put(data[i], 8);

    var totalDataCount = dataCodewords(version);
    if (buffer.length > totalDataCount * 8) {
      throw new Error("data overflow: " + buffer.length + " > " + totalDataCount * 8);
    }

    /* terminator */
    if (buffer.length + 4 <= totalDataCount * 8) buffer.put(0, 4);

    /* pad to byte boundary */
    while (buffer.length % 8 !== 0) buffer.putBit(false);

    /* pad codewords */
    while (true) {
      if (buffer.length >= totalDataCount * 8) break;
      buffer.put(PAD0, 8);
      if (buffer.length >= totalDataCount * 8) break;
      buffer.put(PAD1, 8);
    }

    return createBytes(buffer, rsBlocks(version));
  }

  function createBytes(buffer, blocks) {
    var offset = 0;
    var maxDcCount = 0;
    var maxEcCount = 0;
    var dcData = [];
    var ecData = [];

    for (var r = 0; r < blocks.length; r++) {
      var dcCount = blocks[r].dataCount;
      var ecCount = blocks[r].totalCount - dcCount;
      maxDcCount = Math.max(maxDcCount, dcCount);
      maxEcCount = Math.max(maxEcCount, ecCount);

      dcData[r] = new Array(dcCount);
      for (var i = 0; i < dcCount; i++) {
        dcData[r][i] = 0xff & buffer.buffer[i + offset];
      }
      offset += dcCount;

      var rsPoly = errorCorrectPolynomial(ecCount);
      var rawPoly = new Polynomial(dcData[r], rsPoly.num.length - 1);
      var modPoly = rawPoly.mod(rsPoly);

      ecData[r] = new Array(rsPoly.num.length - 1);
      for (var j = 0; j < ecData[r].length; j++) {
        var modIndex = j + modPoly.num.length - ecData[r].length;
        ecData[r][j] = modIndex >= 0 ? modPoly.num[modIndex] : 0;
      }
    }

    var totalCodeCount = 0;
    for (var t = 0; t < blocks.length; t++) totalCodeCount += blocks[t].totalCount;

    var data = new Array(totalCodeCount);
    var index = 0;

    for (var c = 0; c < maxDcCount; c++) {
      for (var b = 0; b < blocks.length; b++) {
        if (c < dcData[b].length) data[index++] = dcData[b][c];
      }
    }
    for (var e = 0; e < maxEcCount; e++) {
      for (var b2 = 0; b2 < blocks.length; b2++) {
        if (e < ecData[b2].length) data[index++] = ecData[b2][e];
      }
    }

    return data;
  }

  /* ---------------- mask patterns ---------------- */

  var PATTERN_POSITION_TABLE = [
    [],
    [6, 18], [6, 22], [6, 26], [6, 30], [6, 34],
    [6, 22, 38], [6, 24, 42], [6, 26, 46], [6, 28, 50]
  ];

  function getMask(maskPattern, i, j) {
    switch (maskPattern) {
      case 0: return (i + j) % 2 === 0;
      case 1: return i % 2 === 0;
      case 2: return j % 3 === 0;
      case 3: return (i + j) % 3 === 0;
      case 4: return (Math.floor(i / 2) + Math.floor(j / 3)) % 2 === 0;
      case 5: return ((i * j) % 2) + ((i * j) % 3) === 0;
      case 6: return (((i * j) % 2) + ((i * j) % 3)) % 2 === 0;
      case 7: return (((i * j) % 3) + ((i + j) % 2)) % 2 === 0;
      default: throw new Error("bad maskPattern:" + maskPattern);
    }
  }

  /* ---------------- matrix ---------------- */

  function QRMatrix(version) {
    this.version = version;
    this.size = version * 4 + 17;
    this.modules = [];
    this.dataCache = null;
    for (var r = 0; r < this.size; r++) {
      this.modules.push(new Array(this.size).fill(null));
    }
  }

  QRMatrix.prototype.isDark = function (row, col) {
    return this.modules[row][col] === true;
  };

  QRMatrix.prototype.setupPositionProbePattern = function (row, col) {
    for (var r = -1; r <= 7; r++) {
      if (row + r <= -1 || this.size <= row + r) continue;
      for (var c = -1; c <= 7; c++) {
        if (col + c <= -1 || this.size <= col + c) continue;
        if (
          (r >= 0 && r <= 6 && (c === 0 || c === 6)) ||
          (c >= 0 && c <= 6 && (r === 0 || r === 6)) ||
          (r >= 2 && r <= 4 && c >= 2 && c <= 4)
        ) {
          this.modules[row + r][col + c] = true;
        } else {
          this.modules[row + r][col + c] = false;
        }
      }
    }
  };

  QRMatrix.prototype.setupTimingPattern = function () {
    for (var r = 8; r < this.size - 8; r++) {
      if (this.modules[r][6] != null) continue;
      this.modules[r][6] = r % 2 === 0;
    }
    for (var c = 8; c < this.size - 8; c++) {
      if (this.modules[6][c] != null) continue;
      this.modules[6][c] = c % 2 === 0;
    }
  };

  QRMatrix.prototype.setupPositionAdjustPattern = function () {
    var pos = PATTERN_POSITION_TABLE[this.version - 1];
    for (var i = 0; i < pos.length; i++) {
      for (var j = 0; j < pos.length; j++) {
        var row = pos[i];
        var col = pos[j];
        if (this.modules[row][col] != null) continue;
        for (var r = -2; r <= 2; r++) {
          for (var c = -2; c <= 2; c++) {
            this.modules[row + r][col + c] =
              r === -2 || r === 2 || c === -2 || c === 2 || (r === 0 && c === 0);
          }
        }
      }
    }
  };

  var BCH_TYPE_NUMBER = [
    0x01, 0x02, 0x04, 0x08, 0x10, 0x20, 0x40, 0x80
  ];
  var BCH_TYPE_INFO = [
    0x01, 0x02, 0x04, 0x08, 0x10, 0x20, 0x40, 0x80, 0x100, 0x200, 0x400
  ];

  /* format info: (ecLevelBits << 3) | mask ; EC level M = 0 (bits "00") */
  function bchTypeInfo(data) {
    var d = data << 10;
    while (bchDigit(d) - bchDigit(0x537) >= 0) {
      d ^= 0x537 << (bchDigit(d) - bchDigit(0x537));
    }
    return ((data << 10) | d) ^ 0x5412;
  }

  function bchDigit(data) {
    var digit = 0;
    while (data !== 0) {
      digit++;
      data >>>= 1;
    }
    return digit;
  }

  QRMatrix.prototype.setupTypeInfo = function (test, maskPattern) {
    /* EC level M = 0 (bits 00) */
    var data = maskPattern;
    var bits = bchTypeInfo(data);

    for (var i = 0; i < 15; i++) {
      var mod = (!test && ((bits >> i) & 1) === 1);

      /* vertical (left column) */
      if (i < 6) this.modules[i][8] = mod;
      else if (i < 8) this.modules[i + 1][8] = mod;
      else this.modules[this.size - 15 + i][8] = mod;

      /* horizontal (bottom row / top-right) */
      if (i < 8) this.modules[8][this.size - i - 1] = mod;
      else if (i < 9) this.modules[8][15 - i - 1 + 1] = mod;
      else this.modules[8][15 - i - 1] = mod;
    }

    /* fixed dark module */
    this.modules[this.size - 8][8] = !test;
  };

  QRMatrix.prototype.mapData = function (data, maskPattern) {
    var inc = -1;
    var row = this.size - 1;
    var bitIndex = 7;
    var byteIndex = 0;

    for (var col = this.size - 1; col > 0; col -= 2) {
      if (col === 6) col--;
      while (true) {
        for (var c = 0; c < 2; c++) {
          if (this.modules[row][col - c] == null) {
            var dark = false;
            if (byteIndex < data.length) {
              dark = ((data[byteIndex] >>> bitIndex) & 1) === 1;
            }
            if (getMask(maskPattern, row, col - c)) dark = !dark;
            this.modules[row][col - c] = dark;
            bitIndex--;
            if (bitIndex === -1) {
              byteIndex++;
              bitIndex = 7;
            }
          }
        }
        row += inc;
        if (row < 0 || this.size <= row) {
          row -= inc;
          inc = -inc;
          break;
        }
      }
    }
  };

  QRMatrix.prototype.setupTypeNumber = function (test) {
    /* only needed for versions >= 7 */
    if (this.version < 7) return;
    var bits = bchTypeNumber(this.version);
    for (var i = 0; i < 18; i++) {
      var mod = (!test && ((bits >> i) & 1) === 1);
      this.modules[Math.floor(i / 3)][(i % 3) + this.size - 8 - 3] = mod;
      this.modules[(i % 3) + this.size - 8 - 3][Math.floor(i / 3)] = mod;
    }
  };

  function bchTypeNumber(data) {
    var d = data << 12;
    while (bchDigit(d) - bchDigit(0x1f25) >= 0) {
      d ^= 0x1f25 << (bchDigit(d) - bchDigit(0x1f25));
    }
    return (data << 12) | d;
  }

  QRMatrix.prototype.buildMatrix = function (test, maskPattern) {
    this.setupPositionProbePattern(0, 0);
    this.setupPositionProbePattern(this.size - 7, 0);
    this.setupPositionProbePattern(0, this.size - 7);
    this.setupPositionAdjustPattern();
    this.setupTimingPattern();
    this.setupTypeInfo(test, maskPattern);
    this.setupTypeNumber(test);

    if (this.dataCache == null) {
      this.dataCache = createData(this.version, this.utf8);
    }
    this.mapData(this.dataCache, maskPattern);
  };

  /* ---------------- mask selection ---------------- */

  var LOST_POINT = [
    { x: 1, y: 3 }, { x: 1, y: 2 }
  ];

  QRMatrix.prototype.getLostPoint = function () {
    var size = this.size;
    var lostPoint = 0;
    var row, col;
    var modules = this.modules;

    /* rule 1 */
    for (row = 0; row < size; row++) {
      for (col = 0; col < size; col++) {
        var sameCount = 0;
        var dark = modules[row][col];
        for (var r = -1; r <= 1; r++) {
          if (row + r < 0 || size <= row + r) continue;
          for (var c = -1; c <= 1; c++) {
            if (col + c < 0 || size <= col + c) continue;
            if (r === 0 && c === 0) continue;
            if (dark === modules[row + r][col + c]) sameCount++;
          }
        }
        if (sameCount > 5) lostPoint += 3 + sameCount - 5;
      }
    }

    /* rule 2 */
    for (row = 0; row < size - 1; row++) {
      for (col = 0; col < size - 1; col++) {
        var count = 0;
        if (modules[row][col]) count++;
        if (modules[row + 1][col]) count++;
        if (modules[row][col + 1]) count++;
        if (modules[row + 1][col + 1]) count++;
        if (count === 0 || count === 4) lostPoint += 3;
      }
    }

    /* rule 3 */
    for (row = 0; row < size; row++) {
      for (col = 0; col < size - 6; col++) {
        if (
          modules[row][col] &&
          !modules[row][col + 1] &&
          modules[row][col + 2] &&
          modules[row][col + 3] &&
          modules[row][col + 4] &&
          !modules[row][col + 5] &&
          modules[row][col + 6]
        ) {
          lostPoint += 40;
        }
      }
    }
    for (col = 0; col < size; col++) {
      for (row = 0; row < size - 6; row++) {
        if (
          modules[row][col] &&
          !modules[row + 1][col] &&
          modules[row + 2][col] &&
          modules[row + 3][col] &&
          modules[row + 4][col] &&
          !modules[row + 5][col] &&
          modules[row + 6][col]
        ) {
          lostPoint += 40;
        }
      }
    }

    /* rule 4 */
    var darkCount = 0;
    for (col = 0; col < size; col++) {
      for (row = 0; row < size; row++) {
        if (modules[row][col]) darkCount++;
      }
    }
    var ratio = Math.abs((100 * darkCount) / size / size - 50) / 5;
    lostPoint += ratio * 10;

    return lostPoint;
  };

  /* ---------------- public build ---------------- */

  function build(text) {
    var bytes = utf8Bytes(text);

    var version = 0;
    for (var v = 1; v <= 10; v++) {
      var cap = dataCodewords(v) * 8;
      if (4 + lengthInBits(v) + bytes.length * 8 <= cap) {
        version = v;
        break;
      }
    }
    if (!version) return null;

    var qr = new QRMatrix(version);
    qr.utf8 = bytes;

    var bestMask = 0;
    var minLost = Infinity;
    for (var mask = 0; mask < 8; mask++) {
      qr.modules = [];
      for (var r = 0; r < qr.size; r++) qr.modules.push(new Array(qr.size).fill(null));
      qr.buildMatrix(false, mask);
      var lost = qr.getLostPoint();
      if (lost < minLost) {
        minLost = lost;
        bestMask = mask;
      }
    }

    qr.modules = [];
    for (var r2 = 0; r2 < qr.size; r2++) qr.modules.push(new Array(qr.size).fill(null));
    qr.buildMatrix(false, bestMask);

    var out = [];
    for (var i = 0; i < qr.size; i++) {
      var line = [];
      for (var j = 0; j < qr.size; j++) line.push(qr.modules[i][j] ? 1 : 0);
      out.push(line);
    }
    return out;
  }

  function svg(text, opts) {
    opts = opts || {};
    var px = opts.size || 128;
    var margin = opts.margin == null ? 2 : opts.margin;
    var dark = opts.dark || "#111a2b";
    var light = opts.light || "#ffffff";

    var m = build(text);
    if (!m) return "";
    var n = m.length;
    var total = n + margin * 2;

    var path = "";
    for (var r = 0; r < n; r++) {
      for (var c = 0; c < n; c++) {
        if (m[r][c]) path += "M" + (c + margin) + " " + (r + margin) + "h1v1h-1z";
      }
    }

    return (
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + total + " " + total +
      '" width="' + px + '" height="' + px + '" shape-rendering="crispEdges" role="img" aria-label="QR code">' +
      '<rect width="' + total + '" height="' + total + '" fill="' + light + '"/>' +
      '<path d="' + path + '" fill="' + dark + '"/>' +
      "</svg>"
    );
  }

  global.WEA_QR = { svg: svg, build: build };
})(window);
