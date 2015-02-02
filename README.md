
```
                          ________________
                          \      __      /         __
                           \_____()_____/         /  )
                           '============`        /  /
                            #---\  /---#        /  /
                           (# @\| |/@  #)      /  /
                            \   (_)   /       /  /
                            |\ '---` /|      /  /
                    _______/ \\_____// \____/ o_|
                   /       \  /     \  /   / o_|
                  / |           o|        / o_| \
                 /  |  _____     |       / /   \ \
                /   |  |===|    o|      / /\    \ \
               |    |   \@/      |     / /  \    \ \
               |    |___________o|__/----)   \    \/
               |    '              ||  --)    \     |
               |___________________||  --)     \    /
                    |           o|   ''''   |   \__/
                    |            |          |

                   TrafficCop - Request Throttler
```

# Installation

- Git clone this repo
- run 'npm install' in the project directory
- run 'node index.js' to startup the server

# Usage

Connect to ws://localhost:5000 and start sending messages

## Register new request
```javascript
data = {
  type: 'register',
  options: {
    name: 'yourname',
    rate: 40, // max call rate in calls per minute
  }
};

ws.send(JSON.stringify(data));
```

## Get request status
```javascript
data = {
  type: 'status',
  name: 'yourname', // Name of the request, blank or 'all' for all records
};

ws.send(JSON.stringify(data));
```
Expected response
```
{
  type: 'status',
  name: 'yourname',
  data: {
    name: yourname,
    clients: 2,
    interval: 3000,
  }
}
```

## Ask permission to make a request
```javascript
data = {
  type: 'request',
  name: 'yourname',
};

ws.send(JSON.stringify(data));
```
Eventually you'll get a trigger to actually make a request
```
{
  type: 'trigger',
  name: 'yourname'
}
```