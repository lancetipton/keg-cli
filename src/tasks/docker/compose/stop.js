const { Logger } = require('KegLog')
const { DOCKER } = require('KegConst')
const { spawnCmd } = require('KegProc')
const { buildContainerContext } = require('KegUtils/builders/buildContainerContext')
const { buildComposeCmd } = require('KegUtils/docker')

/**
 * Runs the docker-compose build command
 * @function
 * @param {Object} args - arguments passed from the runTask method
 * @param {Object} args.globalConfig - Global config object for the keg-cli
 *
 * @returns {void}
 */
const composeStop = async args => {
  const { globalConfig, __internal, params } = args
  const { log } = params
  
  // Get the context data for the command to be run
  const containerContext = await buildContainerContext(args)
  const { location, cmdContext, contextEnvs } = containerContext

  // Build the docker compose command
  const dockerCmd = await buildComposeCmd(
    globalConfig,
    'stop',
    cmdContext,
    params
  )

  // Run the docker compose build command
  await spawnCmd(
    dockerCmd,
    { options: { env: contextEnvs }},
    location,
    !Boolean(__internal),
  )

  log && Logger.highlight(`Compose service`, `"${ cmdContext }"`, `stopped!`)

  return containerContext

}

module.exports = {
  stop: {
    name: 'stop',
    alias: [ 'stp', 'halt' ],
    action: composeStop,
    description: `Run docker-compose stop command`,
    example: 'keg docker compose stop <options>',
    options: {
      context: {
        allowed: DOCKER.IMAGES,
        description: 'Context of docker compose down command (tap | core | components)',
        example: 'keg docker compose stop --context core',
        required: true
      },
      log: {
        description: 'Log the compose command to the terminal',
        example: 'keg docker compose build --log false',
        default: true,
      },
      tap: {
        description: 'Name of the tap to down. Required when "context" is "tap"',
        example: 'keg docker compose stop --context tap --tap events-force',
      },
    }
  }
}