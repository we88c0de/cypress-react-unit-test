import semver from 'semver'
import { createFindPackageJsonIterator } from '../findPackageJson'
import { Template } from '../Template'
import { MIN_SUPPORTED_VERSION } from '../versions'

const template: Template = {
  recommendedComponentFolder: 'src',
  message: 'It looks like you are using create-react-app.',
  pluginsCode: [
    "const preprocessor = require('cypress-react-unit-test/plugins/react-scripts')",
    'module.exports = (on, config) => {',
    '   preprocessor(on, config)',
    '  // IMPORTANT to return the config object',
    '  return config',
    '}',
  ].join('\n'),
  test: () => {
    // TODO also determine ejected create react app
    const packageJsonIterator = createFindPackageJsonIterator(process.cwd())

    return packageJsonIterator.map(({ dependencies, devDependencies }) => {
      if (dependencies || devDependencies) {
        const allDeps = { ...devDependencies, ...dependencies } || {}

        if (allDeps['react-scripts']) {
          const version = semver.minVersion(allDeps['react-scripts'])?.raw

          if (
            !version ||
            !semver.satisfies(version, MIN_SUPPORTED_VERSION['react-scripts'])
          ) {
            throw new Error(
              `It looks like you are using create-react-app, but we support only ${MIN_SUPPORTED_VERSION['react-scripts']} version of react-scripts`,
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
