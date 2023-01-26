"use strict"

import fs from 'fs'
import http from 'http'
import zlib from 'zlib'
import readline from 'readline'

console.log('Startup initiated...')

// Data cache

const HTMLFiles = new Map()
const classes = new Map()
const students = new Map()
const teachers = new Map()
const workers = new Map()

// Functions

const loadHTMLFiles = () => {
   const HTMLDirectory = fs.readdirSync('./html')

   for(const HTMLFile of HTMLDirectory){
      HTMLFiles.set(HTMLFile.replace('.html', ''), fs.readFileSync(`./html/${HTMLFile}`))

      console.log(`File loaded: ${HTMLFile}`)
   }
}

const sendHTML = (res, HTMLFileName, statusCode = 200) => {
   const compressedHTML = zlib.gzipSync(HTMLFiles.get(HTMLFileName), { level: 9 })
   res.writeHead(statusCode, {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Encoding": "gzip"
   })
   res.end(compressedHTML)

}

console.log('Loading HTML files...')

loadHTMLFiles()

console.log('All files loaded: ', HTMLFiles)
console.log('HTML files successfully loaded into memory.')

console.log('Loading class, student and faculty list to memory...')

// process.exit()

http.createServer((req, res) => {
   const pathArray = req.url.split('/')

   if(req.method === 'POST'){
      switch(pathArray[1]){
         case 'find_id':
            req.on('data', chunk => {
               let data
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