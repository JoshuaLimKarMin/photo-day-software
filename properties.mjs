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

console.log('Loading HTML files...')

loadHTMLFiles()

console.log('All files loaded: ', HTMLFiles)
console.log('HTML files successfully loaded to memory.')

console.log('Loading class, student and faculty...')

loadData()

console.log('Class, student and faculty list loaded to memory.')

// process.exit()

http.createServer((req, res) => {
   const pathArray = req.url.split('/')

   if(req.method === 'POST'){
      switch(pathArray[1]){
         case 'find_id':
            req.on('data', chunk => {
               // let data
               let refID
               try{
                  refID = JSON.parse(chunk.toString()).photoID.replace('#', '')
                  // data = JSON.parse(chunk.toString())

               }catch(error){
                  console.log(error)

                  res.writeHead(400, {
                     "Content-Type": "application/json"
                  })

                  return res.end(JSON.stringify({
                     reason: "Syntax error, must be converted to JSON before sending to server"
                  }))
               }

               let exist = false
               let classClubData

               if(refID.startsWith('5'))for(const club of Object.keys(clubs)){
                  if(club === refID){
                     exist = true
                     classClubData = clubs[club]

                     break
                  }

               }else for(const class1 of Object.keys(classes)){
                  if(class1 === refID){
                     exist = true
                     classClubData = classes[class1]

                     break
                  }
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

               res.writeHead(200, {
                  "Content-Type": "application/json"
               })

               res.end(JSON.stringify({
                  className: classClubData.name,
                  studentList: {},
                  teacherList: {},
               }, null, 2))
            })
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