const { join } = require('path')
const { writeFileSync } = require('fs')
const findCacheDir = require('find-cache-dir')
const NextWorkboxWebpackPlugin = require('@engineerapart/next-workbox-webpack-plugin')
const { registerScript } = require('./service-worker-register')

const defaultRegisterSW = {
  src: '/static/workbox/sw.js',
  scope: '../../'
}

const defaultWorkbox = {
  registerScope: defaultRegisterSW,
  includeDev: false,
}

const appendRegisterSW = (entry, content) => {
  const originalEntry = entry
  const output = join(findCacheDir({ name: 'next-workbox', create: true }), 'register-sw.js')

  writeFileSync(output, content)

  return async () => {
    const entries = await originalEntry()

    if (entries['main.js']) {
      entries['main.js'].unshift(output)
    }

    return entries
  }
}


module.exports = (nextConfig = {}) => {
  return Object.assign({}, nextConfig, {
    webpack(config, options) {
      const {
        isServer,
        dev,
        buildId,
        defaultLoaders,
        dir,
        config: {
          distDir
        }
      } = options

      if (!defaultLoaders) {
        throw new Error(
          'This plugin is not compatible with Next.js versions below 5.0.0 https://err.sh/next-plugins/upgrade'
        )
      }

      const {
        webpack,
        workbox = {}
      } = nextConfig

      const workboxOptions = { ...defaultWorkbox, ...workbox }
      const { registerSW, registerScope, includeDev, ...workboxConfig } = workboxOptions

      if ((!isServer && !dev) || includeDev) {
        // append server-worker register script to main.js chunk
        if (registerSW) {
          let content = typeof registerSW === 'string' ? registerSW : '';
          if (!content) {
            content = registerScript(registerScope)
          }
          config.entry = appendRegisterSW(config.entry, content)
        }

        // push workbox webpack plugin
        config.plugins.push(new NextWorkboxWebpackPlugin({
          ...workboxConfig,
          distDir: join(dir, distDir),
          buildId,
        }))
      }

      if (typeof webpack === 'function') {
        return webpack(config, options)
      }

      return config
    }
  })
}
