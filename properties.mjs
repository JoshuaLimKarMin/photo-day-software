"use strict"

console.log('Copyright (C) Joshua Lim 2021 - 2023\n\n\n')

import fs from 'fs'
import http from 'http'
import zlib from 'zlib'
import readline from 'readline'
import { WebSocketServer } from 'ws'
const commandlineSystem = await import('./modules/commandline_system.mjs')

console.log('Startup initiated...')

commandlineSystem.fileLoader()

//Testing code start

// await new Promise(resolve => setTimeout(() => {
//    commandlineSystem.commandHandler('get')
//    resolve()
// }, 500))

// await new Promise(resolve => setTimeout(() => {
//    commandlineSystem.reloadCommands('all')
//    resolve()
// }, 500))

// process.exit()

// Test code end

// File location declaration

const dynamicStore = './database/dynamic/'

// Data cache

const HTMLFiles = new Map()
let classes
let clubs
let category
let faculty
let students
let teachers
let workers
const photoIDIndex = new Map()

// Functions

const loadHTMLFiles = () => {
   const HTMLDirectory = fs.readdirSync('./html')

   for(const HTMLFile of HTMLDirectory){
      HTMLFiles.set(HTMLFile.replace('.html', ''), zlib.gzipSync(fs.readFileSync(`./html/${HTMLFile}`), { level: 9 }))

      console.log(`File loaded: ${HTMLFile}`)
   }
}

const sendHTML = (res, HTMLFileName, statusCode = 200) => {
   res.writeHead(statusCode, {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Encoding": "gzip"
   })
   res.end(HTMLFiles.get(HTMLFileName))
}

const loadData = () => {
   const fixedStore = './database/fixed'
   const classesAndClubsFile = JSON.parse(fs.readFileSync(`${fixedStore}/classes&clubs.json`))
   const studentsFacultyFile = JSON.parse(fs.readFileSync(`${fixedStore}/students&faculty.json`))

   classes = classesAndClubsFile.classes
   clubs = classesAndClubsFile.clubs
   category = classesAndClubsFile.category
   faculty = classesAndClubsFile.faculty
   students = studentsFacultyFile.students
   teachers = studentsFacultyFile.teachers
   workers = studentsFacultyFile.workers

   console.log(classes)
   console.log(clubs)
   console.log(category)
   console.log(faculty)
   console.table(students)
   console.table(teachers)
   console.table(workers)
}

const loadDynamicData = () => {
   const indexPhotos = dir => {
      const items = fs.readdirSync(dir)

      for(const item of items){
         const stat = fs.lstatSync(`${dir}/${item}`)

         if(stat.isDirectory())indexPhotos(`${dir}/${item}`)
         else{
            const fileData = JSON.parse(fs.readFileSync(`${dir}/${item}`))

            photoIDIndex.set(fileData.id, fileData)
         }
      }
   }

   indexPhotos('./database/dynamic')

   console.table(photoIDIndex)
}

// Load data to memory

console.log('Loading HTML files...')
loadHTMLFiles()
console.log('All files loaded: ', HTMLFiles)
console.log('HTML files loaded to memory.')

console.log('Loading Fixed database...')
loadData()
console.log('Fixed database loaded to memory.')

console.log('Loading dynamic database data...')
loadDynamicData()
console.log('Dynamic database loaded to memory.')

// HTTP server

const server = http.createServer(async(req, res) => {
   console.log(req.headers)
   const pathArray = req.url.split('/')

   if(req.headers.connection === 'Upgrade' && req.headers.upgrade === 'websocket')return

   if(req.method === 'POST'){
      let data

      await new Promise(resolve => req.on('data', async chunk => {
         try{
            data = JSON.parse(chunk.toString())

         }catch(error){
            console.log(error)

            res.writeHead(400, {
               "Content-Type": "application/json"
            })

            return res.end(JSON.stringify({
               reason: "Syntax error, must be converted to JSON before sending to server"
            }))
         }

         resolve()
      }))

      if(!data.classClubID){
         res.writeHead(400, {
            "Content-Type": "application/json"
         })

         return res.end(JSON.stringify({
            reason: "Class / Club ID is undefined"
         }))
      }

      const refID = data.classClubID.replace('#', '')
      const number = parseInt(refID, 16)

      switch(pathArray[1]){
         case 'find_id':
            let classClubData = null
            let type
            let studentsList
            let teachersList
            let workersList

            console.log(number)

            Object.keys(faculty).find(value => {
               if(value === refID){
                  classClubData = faculty[value]
                  type = 'faculty'
               }
            })
            Object.keys(category).find(value => {
               if(value === refID){
                  classClubData = category[value]
                  type = 'category'
               }
            })
            Object.keys(clubs).find(value => {
               if(value === refID){
                  classClubData = clubs[value]
                  type = 'club'
               }
            })
            Object.keys(classes).find(value => {
               if(value === refID){
                  classClubData = classes[value]
                  type = 'class'
               }
            })

            if(!classClubData){
               res.writeHead(404, {
                  "Content-Type": "application/json"
               })

               res.end(JSON.stringify({
                  reason: "Ref ID not found"
               }, null, 2))

               return
            }

            classClubData

            const find = (findList, charNeeded, referenceList) => {
               const returnList = {}

               if(findList[0]?.command?.length){
                  for(let i = 0 ; i < findList[0].command.length - 1 ; i++){
                     if(findList[0].command === undefined || findList[0].command[i][0] !== 'bulkSelect')continue

                     const starting = parseInt(findList[0].command[i][1], 16)
                     const ending = parseInt(findList[0].command[i][2], 16)
                     const exclusion = []

                     if(findList[0].command[i][3])for(const excluded of findList[0].command[i][3])exclusion.push(parseInt(excluded, 16))

                     for(let i = starting ; i <= ending ; i++){
                        const checkChar = (number = i.toString(16)) => {
                           if(number.length < charNeeded)return checkChar(`0${number}`)

                           returnList[number] = referenceList[number]
                        }

                        if(exclusion.find(value => value === i))continue

                        checkChar()
                     }
                  }
               }

               if(findList){
                  for(const ID of findList){
                     if(typeof ID === 'object')continue
                     returnList[ID] = referenceList[ID]
                  }
               }

               return returnList
            }

            if(classClubData.students)studentsList = find(classClubData.students, 3, students)
            if(classClubData.teachers)teachersList = find(classClubData.teachers, 3, teachers)
            if(classClubData.workers)workersList = find(classClubData.workers, 3, workers)

            res.writeHead(200, {
               "Content-Type": "application/json"
            })

            const storeLocation = `${dynamicStore}/${refID.split('')[0]}0`

            if(!fs.existsSync(`${storeLocation}/${refID}.json`)){
               if(!fs.existsSync(storeLocation))fs.mkdirSync(storeLocation)
               fs.writeFileSync(`${storeLocation}/${refID}.json`, JSON.stringify({
                  id: refID,
                  position: {}
               }, null, 2))
            }

            res.end(JSON.stringify({
               classClubName: classClubData.name,
               refID: `#${refID}`,
               type,
               studentsList,
               teachersList,
               workersList
            }, null, 2))

            break

         case 'save_position':
            const { position } = data

            if(!position || Object.keys(position).length === 0){
               res.writeHead(400, {
                  "Content-Type": "application/json"
               })

               res.end(JSON.stringify({
                  reason: "No position given or position object is empty."
               }, null, 2))
            }

            photoIDIndex.get(refID).position = position

            fs.writeFileSync(`${dynamicStore}/${refID.split('')[0]}0/${refID}.json`, JSON.stringify(photoIDIndex.get(refID), null, 2))

            res.writeHead(201, {
               "Content-Type": "text/plain"
            })

            res.end('ok')

            break
      }

      return
   }

   switch(pathArray[1]){
      case '':
         sendHTML(res, 'main_page')

         break

      case 'commandline':
         sendHTML(res, 'command_line')

         break

      case 'development':
         if(HTMLFiles.get(pathArray[2]))sendHTML(res, pathArray[2])

         else sendHTML(res, 'not_found', 404)

         break

      default:
         sendHTML(res, 'not_found', 404)

   }
})

const wsServer = new WebSocketServer({ noServer: true })

wsServer.on('connection', (socket, request) => {
   const connectionCache = {
      lastCommunicationTime: Date.now(),
      lastPingResponded: true,
   }

   const pingSystem = setInterval(() => {
      if(Date.now() - connectionCache.lastCommunicationTime < 10000)return console.log('Ping cancelled')
      if(connectionCache.lastPingResponded === false){
         console.log('\x1b[1m\x1b[33m%s\x1b[0m', '[ALERT]: Connection dropped because client timed out')

         clearInterval(pingSystem)

         return socket.close(undefined, 'CONNECTION_TIMED_OUT')
      }

      socket.send('ping')

      connectionCache.lastPingResponded = false
   }, 10000)

   socket.on('error', error => console.log(error))

   socket.on('message', data => {
      console.log('Received: %s', data)

      if(data.toString() === 'ping')return connectionCache.lastPingResponded = true

      connectionCache.lastCommunicationTime = Date.now()

      const packageJsonData = JSON.parse(fs.readFileSync('./package.json'))
      const jsonData = JSON.parse(data)

      const dependenciesVersion = {}
      
      for(const entry of Object.entries(packageJsonData.dependencies))dependenciesVersion[entry[0]] = entry[1].replace('^', '')

      if(jsonData.request === 'versions'){
         socket.send(JSON.stringify({
            reply: jsonData.request,
            body: {
               appVersion: `${packageJsonData.version}${packageJsonData.build ? `.${packageJsonData.build}` : ''}`,
               nodeVersion: process.version,
               dependencies: dependenciesVersion
            }
         }, null, 2))
      }

      if(jsonData.command && jsonData.command !== '')commandlineSystem.commandHandler(jsonData.command, socket, { classes, clubs, category, faculty, peopleGroup: { students, teachers, workers }, photoIDIndex })
   })
})

server.on('upgrade', (req, socket, upgradeHead) => {
   if(req.headers.upgrade !== 'websocket')return socket.destroy()
   if(req.url === '/commandline')wsServer.handleUpgrade(req, socket, upgradeHead, wsConnection => wsServer.emit('connection', wsConnection, req))
})

await new Promise(resolve => server.listen(5510, async() => {
   console.log('Web server online on port 5510')

   resolve()
}))

const htmlWatcher = fs.watch('./html', loadHTMLFiles)

const rl = readline.createInterface({
   input: process.stdin,
   output: process.stdout,
   prompt: ""
})

console.log('\n\nCommand line interface (CLI) ready\n\n')

// rl.prompt()

rl.on('line', input => {})

rl.on('SIGINT', () => {
   server.close()
   rl.close()
   htmlWatcher.close()
})