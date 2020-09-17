import path from 'path'
import fs from 'fs'
import findUp from 'find-up'

type PackageJsonLike = {
  name?: string
  scripts?: Record<string, string>
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
}

type FindPackageJsonResult = {
  packageData: PackageJsonLike | undefined
  filename: string | undefined
  done: boolean
}

/**
 * Return the parsed package.json that we find in a parent folder.
 *
 * @returns {Object} Value, filename and indication if the iteration is done.
 */
export function createFindPackageJsonIterator(rootPath = process.cwd()) {
  function scanForPackageJson(cwd: string): FindPackageJsonResult {
    const packageJsonPath = findUp.sync('package.json', { cwd })
    if (!packageJsonPath) {
      return {
        packageData: undefined,
        filename: undefined,
        done: true,
      }
    }

    const packageJsonBuffer = fs.readFileSync(packageJsonPath)
    const packageData = JSON.parse(packageJsonBuffer.toString('utf-8'))

    return {
      packageData,
      filename: packageJsonPath,
      done: false,
    }
  }

  return {
    map: (cb: (data: PackageJsonLike) => { continue: boolean }) => {
      let stepPathToScan = rootPath

      while (true) {
        const { done, packageData } = scanForPackageJson(stepPathToScan)

        if (done) {
          // didn't find the package.json
          return false
        }

        if (packageData) {
          const cbResult = cb(packageData!)
          if (!cbResult.continue) {
            return true
          }
        }

        stepPathToScan = path.resolve(stepPathToScan, '..')
      }
    },
  }
}
