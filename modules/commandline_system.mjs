import fs from 'fs'
import { createRequire } from'module'
const require = createRequire(import.meta.url)

const commandCache = {}

export const fileLoader = () => {
   const scan = dir => {
      for(const item of fs.readdirSync(dir)){
         if(fs.lstatSync(`${dir}/${item}`).isDirectory()){
            scan(`${dir}/${item}`)
            continue
         }

         if(!item.endsWith('.js'))continue

         try{
            const jsFile = require(`../${dir}/${item}`)

            console.log(`\nFile loaded: ${item}\nChecking file header...`)

            const removeRequireCache = () => {
               console.log('\x1b[1m\x1b[34m%s\x1b[0m', '[INFO]: Unloading file...')
               delete require.cache[require.resolve(`../${dir}/${item}`)]
            }

            const { command, disabled } = jsFile

            if(!command || typeof command !== 'string' || command === ''){
               console.log('\x1b[1m\x1b[31m%s\x1b[0m', `[WARNING]: "${item}" rejected due to command header not meeting the requirements.`)
               removeRequireCache()
               continue
            }

            if(disabled){
               console.log('\x1b[1m\x1b[34m%s\x1b[0m', `[INFO]: ${command} Command disabled.`)
               removeRequireCache()
               commandCache[command] = {
                  disabled: true
               }
               continue
            }

            const commandData = {
               commandPath: `../${dir}/${item}`
            }

            for(const entry of Object.entries(jsFile)){
               if(entry[0] === 'command' || entry[0] === 'disabled')continue

               commandData[entry[0]] = entry[1]
            }
            commandCache[command] = commandData

         }catch(error){
            console.log(`There was an error when loading file "${item}".`)
            console.log(error)
         }
      }
   }
   scan('./modules/cli_commands')
}

export const commandHandler = () => {}

export const reloadCommands = () => {}