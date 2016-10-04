# Design Rant Server
## TODO
 - Document the API
 - Add API methods for calculating scores
 - Perform NULL checks for all API METHODS
 - Implement OAuth via middleware

## DB Structure
### User
- username: string
- email: string
- hash: string

### Rant
- id: int
- text: string
- tags: string[]

### Comment
- id: int
- text: string

## RELATIONSHIPS
Create the nodes first and then add the relationship separately

### RANTED
- on: datetime

### HAS_COMMENT
- on: datetime

### UPVOTED
### DOWNVOTED
### COMMENTED

## Server Structure
API Listener - Query Controller - DB Connector

## API
- GET: /api - test api
- GET: /api/user/:username - gets user details
- POST: /api/user - create a new user
- GET: /api/feed - gets array of rants
- GET: /api/rant - gets a rant and it's comments
- POST: /api/rant - create a new rant
- POST: /api/rant/comment - add a new comment
