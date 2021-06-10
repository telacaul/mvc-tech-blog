const router = require('express').Router();
const e = require('express');
const { User, Post, Comment  } = require('../../models');


// GET all users
router.get('/', (req, res) => {
    User.findAll({
        attributes: { exlude: ['password'] }
    })
    .then(userData => res.json(userData))
    .catch(err => {
        console.log(err);
        res.status(500).json(err);
    });
});


// GET single user
router.get('/:id', (req, res) => {
    User.findOne({
        attributes: { exlude: ['password'] },
        where: {
            id: req.params.id
        },
        include: [
            {
                model: Post,
                attributes: ['id', 'title', 'body', 'created_at']
            },
            {
                model: Comment,
                attributes: ['id', 'comment_text', 'created_at'],
                include: {
                    model: Post,
                    attributes: ['title']
                }
            }
        ]
    })
    .then(userData => {
        if (!userData) {
            res.status(404).json({ message: 'no user found with this id' });
            return;
        }
        res.json(userData);
    })
    .catch(err => {
        console.log(err);
        res.status(500).json(err);
    });
});


// create user - api/users
router.post('/', (req, res) => {
    User.create({
        username: req.body.username,
        password: req.body.password
    })
    .then(userData => {
        req.session.save(() => {
            req.session.user_id = userData.id;
            req.session.username = userData.username;
            req.session.loggedIn = true;

            res.json(userData);
        })
    })
});


// authentication 
router.post('/login', (req,res) => {
    User.findOne({
        where: {
            username: req.body.username
        }
    }).then(userData => {
        if (!userData) {
            res.status(400).json({ message: 'invalid username!' });
            return;
        }
        
        // Verify user
        const validPassword = userData.checkPassword(req.body.password);
    
        if (!validPassword) {
            res.status(400).json({ message: 'invalid password!' });
            return;
        }
    
        req.session.save(() => {
            // declare session variables
            req.session.user_id = userData.id;
            req.session.username = userData.username;
            req.session.loggedIn = true;
    
            res.json({ user: userData, message: 'You are now logged in!' })
        });
    });
});


// logout route
router.post('/logout', (req, res) => {
    if (req.session.loggedIn) {
        req.session.destroy(() => {
            res.status(204).end();
        })
    } 
    else {
        res.status(404).end();
    }
});


// DELETE /api/users/:id
router.delete('/:id', (req, res) => {
    User.destroy({
        where: {
            id: req.params.id
        }
    })
    .then(userData => {
        if (!userData) {
            res.status(400).json({ message: 'no user found with that id!' });
            return;
        }
        res.json(userData);
    })
    .catch(err => {
        console.log(err);
        res.status(500).json(err);
    });
});


module.exports = router;