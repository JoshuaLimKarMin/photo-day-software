# WARNING
This is documentation is based on update 0.1.0.230224

WIll most likely be irrelevant tomorrow

<hr>

## Database save system

- Database saves to file structure that is very inconveniently organised to the point where it is easy to find the data, but is hard to read the code and make sense of any thing.

``` js
      switch(){pathArray[1]}{
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
```

- Based on the code above:
- 1. ```dynamicStore``` is:
``` js
const dynamicStore = './database/dynamic/'
```

- 2. ```refID``` is:

``` js
const refID = data.classClubID.replace('#', '')
```

- 3. Apparently, this idiot decided to store everything into cache. I think I was on drungs when I initially planned this part. There is no way that ```photoIDIndex``` is the dynamic database. It's naming is very misleading. Either which, the data set should look something like this:


| (iteration Index) | Key | Values 
|-|-|-
| 0 | '00' | { id: '00', position: [Object] }
| 1 | '50' | { id: '50', position: {} }
| 2 | 'd0' | { id: 'd0', position: {} }
| 3 | 'd1' | { id: 'd1', position: {} }
| 4 | 'd2' | { id: 'd2', position: {} }
| 5 | 'f0' | { id: 'f0', position: {} }

<br>
<hr>

### Now, the most important part. How is the database structured?
- The Fixed database houses the data that will only be read once on startup and never used ever again. Unless the changes were performed via CLI, the cache will not change and the application will require a restart for the changes to take effect.
- The dynamic database is where data is being modified, added and deleted. It's weirdly well organised and is easily understandable for those trained. The database is organised based on IDs. The category are as follows: 00, 10, 20 ... f0. Each following an incroment of 16 which is also based on the IDs.

<hr>

I'm aware that this most likely didn't help you Future Joshua. Just remember this thing the next time you code things like this, don't do shit like this and make an API based system!!!