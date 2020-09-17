import fs from 'fs'
import path from 'path'
import findUp from 'find-up'
import highlight from 'cli-highlight'
import inqueier from 'inquirer'
import { Template } from './Template'
import ReactScriptsTemplate from './templates/react-scripts'
import NextTemplate from './templates/next'
import chalk from 'chalk'

const templates: Record<string, Template> = {
  'next.js': NextTemplate,
  'create-react-app': ReactScriptsTemplate,
}

function guessTemplateForUsedFramework() {
  return (
    Object.entries(templates).find(([_name, template]) => template.test()) ?? [
      null,
      null,
    ]
  )
}

async function getCypressConfig() {
  const cypressJsonPath = await findUp('cypress.json')

  // TODO figure out how to work with newly installed cypress
  if (!cypressJsonPath) {
    console.log(
      `\nIt looks like you did not install cypress. Can not find ${chalk.green(
        'cypress.json',
      )} in this or parent directories.`,
    )
    process.exit(1)
  }

  return {
    cypressConfigPath: cypressJsonPath,
    config: JSON.parse(
      fs.readFileSync(cypressJsonPath!, { encoding: 'utf-8' }).toString(),
    ) as Record<string, string>,
  }
}

function printCypressJsonHelp(
  cypressJsonPath: string,
  componentFolder: string,
) {
  const resultObject = {
    experimentalComponentTesting: true,
    componentFolder,
    testFiles: '**/*.spec.{js,ts,jsx,tsx}',
  }

  const relativeCypressJsonPath =
    './' + path.relative(process.cwd(), cypressJsonPath)
  const highlightedCode = highlight(JSON.stringify(resultObject, null, 2), {
    language: 'json',
  })

  console.log(
    `\n${chalk.bold('1.')} Add this to the ${chalk.green(
      relativeCypressJsonPath,
    )}`,
  )

  console.log(`\n${highlightedCode}\n`)
}

function printPluginHelper(
  pluginCode: string,
  cypressConfigPath: string,
  cypressConfig: Record<string, string>,
) {
  const highlightedPluginCode = highlight(pluginCode, { language: 'js' })
  const defaultPluginFilePath = path.resolve(
    path.dirname(cypressConfigPath),
    'cypress',
    'plugins',
    'index.js',
  )

  const pluginsFilePath =
    './' +
    path.relative(
      process.cwd(),
      cypressConfig.pluginsFile || defaultPluginFilePath,
    )

  const stepTitle = fs.existsSync(pluginsFilePath)
    ? `And this to the ${chalk.green(pluginsFilePath)}`
    : `And this to your plugins file (https://docs.cypress.io/guides/tooling/plugins-guide.html)`

  console.log(`${chalk.bold('2.')} ${stepTitle}:`)
  console.log(`\n${highlightedPluginCode}\n`)
}

async function main() {
  const { config, cypressConfigPath } = await getCypressConfig()
  const [defaultTemplateName, defaultTemplate] = guessTemplateForUsedFramework()

  const templateChoices = Object.keys(templates).sort(key =>
    key === defaultTemplateName ? -1 : 0,
  )

  const { installationTemplate, componentFolder } = await inqueier.prompt([
    {
      type: 'list',
      name: 'installationTemplate',
      choices: templateChoices,
      default: defaultTemplate ? 0 : undefined,
      message: defaultTemplate?.message
        ? `${defaultTemplate?.message}\n\n Press {Enter} to continue with this configuration or select other template from the list:`
        : 'We were not able to automatically determine which framework you are using. Please choose from the list which configuration to use:',
    },
    {
      type: 'input',
      name: 'componentFolder',
      filter: input => input.trim(),
      message: 'Which folder would you like to use for component tests?',
      default: (answers: { installationTemplate: keyof typeof templates }) =>
        templates[answers.installationTemplate].recommendedComponentFolder,
    },
  ])

  const userTemplate = templates[installationTemplate]

  printCypressJsonHelp(cypressConfigPath, componentFolder)
  printPluginHelper(userTemplate.pluginsCode, cypressConfigPath, config)
}

main().catch(e => console.error(e))
