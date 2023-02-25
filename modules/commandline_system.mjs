import fs from 'fs'
import { createRequire } from'module'
const require = createRequire(import.meta.url)

let commandReference = {}
let commandCache = []

let mode  = 'normal'

export const fileLoader = (fileToReload = null, assignID = null) => {
   const scan = dir => {
      for(const item of fs.readdirSync(dir)){
         if(fs.lstatSync(`${dir}/${item}`).isDirectory()){
            scan(`${dir}/${item}`)
            continue
         }

         // "-tof.js" = Test-Only-Files.js
         if(!item.endsWith('.js') || item.endsWith('-tof.js'))continue

         try{
            const jsFile = require(`../${dir}/${item}`)

            console.log(`\nFile loaded: ${item}\nChecking file header...`)

            const removeRequireCache = () => {
               console.log('\x1b[1m\x1b[34m%s\x1b[0m', '[INFO]: Unloading file...')
               delete require.cache[require.resolve(`../${dir}/${item}`)]
            }

            const { command, disabled, alias, mode, callback } = jsFile

            if(!command || typeof command !== 'string' || command === ''){
               console.log('\x1b[1m\x1b[31m%s\x1b[0m', `[WARNING]: "${item}" rejected due to command header not meeting the requirements.`)
               removeRequireCache()
               continue
            }

            if(disabled){
               console.log('\x1b[1m\x1b[34m%s\x1b[0m', `[INFO]: ${command} Command disabled.`)
               removeRequireCache()
               continue
            }

            if(!callback){
               console.log('\x1b[1m\x1b[31m%s\x1b[0m', `[WARNING]: "${item}" rejected due to command not having a callback.`)
               removeRequireCache()
               continue
            }

            commandReference[command] = commandCache.length

            if(jsFile.alias)for(const alias of jsFile.alias)commandReference[alias] = commandCache.length

            const commandNames = [ command ]

            const commandData = {
               commandNames,
               mode: mode ? mode : ['normal'],
               commandFilePath: `../${dir}/${item}`
            }

            for(const alt of alias)commandNames.push(alt)

            for(const entry of Object.entries(jsFile)){
               if(entry[0] === 'command' || entry[0] === 'disabled' || entry[0] === 'alias')continue

               commandData[entry[0]] = entry[1]
            }

            console.log(jsFile, '\n', commandData)
            console.table(commandReference)
            commandCache.push(commandData)

         }catch(error){
            console.log(`There was an error when loading file "${item}".`)
            console.log(error)
         }
      }
   }

   scan('./modules/cli_commands')

   console.log(commandCache)
}

export const commandHandler = (request, socket, cachedData) => {
   if(typeof request !== 'string')return console.log('Command is not of type string')

   const requestArray = request.split(/[ ]/g)
   const commandName = requestArray[0].toLowerCase()
   requestArray.shift()
   const args = requestArray

   if(commandName === '')return console.log('Command is empty')

   console.log("\nCommand execute request: " + request + '\x1b[1m\x1b[34m%s\x1b[0m', '\n[INFO]: Finding command...')

   if(commandName === 'reload' || commandName === 'r'){
      console.log('\x1b[1m\x1b[33m%s\x1b[0m', '[ALERT]: Reload command execution requested\n[ALERT]: Executing reload...\n')
      reloadCommands('all')

      return socket.send(JSON.stringify({
         writeOutput: 'Reload command executed and has completed successfully'
      }))
   }

   const command = commandCache[commandReference[commandName]]

   if(!command){
      console.log('Command not found')
      return socket.send(JSON.stringify({
         writeOutput: 'Command not found'
      }))
   }

   if(!command.mode.find(value => value === mode))return console.log('Mode is not compatible.')

   command.callback(socket, args, args.join(), cachedData)
}

export const reloadCommands = resetCommand => {
   const resetRequire = module => {
      console.log('\x1b[1m\x1b[33m%s\x1b[0m', '[ALERT]: Deleting required module: ' + module)
      delete require.cache[require.resolve(module)]
   }

   if(resetCommand === 'all'){
      for(const command of commandCache)resetRequire(command.commandFilePath)

      console.log('\x1b[1m\x1b[33m%s\x1b[0m', '[ALERT]: Resetting cache...')

      commandCache = []
      commandReference = []

      console.log('\x1b[1m\x1b[34m%s\x1b[0m', '[INFO]: Reloading commands...')

      fileLoader()
      return
   }

   if(!commandReference[resetCommand])return console.log('Command not found.')

   const currentVersion = commandCache[commandReference[resetCommand]]
   const currentReferenceID = commandReference[resetCommand]

   delete commandCache[commandReference[resetCommand]]
   for(const commandName of currentVersion.commandNames)delete commandReference[commandName]

   // fileLoader(currentVersion.commandFilePath, currentReferenceID)
}