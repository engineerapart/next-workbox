const withWorkbox = require('../../index')

module.exports = withWorkbox({
  exportPathMap: () => {
    return {};
  },
  workbox: {
    importWorkboxFrom: 'cdn',
    removeDir: true,
    registerSW: true,
  }
})
