// NEXT_DIST_DIR lets a test build run alongside `next dev` without clobbering .next
module.exports = { output: 'standalone', distDir: process.env.NEXT_DIST_DIR || '.next' };
