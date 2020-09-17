import semver from 'semver'
import { createFindPackageJsonIterator } from '../findPackageJson'
import { Template } from '../Template'
import { MIN_SUPPORTED_VERSION } from '../versions'

const template: Template = {
  message: 'It looks like you are using next.js.',
  recommendedComponentFolder: 'cypress/component',
  pluginsCode: [
    "const preprocessor = require('cypress-react-unit-test/plugins/next')",
    'module.exports = (on, config) => {',
    '  preprocessor(on, config)',
    '  // IMPORTANT to return the config object',
    '  return config',
    '}',
  ].join('\n'),
  test: () => {
    const packageJsonIterator = createFindPackageJsonIterator(process.cwd())

    return packageJsonIterator.map(({ dependencies, devDependencies }) => {
      if (dependencies || devDependencies) {
        const allDeps = { ...devDependencies, ...dependencies } || {}

        if (allDeps['next']) {
          const version = semver.minVersion(allDeps['next'])?.raw

          if (
            !version ||
            !semver.satisfies(version, MIN_SUPPORTED_VERSION.next)
          ) {
            throw new Error(
              `It looks like you are using next.js, but we support only next.js projects with version ${MIN_SUPPORTED_VERSION.next}`,
            )
          }

          return { continue: false }
        }
      }

      return { continue: true }
    })
  },
}

export default template
