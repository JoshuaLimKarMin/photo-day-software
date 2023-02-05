"use strict"

import fs from 'fs'
import http from 'http'
import zlib from 'zlib'
import readline from 'readline'

console.log('Startup initiated...')

// File location declaration

const dynamicStore = './database/dynamic/'

// Data cache

const HTMLFiles = new Map()
let classes
let clubs
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
   faculty = classesAndClubsFile.faculty
   students = studentsFacultyFile.students
   teachers = studentsFacultyFile.teachers
   workers = studentsFacultyFile.workers

   console.log(classes)
   console.log(clubs)
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

http.createServer(async(req, res) => {
   const pathArray = req.url.split('/')

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
            let studentsList
            let teachersList
            let workersList

            console.log(number)

            Object.keys(faculty).find(value => {if(value === refID)classClubData = faculty[value]})
            Object.keys(clubs).find(value => {if(value === refID)classClubData = clubs[value]})
            Object.keys(classes).find(value => {if(value === refID)classClubData = classes[value]})

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
               className: classClubData.name,
               refID: `#${refID}`,
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

      case 'development':
         if(HTMLFiles.get(pathArray[2]))sendHTML(res, pathArray[2])

         else sendHTML(res, 'not_found', 404)

         break

      default:
         sendHTML(res, 'not_found', 404)

   }
}).listen(5510, () => console.log('Web server online on port 5510'))

fs.watch('./html', loadHTMLFiles)