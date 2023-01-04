const express = require('express')
const bodyParser = require('body-parser')
const {randomBytes} = require('crypto')
const cors = require('cors')
const axios = require('axios')

const app = express()
app.use(bodyParser.json())
app.use(cors())

const commentsByPostId = {

}

app.get('/posts/:id/comments', (req, res) => {
  res.send(commentsByPostId[req.params.id] || [])
})

app.post('/posts/:id/comments', (req, res) => {
  const commentId = randomBytes(4).toString('hex')
  const { content } = req.body
  const postId = req.params.id
  
  const comments = commentsByPostId[postId] || []

  const newComment = { id: commentId, content, status: 'pending', postId }
  comments.push(newComment)
  commentsByPostId[req.params.id] = comments
  console.log('comments - created', newComment)

  axios.post('http://event-bus-srv:4005/events', {
    type: 'CommentCreated',
    data: newComment
  })

  res.status(201).send(comments)
})

app.post('/events', async (req, res) => {
  const { type, data } = req.body
  
  if (type === 'CommentModerated') {
    const { id, postId, status } = data
    
    const comments = commentsByPostId[postId]
    const comment = comments.find(comment => {
      return comment.id === id
    })
    comment.status = status
    console.log('comments - moderated', data)

    await axios.post('http://event-bus-srv:4005/events', {
      type: 'CommentUpdated',
      data: {
        ...comment
      }
    })
  }

  res.send({})
})

app.listen(4001, () => {

})