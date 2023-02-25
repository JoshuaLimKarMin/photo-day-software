# Changelog

## Update 0.1.0.230225
- Finally added auto focus when initialization is ready in command-line html file
- Ping system completely working (Hopefully)
- Command-line web page script element edited heavily
- Bug fixes for command-line system
  - Can detect if the command exist (Causes the application to access data that isn't there and crashing)
  - Mode checks (Causes a crash)
  - Callback header check added fixing the missing callback execution in command handler (Causes a crash)
  - Utalization of the wrong syntax (Unexpected behaviour)

## Update 0.1.0.230224
- Command-line initialization complete
- Documentation on the Dtabase system (Note: will be outdated very soon)
- Relaod command hard coded into the command-line handler file because of the mistake of writing everything in ES6 and having the commands be written in ES5 so that I can have the reload functions
- Command-line can make changes on the application (Cannot interect with the Database at all)

## Update 0.1.0.230223
- Implemented WebSocket module
- Upgrade connection detection
- Commandline page can communicate with server but server is not handling any requests
- Schematics updated but will continue using previous version due to complexity
- Command-line system updated with the mode function partially implemented.

## Update 0.1.0.230222
- Command-line system
  - Complete implementation of the file loader
    - Changes to ignore all files ending with "Test Only File.js"(-tof.js) file extensions
  - Complete implementation of the reload function
    - Reload all commands
    - Reload for individual commands (File loader not ready)
  - Partial implementation of the command handler
- Schematic file for command file template (Won't be recognised as a real command)

## Update 0.1.0.230221
- Command-line system partially implemented
  - Read command files
  - Header requirements
- "load" command header
- "get" command header

## Update 0.1.0.230218
- Command-line HTML
- Changing the copyright data

## Update 0.1.0.230210
- HTML page layout completely changed
- HTML JavaScript updated with ability to add new inputs
- The inputs now automatically lock itself after pressing the add button (I should probably remove it or else I will be having a bigger issue with complains)
- Added copyright info at top
- Added partial CLI support, but it only closes the application (I should have started with this to begin with)

## Update 0.1.0.230209
- Minor HTML layout change
- Scrp HTML test layout
- Minor HTML JavaScript logic inprovements