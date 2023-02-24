module.exports = {
   command: 'load',
   alias: [],
   callback: (socket, args, text, cachedData) => {
      console.log(cachedData)
   }
}