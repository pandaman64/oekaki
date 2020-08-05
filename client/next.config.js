module.exports = {
  distDir: 'target',
  generateBuildId: async () => {
    return process.env.NEXT_BUILD_ID || 'next-build'
  },
}
