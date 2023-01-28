"use strict"

import fs from 'fs'
import http from 'http'
import zlib from 'zlib'
import readline from 'readline'

console.log('Startup initiated...')

// Data cache

const HTMLFiles = new Map()
let classes
let clubs
let students
let teachers
let workers

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
   const classesAndClubsFile = JSON.parse(fs.readFileSync('./database/fixed/classes&clubs.json'))
   const studentsFacultyFile = JSON.parse(fs.readFileSync('./database/fixed/students&faculty.json'))

   classes = classesAndClubsFile.classes
   clubs = classesAndClubsFile.clubs
   students = studentsFacultyFile.students
   teachers = studentsFacultyFile.teachers
   workers = studentsFacultyFile.workers

   console.log(classes)
   console.log(clubs)
   console.log(students)
   console.log(teachers)
   console.log(workers)
}

// Load data to memory

console.log('Loading HTML files...')

loadHTMLFiles()

console.log('All files loaded: ', HTMLFiles)
console.log('HTML files successfully loaded to memory.')

console.log('Loading class, student and faculty...')

loadData()

console.log('Class, student and faculty list loaded to memory.')

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

      switch(pathArray[1]){
         case 'find_id':
            if(!data.photoID){
               res.writeHead(400, {
                  "Content-Type": "application/json"
               })
   
               return res.end(JSON.stringify({
                  reason: "PhotoID is undefined"
               }))
            }

            let refID = data.photoID.replace('#', '')

            let exist = false
            let classClubData = null
            let studentsList
            let teachersList
            let workersList

            console.log(parseInt(`0x${refID}`))

            if(parseInt(`0x${refID}`) >= 50)for(const club of Object.keys(clubs)){

            }else if(parseInt(`0x${refID}`) >= 50)for(const club of Object.keys(clubs)){
               if(club !== refID)continue

               exist = true
               classClubData = clubs[club]

               break

            }else for(const class1 of Object.keys(classes)){
               if(class1 !== refID)continue

               exist = true
               classClubData = classes[class1]

               break
            }

            if(!exist){
               res.writeHead(404, {
                  "Content-Type": "application/json"
               })

               res.end(JSON.stringify({
                  reason: "Ref ID not found"
               }, null, 2))

               return
            }

            const find = (findList, charNeeded, referenceList) => {
               const returnList = {}

               if(findList[0].command !== undefined && findList[0].command[0] === 'bulkSelect'){
                  const starting = parseInt(findList[0].command[1], 16)
                  const ending = parseInt(findList[0].command[2], 16)

                  for(let i = starting ; i <= ending ; i++){
                     const checkChar = (number = i.toString(16)) => {
                        if(number.length < charNeeded)return checkChar(`0${number}`)

                        returnList[number] = referenceList[number]
                     }

                     checkChar()
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
            if(classClubData.teachers)teachersList = find(classClubData.teachers, 2, teachers)
            if(classClubData.workers)workersList = find(classClubData.workers, 2, workers)

            res.writeHead(200, {
               "Content-Type": "application/json"
            })

            res.end(JSON.stringify({
               className: classClubData.name,
               studentsList,
               teachersList,
               workersList
            }, null, 2))

            break

         case 'save_position':

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