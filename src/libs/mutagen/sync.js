const { mutagenCli } = require('./commands')
const { deepMerge, get } = require('jsutils')
const { buildIgnore, buildMountPath, buildMutagenArgs } = require('./helpers')

/**
 * Default sync argument options
 * @object
 */
const syncDefs = {
  create: {
    args: {
      defaultFileMode: '0644',
      defaultDirectoryMode: '0755',
      syncMode: `two-way-resolved`,
      ignoreVcs: true
    },
    ignore: [
      '/node_modules',
      '/core/base/assets/*',
      '/.*',
      '!/.storybook',
      '*.lock',
      '*.md',
      '/temp',
      '/web-build',
      '/reports',
      '/build',
      '/docs',
    ]
  }
}

class Sync {

  constructor(mutagen){
    this.mutagen = mutagen
    this.options = deepMerge(syncDefs, this.mutagen.options)
  }

  /**
  * Gets a list of all the current mutagen syncs
  * <br/> Allows parsing the format into json
  * @member Sync
  * @function
  * @param {Object} args - determine how the command and output should be handled
  * @param {Array} args.opts - Extra options to pass to the mutagenCli command
  * @param {string} args.format - Output format type ( text || json )
  * @param {boolean} args.log - Should the command being run be logged
  *
  * @returns {*} - response local the mutagen CLI
  */
  list = async (args={}) => {
    const { opts=[] } = args

    return mutagenCli({
      ...args,
      isList: true,
      opts: [ `sync`, `list` ].concat(opts),
    })
  }

  /**
  * Creates a sync between the local machine an a docker container
  * <br/> First builds the args, then the full create string, then calls the mutagen CLI 
  * @member Sync
  * @function
  * @param {Object} args - Location on the local host to be synced
  * @param {Object} args.ignore - All paths that the sync should ignore
  * @param {string} local - Location on the local host to be synced
  * @param {string} remote - Location on the docker container to be synced
  * @param {string} container - The id of the container to sync with
  *
  * @returns {*} - response local the mutagen CLI
  */
  create = async (args) => {
    const { container, options, name, log } = args
    const argsStr = buildMutagenArgs(deepMerge(get(this, 'options.create', {}), options))
    const mountPath = buildMountPath(args)

    return mutagenCli({
      log,
      opts: `sync create --name=${ name } ${ argsStr } ${ mountPath }`,
    })

  }

  /**
  * Gets a list of all the current mutagen syncs
  * <br/> Allows parsing the format into json
  * @member Sync
  * @function
  * @param {Object} args - determine how find the sync item
  * @param {Object} args.name - Name of the sync item to find
  * @param {string} args.otherArgs - Arguments for the sync.list command
  *
  * @returns {*} - response local the mutagen CLI
  */
  get = async args => {
    const { name, ...otherArgs } = args
    const list = await this.list({ ...otherArgs, format: 'json' })

    return list.find(item => item.name === name)
  }

}

module.exports = {
  Sync
}