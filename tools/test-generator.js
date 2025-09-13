const fs = require("fs")
const path = require("path")
const { chunkText, getByteLength, MAX_QR_BYTES } = require("./generate-qr")

/**
 * Test script for the QR generator
 * Validates chunking logic and provides examples
 */

function runTests() {
  console.log("Running QR Generator Tests...\n")

  // Test 1: Short text (single QR)
  console.log("Test 1: Short text (single QR)")
  const shortText = "Akɛ nɛ Ga yɛ kɛ akɛ lɛ shi yɛ kɛ akɛ nɛ wɔ lɛ kɛ shi nɛ."
  console.log(`Text: "${shortText}"`)
  console.log(`Length: ${shortText.length} chars, ${getByteLength(shortText)} bytes`)
  console.log(`Fits in single QR: ${getByteLength(shortText) <= MAX_QR_BYTES ? "Yes" : "No"}\n`)

  // Test 2: Long text (chunked QR)
  console.log("Test 2: Long text (chunked QR)")
  const longText = `
Ga yɛ kɛ akɛ lɛ shi yɛ kɛ akɛ nɛ wɔ lɛ kɛ shi nɛ. Akɛ nɛ Ga yɛ kɛ akɛ lɛ shi yɛ kɛ akɛ nɛ wɔ lɛ kɛ shi nɛ. 
Ga yɛ kɛ akɛ lɛ shi yɛ kɛ akɛ nɛ wɔ lɛ kɛ shi nɛ. Akɛ nɛ Ga yɛ kɛ akɛ lɛ shi yɛ kɛ akɛ nɛ wɔ lɛ kɛ shi nɛ.
Ga yɛ kɛ akɛ lɛ shi yɛ kɛ akɛ nɛ wɔ lɛ kɛ shi nɛ. Akɛ nɛ Ga yɛ kɛ akɛ lɛ shi yɛ kɛ akɛ nɛ wɔ lɛ kɛ shi nɛ.
Ga yɛ kɛ akɛ lɛ shi yɛ kɛ akɛ nɛ wɔ lɛ kɛ shi nɛ. Akɛ nɛ Ga yɛ kɛ akɛ lɛ shi yɛ kɛ akɛ nɛ wɔ lɛ kɛ shi nɛ.
Ga yɛ kɛ akɛ lɛ shi yɛ kɛ akɛ nɛ wɔ lɛ kɛ shi nɛ. Akɛ nɛ Ga yɛ kɛ akɛ lɛ shi yɛ kɛ akɛ nɛ wɔ lɛ kɛ shi nɛ.
Ga yɛ kɛ akɛ lɛ shi yɛ kɛ akɛ nɛ wɔ lɛ kɛ shi nɛ. Akɛ nɛ Ga yɛ kɛ akɛ lɛ shi yɛ kɛ akɛ nɛ wɔ lɛ kɛ shi nɛ.
Ga yɛ kɛ akɛ lɛ shi yɛ kɛ akɛ nɛ wɔ lɛ kɛ shi nɛ. Akɛ nɛ Ga yɛ kɛ akɛ lɛ shi yɛ kɛ akɛ nɛ wɔ lɛ kɛ shi nɛ.
Ga yɛ kɛ akɛ lɛ shi yɛ kɛ akɛ nɛ wɔ lɛ kɛ shi nɛ. Akɛ nɛ Ga yɛ kɛ akɛ lɛ shi yɛ kɛ akɛ nɛ wɔ lɛ kɛ shi nɛ.
Ga yɛ kɛ akɛ lɛ shi yɛ kɛ akɛ nɛ wɔ lɛ kɛ shi nɛ. Akɛ nɛ Ga yɛ kɛ akɛ lɛ shi yɛ kɛ akɛ nɛ wɔ lɛ kɛ shi nɛ.
Ga yɛ kɛ akɛ lɛ shi yɛ kɛ akɛ nɛ wɔ lɛ kɛ shi nɛ. Akɛ nɛ Ga yɛ kɛ akɛ lɛ shi yɛ kɛ akɛ nɛ wɔ lɛ kɛ shi nɛ.
`.trim()

  console.log(`Text length: ${longText.length} chars, ${getByteLength(longText)} bytes`)
  console.log(`Requires chunking: ${getByteLength(longText) > MAX_QR_BYTES ? "Yes" : "No"}`)

  if (getByteLength(longText) > MAX_QR_BYTES) {
    try {
      const chunks = chunkText(longText, "test-page")
      console.log(`Generated ${chunks.length} chunks:`)

      chunks.forEach((chunk, index) => {
        console.log(`  Chunk ${index + 1}: ${getByteLength(chunk.content)} bytes`)
        console.log(`    Header: ${chunk.content.split(";").slice(0, 2).join(";")};`)
        console.log(`    Content preview: "${chunk.textContent.substring(0, 40)}..."`)
      })

      // Verify chunks can be reassembled
      const reassembled = chunks.map((c) => c.textContent).join("")
      console.log(`\nReassembly test: ${reassembled === longText ? "PASS" : "FAIL"}`)
    } catch (error) {
      console.error(`Chunking failed: ${error.message}`)
    }
  }

  console.log("\n" + "=".repeat(50))
  console.log("Test Examples:")
  console.log("=".repeat(50))

  console.log("\n1. Generate QR from text file:")
  console.log("   node tools/generate-qr.js --input sample.txt --page-id page1 --output ./qr-output/")

  console.log("\n2. Generate QR from direct text:")
  console.log('   node tools/generate-qr.js --text "Akɛ nɛ Ga yɛ" --page-id page1')

  console.log("\n3. Generate SVG format:")
  console.log("   node tools/generate-qr.js --input text.txt --page-id page1 --format svg --size 512")

  console.log("\n4. High error correction for damaged books:")
  console.log("   node tools/generate-qr.js --input text.txt --page-id page1 --error-correction H")
}

// Create sample text file for testing
function createSampleFiles() {
  const sampleDir = path.join(__dirname, "samples")
  if (!fs.existsSync(sampleDir)) {
    fs.mkdirSync(sampleDir)
  }

  // Short sample
  const shortSample = "Akɛ nɛ Ga yɛ kɛ akɛ lɛ shi yɛ kɛ akɛ nɛ wɔ lɛ kɛ shi nɛ."
  fs.writeFileSync(path.join(sampleDir, "short-sample.txt"), shortSample)

  // Long sample
  const longSample = Array(20).fill("Akɛ nɛ Ga yɛ kɛ akɛ lɛ shi yɛ kɛ akɛ nɛ wɔ lɛ kɛ shi nɛ. ").join("")
  fs.writeFileSync(path.join(sampleDir, "long-sample.txt"), longSample)

  console.log(`Sample files created in: ${sampleDir}`)
  console.log("- short-sample.txt (single QR)")
  console.log("- long-sample.txt (chunked QR)")
}

if (require.main === module) {
  runTests()
  console.log("\nCreating sample files...")
  createSampleFiles()
  console.log("\nTests completed!")
}
