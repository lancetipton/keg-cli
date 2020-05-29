const { compareItems, noItemError, cmdSuccess } = require('./helpers')
const { remove, dockerCli, dynamicCmd } = require('./commands')
const { isArr, toStr, isStr } = require('jsutils')

// Container commands the require an item argument of the container id or name
const containerItemCmds = [
  'commit',
  'inspect',
  'kill',
  'logs',
  'pause',
  'prune',
  'restart',
  'stop',
  'top',
  'unpause',
  'update'
]

/**
 * Helper to format the docker command call and options
 * Then calls the dockerCli
 * @function
 * @param {Object} args - Arguments used to modify the docker api call
 * @param {string} args.opts - Options used to build the docker command
 * @param {string} args.format - Format of the docker command output
 *
 * @returns {*} - Response from the docker command call
 */
const runDockerCmd = (args={}, opts) => {
  opts = opts || args.opts
  return dockerCli({
    ...args,
    opts: [ 'container' ].concat(
      isArr(opts)
        ? opts
        : isStr(opts)
          ? opts.split(' ')
          : []
    )
  })
}

/**
 * Calls the docker api and gets a list of current containers
 * @function
 * @param {Object} args - Arguments used to modify the docker api call
 * @param {string} args.opts - Options used to build the docker command
 * @param {string} args.format - Format of the docker command output
 *
 * @returns {Array} - JSON array of containers
 */
const list = (args={}) => {
  return runDockerCmd({ format: 'json', ...args }, [ 'ls', '-a' ])
}

/**
 * Helper to ensure the item exists, and calls dockerRunCmds
 * @function
 * @param {Object} args - Arguments used to modify the docker api call
 * @param {string} args.opts - Options used to build the docker command
 * @param {string} args.format - Format of the docker command output
 * @param {string} cmd - Name of the command to run
 *
 * @returns {*} - Response from the docker command
 */
const runCmdForItem = async (args, cmd) => {
  if(!args.item) return noItemError(`docker.container.${ cmd }`, true)
  const res = await runDockerCmd(args, [ cmd, args.item ])

  return cmdSuccess(cmd, res)
}

/**
 * Creates container item commands based on command
 * @object
 */
const containerCmds = containerItemCmds.reduce((commands, command) => {
  commands[command] = args => runCmdForItem(args, command)
  return commands
}, {})

/**
 * Kills, then removes a docker container based on passed in arguments
 * @function
 * @param {Object} args - Arguments used to kill and remove a container
 * @param {string} args.opts - Options used to build the docker command
 * @param {string} args.format - Format of the docker command output
 *
 * @returns {boolean} - If the Docker command successfully ran
 */
const destroy = async args => {
  await containerCmds.kill({ ...args, skipError: true, errResponse: false })
  const res = await removeContainer({
    ...args,
    skipError: true,
    errResponse: false
  })

  return cmdSuccess('destroy', res)
}

/**
 * Removes a docker image based on passed in toRemove argument
 * @function
 * @param {Object} args - Arguments used in the docker remove command
 * @param {string} args.opts - Options used to build the docker command
 * @param {string} args.format - Format of the docker command output
 *
 * @returns {string} - Response from the docker cli command
 */
const removeContainer = args => {
  return args.item
    ? remove({ ...args, type: 'container' })
    : noItemError(`docker.container.remove`, true)
} 

/**
 * Checks if an container already exists ( is built )
 * @function
 * @param {string} compare - Value to compare each container with
 * @param {string|function} doCompare - How to compare each container
 *
 * @returns {boolean} - Based on if the container exists
 */
const exists = async (compare, doCompare, format) => {
  // Get all current containers
  const containers = await list({ errResponse: [], format: 'json' })

  // If we have containers, try to find the one matching the passed in argument
  return containers &&
    containers.length &&
    containers.some(container => compareItems(
      container,
      compare,
      doCompare,
      [ 'containerId', 'names' ]
    ))
}

/**
 * Root docker container method to run docker container commands
 * @function
 * @param {Object} args - Options to pass to the docker container command
 * @param {string} args.opts - Options used to build the docker command
 * @param {string} args.format - Format of the docker command output
 *
 * @returns {string|Array} - Response from docker cli
 */
const container = (args={}) => dynamicCmd(args, 'container')

// Add the sub-methods to the root docker image method
Object.assign(container, {
  ...containerCmds,
  destroy,
  exists,
  list,
  remove: removeContainer,
})

module.exports = container