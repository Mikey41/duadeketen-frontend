# TTS QR Publisher Tools

This directory contains tools for publishers to generate QR codes for their Ga-language books that work with the TTS QR Book Demo app.

## Quick Start

1. Install dependencies:
\`\`\`bash
cd tools
npm install
\`\`\`

2. Generate QR codes from a text file:
\`\`\`bash
node generate-qr.js --input your-text.txt --page-id page1 --output ./qr-codes/
\`\`\`

3. Generate QR codes from direct text:
\`\`\`bash
node generate-qr.js --text "Your Ga text here" --page-id page1
\`\`\`

## Features

- **Automatic Chunking**: Splits long text into multiple QR codes when needed
- **UTF-8 Safe**: Properly handles Ga language characters and diacritics  
- **Multiple Formats**: Generate PNG or SVG QR codes
- **Configurable**: Adjust size, error correction, and margins
- **Summary Reports**: JSON summary of generated codes for tracking

## Command Line Options

| Option | Short | Description | Default |
|--------|-------|-------------|---------|
| `--input` | `-i` | Input text file path | - |
| `--text` | `-t` | Direct text input | - |
| `--page-id` | `-p` | Page identifier (required) | - |
| `--output` | `-o` | Output directory | `./qr-codes/` |
| `--format` | `-f` | Output format (png/svg) | `png` |
| `--size` | `-s` | QR code size in pixels | `256` |
| `--margin` | `-m` | Quiet zone margin | `4` |
| `--error-correction` | `-e` | Error correction (L/M/Q/H) | `M` |
| `--help` | `-h` | Show help message | - |

## Examples

### Basic Usage
\`\`\`bash
# Generate from file
node generate-qr.js -i chapter1.txt -p page1

# Generate from text
node generate-qr.js -t "Akɛ nɛ Ga yɛ kɛ akɛ lɛ" -p page1
\`\`\`

### Advanced Options
\`\`\`bash
# High-quality SVG for print
node generate-qr.js -i text.txt -p page1 -f svg -s 512 -e H

# Small PNG for web
node generate-qr.js -i text.txt -p page1 -f png -s 128 -e L
\`\`\`

## How Chunking Works

When text exceeds ~2400 bytes, the tool automatically splits it into chunks:

1. **Header Format**: `GANPAGE/ID:<page-id>;CHUNK:<current>/<total>;<text>`
2. **Safe Splitting**: Respects UTF-8 character boundaries
3. **Sequential Naming**: `page1_chunk_1.png`, `page1_chunk_2.png`, etc.

### Example Chunked Output
\`\`\`
Input: 5000 bytes of Ga text
Output:
- page1_chunk_1.png (GANPAGE/ID:page1;CHUNK:1/3;[first part])
- page1_chunk_2.png (GANPAGE/ID:page1;CHUNK:2/3;[second part])  
- page1_chunk_3.png (GANPAGE/ID:page1;CHUNK:3/3;[final part])
- page1_summary.json (metadata)
\`\`\`

## Testing

Run the test suite to validate functionality:

\`\`\`bash
npm test
\`\`\`

This creates sample files and tests the chunking logic.

## Integration with TTS App

The generated QR codes work seamlessly with the TTS QR Book Demo app:

1. **Single QR**: App reads text directly and generates audio
2. **Chunked QR**: App collects all chunks, assembles text, then generates audio
3. **Progress Tracking**: App shows "Scanned X of Y chunks" during collection

## Error Correction Levels

Choose based on your book's expected wear:

- **L (Low)**: ~7% recovery - Clean, new books
- **M (Medium)**: ~15% recovery - Normal use (default)
- **Q (Quartile)**: ~25% recovery - Heavy use
- **H (High)**: ~30% recovery - Damaged or worn books

## File Structure

\`\`\`
tools/
├── generate-qr.js      # Main QR generation script
├── test-generator.js   # Test suite and examples
├── package.json        # Dependencies
├── README.md          # This file
└── samples/           # Generated test files
    ├── short-sample.txt
    └── long-sample.txt
\`\`\`

## Troubleshooting

### "Text too large" Error
- Text exceeds chunking limits
- Try splitting into multiple pages

### "Cannot fit any text" Error  
- Text contains very large UTF-8 characters
- Check for unusual characters or encoding issues

### QR Code Won't Scan
- Increase error correction level (`-e H`)
- Increase size (`-s 512`)
- Check printing quality and contrast

## Publisher Workflow

1. **Prepare Text**: Clean and format your Ga text
2. **Generate QR Codes**: Use this tool to create QR images
3. **Layout Design**: Place QR codes on facing pages or back of text pages
4. **Print Quality**: Ensure high contrast and sharp edges
5. **Test Scanning**: Verify QR codes work with the TTS app before mass printing

## Support

For issues or questions about the QR generation tools, check the generated summary JSON files for debugging information.
