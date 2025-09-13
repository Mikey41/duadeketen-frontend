const fs = require("fs")
const path = require("path")
const QRCode = require("qrcode")

/**
 * Publisher QR Code Generation Tool
 *
 * This script helps publishers generate QR codes for their Ga-language books.
 * It handles both single QR codes and chunked QR codes for long text.
 *
 * Usage:
 *   node tools/generate-qr.js --input text.txt --page-id page1 --output ./qr-codes/
 *   node tools/generate-qr.js --text "Short text" --page-id page1 --output ./qr-codes/
 */

// Configuration constants
const MAX_QR_BYTES = 2400 // Safe limit for QR code data
const CHUNK_HEADER_TEMPLATE = "GANPAGE/ID:{pageId};CHUNK:{current}/{total};"

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2)
  const options = {
    input: null,
    text: null,
    pageId: null,
    output: "./qr-codes/",
    format: "png",
    size: 256,
    margin: 4,
    errorCorrectionLevel: "M",
  }

  for (let i = 0; i < args.length; i += 2) {
    const flag = args[i]
    const value = args[i + 1]

    switch (flag) {
      case "--input":
      case "-i":
        options.input = value
        break
      case "--text":
      case "-t":
        options.text = value
        break
      case "--page-id":
      case "-p":
        options.pageId = value
        break
      case "--output":
      case "-o":
        options.output = value
        break
      case "--format":
      case "-f":
        options.format = value.toLowerCase()
        break
      case "--size":
      case "-s":
        options.size = Number.parseInt(value)
        break
      case "--margin":
      case "-m":
        options.margin = Number.parseInt(value)
        break
      case "--error-correction":
      case "-e":
        options.errorCorrectionLevel = value.toUpperCase()
        break
      case "--help":
      case "-h":
        showHelp()
        process.exit(0)
        break
      default:
        console.error(`Unknown option: ${flag}`)
        process.exit(1)
    }
  }

  return options
}

function showHelp() {
  console.log(`
QR Code Generator for TTS Books

Usage:
  node tools/generate-qr.js [options]

Options:
  -i, --input <file>           Input text file path
  -t, --text <text>           Direct text input (alternative to --input)
  -p, --page-id <id>          Page identifier (required)
  -o, --output <dir>          Output directory (default: ./qr-codes/)
  -f, --format <format>       Output format: png, svg (default: png)
  -s, --size <pixels>         QR code size in pixels (default: 256)
  -m, --margin <modules>      Quiet zone margin (default: 4)
  -e, --error-correction <L|M|Q|H>  Error correction level (default: M)
  -h, --help                  Show this help message

Examples:
  # Generate QR from file
  node tools/generate-qr.js -i chapter1.txt -p page1 -o ./output/

  # Generate QR from direct text
  node tools/generate-qr.js -t "Akɛ nɛ Ga yɛ kɛ akɛ lɛ" -p page1

  # Generate SVG format with custom size
  node tools/generate-qr.js -i text.txt -p page1 -f svg -s 512
`)
}

// Calculate UTF-8 byte length
function getByteLength(str) {
  return Buffer.byteLength(str, "utf8")
}

// Split text into chunks that fit within QR code limits
function chunkText(text, pageId) {
  const chunks = []
  let remainingText = text.trim()
  let chunkIndex = 1

  // First, estimate how many chunks we'll need
  const headerTemplate = CHUNK_HEADER_TEMPLATE.replace("{pageId}", pageId)
    .replace("{current}", "1")
    .replace("{total}", "1")
  const headerSize = getByteLength(headerTemplate)
  const availableSpace = MAX_QR_BYTES - headerSize

  // Rough estimate of total chunks needed
  const estimatedChunks = Math.ceil(getByteLength(text) / availableSpace)

  while (remainingText.length > 0) {
    // Create header for this chunk
    const header = CHUNK_HEADER_TEMPLATE.replace("{pageId}", pageId)
      .replace("{current}", chunkIndex.toString())
      .replace("{total}", estimatedChunks.toString())

    const headerBytes = getByteLength(header)
    const maxContentBytes = MAX_QR_BYTES - headerBytes

    // Find the largest substring that fits
    let chunkText = ""
    let testLength = Math.min(remainingText.length, Math.floor(maxContentBytes / 2)) // Conservative start

    while (testLength <= remainingText.length) {
      const testText = remainingText.substring(0, testLength)
      if (getByteLength(testText) <= maxContentBytes) {
        chunkText = testText
        testLength++
      } else {
        break
      }
    }

    // If we couldn't fit anything, try character by character (fallback)
    if (!chunkText && remainingText.length > 0) {
      for (let i = 1; i <= remainingText.length; i++) {
        const testText = remainingText.substring(0, i)
        if (getByteLength(testText) <= maxContentBytes) {
          chunkText = testText
        } else {
          break
        }
      }
    }

    if (!chunkText) {
      throw new Error(`Cannot fit any text in chunk ${chunkIndex}. Text may contain characters that are too large.`)
    }

    chunks.push({
      index: chunkIndex,
      content: header + chunkText,
      textContent: chunkText,
    })

    remainingText = remainingText.substring(chunkText.length)
    chunkIndex++
  }

  // Update total count in all chunks
  const actualTotal = chunks.length
  chunks.forEach((chunk) => {
    chunk.content = chunk.content.replace(
      new RegExp(`CHUNK:${chunk.index}/${estimatedChunks}`),
      `CHUNK:${chunk.index}/${actualTotal}`,
    )
  })

  return chunks
}

// Generate QR code image/SVG
async function generateQRCode(data, options, filename) {
  const qrOptions = {
    errorCorrectionLevel: options.errorCorrectionLevel,
    type: options.format === "svg" ? "svg" : "png",
    quality: 0.92,
    margin: options.margin,
    color: {
      dark: "#000000",
      light: "#FFFFFF",
    },
    width: options.size,
  }

  try {
    if (options.format === "svg") {
      const svg = await QRCode.toString(data, { ...qrOptions, type: "svg" })
      fs.writeFileSync(filename, svg)
    } else {
      await QRCode.toFile(filename, data, qrOptions)
    }
    return true
  } catch (error) {
    console.error(`Failed to generate QR code: ${error.message}`)
    return false
  }
}

// Main execution function
async function main() {
  const options = parseArgs()

  // Validate required options
  if (!options.pageId) {
    console.error("Error: Page ID is required (use --page-id)")
    process.exit(1)
  }

  if (!options.input && !options.text) {
    console.error("Error: Either --input file or --text must be provided")
    process.exit(1)
  }

  // Get text content
  let text = ""
  if (options.input) {
    if (!fs.existsSync(options.input)) {
      console.error(`Error: Input file not found: ${options.input}`)
      process.exit(1)
    }
    text = fs.readFileSync(options.input, "utf8")
  } else {
    text = options.text
  }

  if (!text.trim()) {
    console.error("Error: Text content is empty")
    process.exit(1)
  }

  // Create output directory
  if (!fs.existsSync(options.output)) {
    fs.mkdirSync(options.output, { recursive: true })
  }

  console.log(`Generating QR codes for page: ${options.pageId}`)
  console.log(`Text length: ${text.length} characters (${getByteLength(text)} bytes)`)

  // Check if text fits in a single QR code
  const singleQRSize = getByteLength(text)
  if (singleQRSize <= MAX_QR_BYTES) {
    // Generate single QR code
    console.log("Text fits in single QR code")

    const filename = path.join(options.output, `${options.pageId}.${options.format}`)
    const success = await generateQRCode(text, options, filename)

    if (success) {
      console.log(`✓ Generated: ${filename}`)
      console.log(`  Content: "${text.substring(0, 50)}${text.length > 50 ? "..." : ""}"`)
    } else {
      process.exit(1)
    }
  } else {
    // Generate chunked QR codes
    console.log("Text requires chunking into multiple QR codes")

    const chunks = chunkText(text, options.pageId)
    console.log(`Split into ${chunks.length} chunks`)

    let successCount = 0
    for (const chunk of chunks) {
      const filename = path.join(options.output, `${options.pageId}_chunk_${chunk.index}.${options.format}`)
      const success = await generateQRCode(chunk.content, options, filename)

      if (success) {
        console.log(`✓ Generated chunk ${chunk.index}/${chunks.length}: ${filename}`)
        console.log(`  Size: ${getByteLength(chunk.content)} bytes`)
        console.log(`  Content: "${chunk.textContent.substring(0, 30)}${chunk.textContent.length > 30 ? "..." : ""}"`)
        successCount++
      }
    }

    if (successCount === chunks.length) {
      console.log(`\n✓ Successfully generated all ${chunks.length} QR codes`)
    } else {
      console.log(`\n⚠ Generated ${successCount}/${chunks.length} QR codes`)
      process.exit(1)
    }
  }

  // Generate summary file
  const summaryPath = path.join(options.output, `${options.pageId}_summary.json`)
  const summary = {
    pageId: options.pageId,
    textLength: text.length,
    textBytes: getByteLength(text),
    chunked: singleQRSize > MAX_QR_BYTES,
    chunkCount: singleQRSize > MAX_QR_BYTES ? chunkText(text, options.pageId).length : 1,
    generatedAt: new Date().toISOString(),
    options: {
      format: options.format,
      size: options.size,
      errorCorrectionLevel: options.errorCorrectionLevel,
    },
  }

  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2))
  console.log(`\n✓ Summary saved: ${summaryPath}`)
}

// Run the script
if (require.main === module) {
  main().catch((error) => {
    console.error("Fatal error:", error.message)
    process.exit(1)
  })
}

module.exports = {
  chunkText,
  generateQRCode,
  getByteLength,
  MAX_QR_BYTES,
  CHUNK_HEADER_TEMPLATE,
}
